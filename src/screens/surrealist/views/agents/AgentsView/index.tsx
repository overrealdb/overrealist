import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Loader,
	Modal,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	Icon,
	iconCheck,
	iconClose,
	iconDelete,
	iconEdit,
	iconPlus,
	iconRefresh,
	iconSidekick,
} from "@surrealdb/ui";
import { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adapter } from "~/adapter";
import { Introduction } from "~/components/Introduction";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { useViewFocus } from "~/hooks/routing";
import { type OverrealAgent, useOverrealAgents, useOverrealHealth } from "~/hooks/overrealdb";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";

interface AgentFormData {
	name: string;
	description: string;
	model: string;
	system_prompt: string;
}

const EMPTY_FORM: AgentFormData = {
	name: "",
	description: "",
	model: "",
	system_prompt: "",
};

function AgentCard({
	agent,
	onEdit,
	onDelete,
}: { agent: OverrealAgent; onEdit: () => void; onDelete: () => void }) {
	return (
		<Card
			withBorder
			padding="lg"
		>
			<Group
				justify="space-between"
				mb="xs"
			>
				<Group gap="sm">
					<Icon
						path={iconSidekick}
						size="sm"
					/>
					<Text
						fw={600}
						size="lg"
					>
						{agent.name}
					</Text>
				</Group>
				<Badge
					color={agent.enabled ? "green" : "gray"}
					variant="light"
				>
					{agent.enabled ? "Active" : "Disabled"}
				</Badge>
			</Group>

			{agent.description && (
				<Text
					size="sm"
					c="dimmed"
					mb="sm"
					lineClamp={2}
				>
					{agent.description}
				</Text>
			)}

			<Text
				size="xs"
				c="dimmed"
				mb="md"
			>
				Model: {agent.model}
			</Text>

			<Group gap="xs">
				<Button
					size="xs"
					variant="light"
					color="obsidian"
					leftSection={<Icon path={iconEdit} />}
					onClick={onEdit}
				>
					Edit
				</Button>
				<ActionIcon
					size="sm"
					variant="subtle"
					color="red"
					onClick={onDelete}
				>
					<Icon path={iconDelete} />
				</ActionIcon>
			</Group>
		</Card>
	);
}

const AgentCardMemo = memo(AgentCard);

export function AgentsView() {
	const engineUrl = useConfigStore((s) => s.settings.overrealdb.engineUrl);
	const enabled = useConfigStore((s) => s.settings.overrealdb.enabled);
	const queryClient = useQueryClient();

	const { data: health } = useOverrealHealth();
	const { data: agents, isLoading, refetch } = useOverrealAgents();
	const isConnected = enabled && health?.status === "ok";

	const [showForm, showFormHandle] = useDisclosure();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<AgentFormData>(EMPTY_FORM);

	const createAgent = useMutation({
		mutationFn: async (data: AgentFormData) => {
			const base = engineUrl.replace(/\/$/, "");
			const response = await adapter.fetch(`${base}/agents`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: data.name,
					description: data.description || undefined,
					model: data.model,
					system_prompt: data.system_prompt || undefined,
					tools: [],
					enabled: true,
				}),
			});

			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(`Failed to create agent: ${text}`);
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "agents"] });
			showFormHandle.close();
			setForm(EMPTY_FORM);
			showNotification({
				title: "Agent created",
				message: "The agent has been created successfully",
			});
		},
		onError: (err: Error) => {
			showErrorNotification({
				title: "Failed to create agent",
				content: err.message,
			});
		},
	});

	const updateAgent = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: AgentFormData }) => {
			const base = engineUrl.replace(/\/$/, "");
			const response = await adapter.fetch(`${base}/agents/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: data.name,
					description: data.description || undefined,
					model: data.model,
					system_prompt: data.system_prompt || undefined,
				}),
			});

			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(`Failed to update agent: ${text}`);
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "agents"] });
			showFormHandle.close();
			setEditingId(null);
			setForm(EMPTY_FORM);
		},
		onError: (err: Error) => {
			showErrorNotification({
				title: "Failed to update agent",
				content: err.message,
			});
		},
	});

	const deleteAgent = useMutation({
		mutationFn: async (id: string) => {
			const base = engineUrl.replace(/\/$/, "");
			const response = await adapter.fetch(`${base}/agents/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(`Failed to delete agent: ${text}`);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "agents"] });
		},
		onError: (err: Error) => {
			showErrorNotification({
				title: "Failed to delete agent",
				content: err.message,
			});
		},
	});

	const openCreator = useStable(() => {
		setEditingId(null);
		setForm(EMPTY_FORM);
		showFormHandle.open();
	});

	const openEditor = useStable((agent: OverrealAgent) => {
		setEditingId(agent.id);
		setForm({
			name: agent.name,
			description: agent.description ?? "",
			model: agent.model,
			system_prompt: "",
		});
		showFormHandle.open();
	});

	const handleSubmit = useStable(() => {
		if (editingId) {
			updateAgent.mutate({ id: editingId, data: form });
		} else {
			createAgent.mutate(form);
		}
	});

	useViewFocus("agents", () => {
		refetch();
	});

	if (!enabled) {
		return (
			<Introduction
				title="Agents"
				icon={iconSidekick}
			>
				<Text>
					Enable overrealdb in Settings to manage AI agents. Agents can
					query your database, search the knowledge graph, and chat with
					your users.
				</Text>
			</Introduction>
		);
	}

	if (!isConnected) {
		return (
			<Introduction
				title="Agents"
				icon={iconSidekick}
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
							AI Agents
						</Text>
						<Group gap="xs">
							<ActionIcon
								variant="subtle"
								onClick={() => refetch()}
							>
								<Icon path={iconRefresh} />
							</ActionIcon>
							<Button
								variant="gradient"
								leftSection={<Icon path={iconPlus} />}
								onClick={openCreator}
							>
								Create agent
							</Button>
						</Group>
					</Group>

					<ScrollArea flex={1}>
						{isLoading ? (
							<Loader />
						) : agents && agents.length > 0 ? (
							<SimpleGrid
								cols={{ base: 1, sm: 2, lg: 3 }}
								spacing="md"
							>
								{agents.map((agent) => (
									<AgentCardMemo
										key={agent.id}
										agent={agent}
										onEdit={() => openEditor(agent)}
										onDelete={() => deleteAgent.mutate(agent.id)}
									/>
								))}
							</SimpleGrid>
						) : (
							<Introduction
								title="No agents yet"
								icon={iconSidekick}
							>
								<Text>
									Create your first agent to start building AI-powered
									workflows with your SurrealDB data.
								</Text>
								<Button
									variant="gradient"
									leftSection={<Icon path={iconPlus} />}
									onClick={openCreator}
								>
									Create agent
								</Button>
							</Introduction>
						)}
					</ScrollArea>
				</Stack>
			</Box>

			<Modal
				opened={showForm}
				onClose={showFormHandle.close}
				title={
					<PrimaryTitle>
						{editingId ? "Edit agent" : "Create agent"}
					</PrimaryTitle>
				}
				size="lg"
			>
				<Stack>
					<TextInput
						label="Name"
						placeholder="my-agent"
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						required
					/>

					<TextInput
						label="Model"
						placeholder="qwen2.5:7b"
						value={form.model}
						onChange={(e) => setForm({ ...form, model: e.target.value })}
						required
					/>

					<TextInput
						label="Description"
						placeholder="A helpful assistant for..."
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
					/>

					<Textarea
						label="System prompt"
						placeholder="You are a helpful AI assistant..."
						value={form.system_prompt}
						onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
						minRows={4}
						maxRows={8}
						autosize
					/>

					<Group
						mt="md"
						justify="flex-end"
					>
						<Button
							variant="light"
							color="obsidian"
							onClick={showFormHandle.close}
						>
							Cancel
						</Button>
						<Button
							variant="gradient"
							onClick={handleSubmit}
							loading={createAgent.isPending || updateAgent.isPending}
							disabled={!form.name || !form.model}
							leftSection={<Icon path={editingId ? iconCheck : iconPlus} />}
						>
							{editingId ? "Save" : "Create"}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}

export default AgentsView;
