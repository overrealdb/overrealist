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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconDelete, iconPlus, iconRefresh } from "@surrealdb/ui";
import { useState } from "react";
import {
	useOverrealCreatePipeline,
	useOverrealDeletePipeline,
	useOverrealPipelines,
} from "~/hooks/overrealdb";
import { useStable } from "~/hooks/stable";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";
import classes from "./style.module.scss";
import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
	active: "green",
	idle: "gray",
	running: "violet",
	error: "red",
};

interface PipelineListProps {
	selectedId: string | null;
	onSelect: (id: string | null) => void;
}

export function PipelineList({ selectedId, onSelect }: PipelineListProps) {
	const { data: pipelines, isLoading, refetch } = useOverrealPipelines();
	const createPipeline = useOverrealCreatePipeline();
	const deletePipeline = useOverrealDeletePipeline();

	const [showCreate, showCreateHandle] = useDisclosure();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const handleCreate = useStable(() => {
		if (!name.trim()) return;
		createPipeline.mutate(
			{ name, description },
			{
				onSuccess: (pipeline) => {
					showCreateHandle.close();
					setName("");
					setDescription("");
					onSelect(pipeline.id);
					showNotification({
						title: "Pipeline created",
						message: `Created "${pipeline.name}"`,
					});
				},
				onError: (err: Error) => {
					showErrorNotification({
						title: "Failed to create pipeline",
						content: err.message,
					});
				},
			},
		);
	});

	const handleDelete = useStable((id: string) => {
		deletePipeline.mutate(id, {
			onSuccess: () => {
				if (selectedId === id) onSelect(null);
			},
		});
	});

	return (
		<>
			<Box className={classes.pipelineListPanel}>
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
							Pipelines
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
								onClick={showCreateHandle.open}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Group>
					</Group>
				</Stack>

				<ScrollArea flex={1}>
					<Stack
						gap={2}
						px="sm"
						pb="sm"
					>
						{isLoading ? (
							<Loader size="sm" />
						) : pipelines && pipelines.length > 0 ? (
							pipelines.map((pipeline) => (
								<Group
									key={pipeline.id}
									className={clsx(
										classes.pipelineItem,
										selectedId === pipeline.id && classes.pipelineItemActive,
									)}
									onClick={() => onSelect(pipeline.id)}
									justify="space-between"
									wrap="nowrap"
								>
									<Box style={{ overflow: "hidden" }}>
										<Text
											size="sm"
											fw={500}
											truncate
										>
											{pipeline.name}
										</Text>
										<Badge
											size="xs"
											color={STATUS_COLORS[pipeline.status] ?? "gray"}
											variant="light"
										>
											{pipeline.status}
										</Badge>
									</Box>
									<ActionIcon
										variant="subtle"
										size="xs"
										color="red"
										onClick={(e) => {
											e.stopPropagation();
											handleDelete(pipeline.id);
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
								No pipelines yet
							</Text>
						)}
					</Stack>
				</ScrollArea>

				<Box
					p="sm"
					style={{ borderTop: "1px solid var(--mantine-color-obsidian-6)" }}
				>
					<Button
						fullWidth
						size="xs"
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						onClick={showCreateHandle.open}
					>
						Create pipeline
					</Button>
				</Box>
			</Box>

			<Modal
				opened={showCreate}
				onClose={showCreateHandle.close}
				title={<PrimaryTitle>Create pipeline</PrimaryTitle>}
				size="md"
			>
				<Stack>
					<TextInput
						label="Name"
						placeholder="my-pipeline"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<TextInput
						label="Description"
						placeholder="Ingests data from..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<Group
						mt="md"
						justify="flex-end"
					>
						<Button
							variant="light"
							color="obsidian"
							onClick={showCreateHandle.close}
						>
							Cancel
						</Button>
						<Button
							variant="gradient"
							onClick={handleCreate}
							loading={createPipeline.isPending}
							disabled={!name.trim()}
							leftSection={<Icon path={iconPlus} />}
						>
							Create
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
