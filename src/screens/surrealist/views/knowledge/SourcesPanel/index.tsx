import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Loader,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconBook, iconDelete, iconPlus, iconRefresh, iconSearch, iconUpload } from "@surrealdb/ui";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import {
	useOverrealDeduplicate,
	useOverrealKnowledgeDeleteSource,
	useOverrealKnowledgeIngest,
	useOverrealKnowledgeSources,
} from "~/hooks/overrealdb";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { KnowledgeSource } from "~/types/overrealdb";
import classes from "./style.module.scss";
import clsx from "clsx";

interface SourcesPanelProps {
	selectedSourceId: string | null;
	onSelectSource: (id: string | null) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onSearch: () => void;
}

export function SourcesPanel({
	selectedSourceId,
	onSelectSource,
	searchQuery,
	onSearchChange,
	onSearch,
}: SourcesPanelProps) {
	const { data: sources, isLoading, refetch } = useOverrealKnowledgeSources();
	const deleteSource = useOverrealKnowledgeDeleteSource();
	const ingestMutation = useOverrealKnowledgeIngest();
	const dedupMutation = useOverrealDeduplicate();

	const [showIngest, showIngestHandle] = useDisclosure();
	const [ingestText, setIngestText] = useState("");
	const [ingestSource, setIngestSource] = useState("");

	const handleIngest = useStable(() => {
		if (!ingestText.trim() || !ingestSource.trim()) return;
		ingestMutation.mutate(
			{ documents: [{ content: ingestText, source: ingestSource }] },
			{
				onSuccess: (result) => {
					showIngestHandle.close();
					setIngestText("");
					setIngestSource("");
					showNotification({
						title: "Document ingested",
						message: `Created ${result?.chunks_created ?? 0} chunks`,
					});
				},
				onError: (err: Error) => {
					showErrorNotification({
						title: "Ingest failed",
						content: err.message,
					});
				},
			},
		);
	});

	const handleDedup = useStable(() => {
		dedupMutation.mutate(0.85, {
			onSuccess: (report) => {
				showNotification({
					title: "Deduplication complete",
					message: `Scanned ${report.entities_scanned} entities, merged ${report.merged_count}`,
				});
			},
			onError: (err: Error) => {
				showErrorNotification({
					title: "Deduplication failed",
					content: err.message,
				});
			},
		});
	});

	const handleDelete = useStable((id: string) => {
		deleteSource.mutate(id, {
			onSuccess: () => {
				if (selectedSourceId === id) onSelectSource(null);
				showNotification({ title: "Source deleted", message: "Source and documents removed" });
			},
		});
	});

	return (
		<>
			<Box className={classes.sourcesPanel}>
				<Stack
					gap="xs"
					p="sm"
				>
					<Group
						justify="space-between"
						gap="xs"
					>
						<Text
							fw={600}
							size="sm"
						>
							Sources
						</Text>
						<Group gap={4}>
							<ActionIcon
								variant="subtle"
								size="sm"
								onClick={() => refetch()}
							>
								<Icon path={iconRefresh} />
							</ActionIcon>
							<ActionIcon
								variant="subtle"
								size="sm"
								color="surreal"
								onClick={showIngestHandle.open}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Group>
					</Group>

					<TextInput
						size="xs"
						placeholder="Search graph..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && onSearch()}
						leftSection={
							<Icon
								path={iconSearch}
								size="sm"
							/>
						}
					/>
				</Stack>

				<ScrollArea flex={1}>
					<Stack
						gap={2}
						px="sm"
						pb="sm"
					>
						{isLoading ? (
							<Loader size="sm" />
						) : sources && sources.length > 0 ? (
							sources.map((source) => (
								<Group
									key={source.id}
									className={clsx(
										classes.sourceItem,
										selectedSourceId === source.id && classes.sourceItemActive,
									)}
									onClick={() => onSelectSource(source.id)}
									justify="space-between"
									wrap="nowrap"
								>
									<Box style={{ overflow: "hidden" }}>
										<Text
											size="sm"
											fw={500}
											truncate
										>
											{source.name}
										</Text>
										<Text
											size="xs"
											c="dimmed"
										>
											{source.document_count} docs
										</Text>
									</Box>
									<ActionIcon
										variant="subtle"
										size="xs"
										color="red"
										onClick={(e) => {
											e.stopPropagation();
											handleDelete(source.id);
										}}
									>
										<Icon path={iconDelete} />
									</ActionIcon>
								</Group>
							))
						) : (
							<Text
								size="xs"
								c="dimmed"
								ta="center"
								py="lg"
							>
								No sources yet
							</Text>
						)}
					</Stack>
				</ScrollArea>

				<Stack
					p="sm"
					gap="xs"
					style={{ borderTop: "1px solid var(--mantine-color-obsidian-6)" }}
				>
					<Button
						fullWidth
						size="xs"
						variant="light"
						leftSection={<Icon path={iconUpload} />}
						onClick={showIngestHandle.open}
					>
						Ingest document
					</Button>
					<Button
						fullWidth
						size="xs"
						variant="light"
						color="violet"
						onClick={handleDedup}
						loading={dedupMutation.isPending}
					>
						Deduplicate entities
					</Button>
				</Stack>
			</Box>

			<Modal
				opened={showIngest}
				onClose={showIngestHandle.close}
				title={<PrimaryTitle>Ingest document</PrimaryTitle>}
				size="lg"
			>
				<Stack>
					<TextInput
						label="Source"
						placeholder="docs/surrealql-reference"
						value={ingestSource}
						onChange={(e) => setIngestSource(e.target.value)}
						required
					/>
					<Textarea
						label="Content"
						placeholder="Paste document content here..."
						value={ingestText}
						onChange={(e) => setIngestText(e.target.value)}
						minRows={8}
						maxRows={16}
						autosize
						required
					/>
					<Group
						mt="md"
						justify="flex-end"
					>
						<Button
							variant="light"
							color="obsidian"
							onClick={showIngestHandle.close}
						>
							Cancel
						</Button>
						<Button
							variant="gradient"
							onClick={handleIngest}
							loading={ingestMutation.isPending}
							disabled={!ingestText.trim() || !ingestSource.trim()}
							leftSection={<Icon path={iconUpload} />}
						>
							Ingest
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
