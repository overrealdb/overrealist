import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Code,
	Group,
	Loader,
	Modal,
	Paper,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	Icon,
	iconBook,
	iconClose,
	iconRefresh,
	iconSearch,
	iconUpload,
} from "@surrealdb/ui";
import { memo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adapter } from "~/adapter";
import { Introduction } from "~/components/Introduction";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { useViewFocus } from "~/hooks/routing";
import {
	type KnowledgeSearchResult,
	useOverrealHealth,
	useOverrealKnowledgeSearch,
} from "~/hooks/overrealdb";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";

interface KnowledgeChunk {
	id: string;
	content: string;
	source?: string;
	parent_id?: string;
	metadata?: Record<string, unknown>;
}

function SearchResultCard({
	result,
	onSelect,
}: { result: KnowledgeSearchResult; onSelect: () => void }) {
	return (
		<Card
			withBorder
			padding="sm"
			style={{ cursor: "pointer" }}
			onClick={onSelect}
		>
			<Group
				justify="space-between"
				mb="xs"
			>
				<Badge
					size="sm"
					variant="light"
				>
					{result.parent || "unknown"}
				</Badge>
				<Text
					size="xs"
					c="dimmed"
				>
					distance: {result.distance.toFixed(4)}
				</Text>
			</Group>
			<Text
				size="sm"
				lineClamp={3}
			>
				{result.content}
			</Text>
		</Card>
	);
}

const SearchResultCardMemo = memo(SearchResultCard);

export function KnowledgeView() {
	const engineUrl = useConfigStore((s) => s.settings.overrealdb.engineUrl);
	const enabled = useConfigStore((s) => s.settings.overrealdb.enabled);
	const queryClient = useQueryClient();

	const { data: health } = useOverrealHealth();
	const isConnected = enabled && health?.status === "ok";

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedChunk, setSelectedChunk] = useState<KnowledgeSearchResult | null>(null);
	const [ingestText, setIngestText] = useState("");
	const [ingestSource, setIngestSource] = useState("");
	const [showIngest, showIngestHandle] = useDisclosure();

	const search = useOverrealKnowledgeSearch();

	const handleSearch = useStable(() => {
		if (!searchQuery.trim()) return;
		search.mutate({ query: searchQuery, topK: 10 });
	});

	// Fetch chunks list
	const chunks = useQuery({
		queryKey: ["overrealdb", "chunks"],
		enabled: isConnected,
		queryFn: async () => {
			const base = engineUrl.replace(/\/$/, "");
			const response = await adapter.fetch(`${base}/knowledge/chunks?limit=50`);

			if (!response.ok) return [];
			return response.json() as Promise<KnowledgeChunk[]>;
		},
	});

	const ingest = useMutation({
		mutationFn: async ({ content, source }: { content: string; source: string }) => {
			const base = engineUrl.replace(/\/$/, "");
			const response = await adapter.fetch(`${base}/knowledge/ingest`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					documents: [{ content, source, metadata: {} }],
				}),
			});

			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(`Ingest failed: ${text}`);
			}

			return response.json();
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "chunks"] });
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
	});

	const handleIngest = useStable(() => {
		if (!ingestText.trim() || !ingestSource.trim()) return;
		ingest.mutate({ content: ingestText, source: ingestSource });
	});

	useViewFocus("knowledge", () => {
		chunks.refetch();
	});

	if (!enabled) {
		return (
			<Introduction
				title="Knowledge"
				icon={iconBook}
			>
				<Text>
					Enable overrealdb in Settings to explore and manage the
					knowledge graph. Documents are chunked, embedded, and stored
					for semantic search.
				</Text>
			</Introduction>
		);
	}

	if (!isConnected) {
		return (
			<Introduction
				title="Knowledge"
				icon={iconBook}
			>
				<Text>
					Unable to connect to the overrealdb engine. Verify the engine
					URL in Settings and ensure the engine is running.
				</Text>
			</Introduction>
		);
	}

	return (
		<>
			<Box
				h="100%"
				pr="lg"
				pb="lg"
				pl={{ base: "lg", md: 0 }}
			>
				<Stack
					h="100%"
					gap="lg"
				>
					<Group justify="space-between">
						<Text
							fw={600}
							fz="lg"
						>
							Knowledge Graph
						</Text>
						<Group gap="xs">
							<ActionIcon
								variant="subtle"
								onClick={() => chunks.refetch()}
							>
								<Icon path={iconRefresh} />
							</ActionIcon>
							<Button
								variant="light"
								color="obsidian"
								leftSection={<Icon path={iconUpload} />}
								onClick={showIngestHandle.open}
							>
								Ingest document
							</Button>
						</Group>
					</Group>

					{/* Search bar */}
					<Group gap="xs">
						<TextInput
							flex={1}
							placeholder="Search knowledge graph..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							leftSection={<Icon path={iconSearch} />}
						/>
						<Button
							variant="gradient"
							onClick={handleSearch}
							loading={search.isPending}
						>
							Search
						</Button>
					</Group>

					<ScrollArea flex={1}>
						{/* Search results */}
						{search.data ? (
							<Stack gap="sm">
								<Group justify="space-between">
									<Text
										fw={500}
										size="sm"
									>
										Search results ({search.data.count})
									</Text>
									<ActionIcon
										variant="subtle"
										size="sm"
										onClick={() => search.reset()}
									>
										<Icon path={iconClose} />
									</ActionIcon>
								</Group>

								{search.data.results.length > 0 ? (
									search.data.results.map((result) => (
										<SearchResultCardMemo
											key={result.chunk_id}
											result={result}
											onSelect={() => setSelectedChunk(result)}
										/>
									))
								) : (
									<Text
										size="sm"
										c="dimmed"
									>
										No results found
									</Text>
								)}

								{selectedChunk && (
									<Paper
										withBorder
										p="md"
										mt="sm"
									>
										<Group
											justify="space-between"
											mb="sm"
										>
											<Text fw={500}>Chunk detail</Text>
											<ActionIcon
												variant="subtle"
												size="sm"
												onClick={() => setSelectedChunk(null)}
											>
												<Icon path={iconClose} />
											</ActionIcon>
										</Group>
										<Code block>{selectedChunk.content}</Code>
										{selectedChunk.metadata && (
											<Code
												block
												mt="sm"
											>
												{JSON.stringify(selectedChunk.metadata, null, 2)}
											</Code>
										)}
									</Paper>
								)}
							</Stack>
						) : chunks.isLoading ? (
							<Loader />
						) : chunks.data && chunks.data.length > 0 ? (
							<Stack gap="xs">
								<Text
									fw={500}
									size="sm"
								>
									Recent chunks ({chunks.data.length})
								</Text>
								{chunks.data.map((chunk) => (
									<Card
										key={chunk.id}
										withBorder
										padding="sm"
									>
										<Group
											justify="space-between"
											mb="xs"
										>
											<Badge
												size="xs"
												variant="light"
											>
												{chunk.source ?? "unknown"}
											</Badge>
											<Text
												size="xs"
												c="dimmed"
												ff="mono"
											>
												{chunk.id}
											</Text>
										</Group>
										<Text
											size="sm"
											lineClamp={2}
										>
											{chunk.content}
										</Text>
									</Card>
								))}
							</Stack>
						) : (
							<Introduction
								title="No knowledge yet"
								icon={iconBook}
							>
								<Text>
									Ingest documents to build the knowledge graph. The engine
									will chunk, embed, and index them for semantic search.
								</Text>
								<Button
									variant="gradient"
									leftSection={<Icon path={iconUpload} />}
									onClick={showIngestHandle.open}
								>
									Ingest document
								</Button>
							</Introduction>
						)}
					</ScrollArea>
				</Stack>
			</Box>

			{/* Ingest modal */}
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
							loading={ingest.isPending}
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

export default KnowledgeView;
