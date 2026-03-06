import {
	Box,
	Button,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconCheck, iconPlus, iconSidekick } from "@surrealdb/ui";
import { useCallback, useState } from "react";
import { Introduction } from "~/components/Introduction";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { useViewFocus } from "~/hooks/routing";
import { useOverrealAgents, useOverrealCreateAgent, useOverrealHealth } from "~/hooks/overrealdb";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";
import { AgentList } from "../AgentList";
import { AgentDetail } from "../AgentDetail";
import { ChatPreview } from "../ChatPreview";
import { OverrealErrorBoundary } from "~/components/OverrealErrorBoundary";
import classes from "./style.module.scss";

export function AgentsView() {
	const enabled = useConfigStore((s) => s.settings.overrealdb.enabled);
	const { data: health, isLoading: isHealthLoading } = useOverrealHealth();
	const { refetch } = useOverrealAgents();
	const isConnected = enabled && health?.status === "ok";
	const createAgent = useOverrealCreateAgent();

	const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
	const [showCreate, showCreateHandle] = useDisclosure();
	const [createForm, setCreateForm] = useState({ name: "", model: "", description: "" });

	const handleCreate = useStable(() => {
		if (!createForm.name || !createForm.model) return;
		createAgent.mutate(
			{
				name: createForm.name,
				model: createForm.model,
				description: createForm.description || undefined,
				enabled: true,
				system_prompt: "",
				tools: [],
				mcp_endpoints: [],
				memory_enabled: false,
				temperature: 0.7,
				max_tokens: 4096,
			},
			{
				onSuccess: (agent) => {
					showCreateHandle.close();
					setCreateForm({ name: "", model: "", description: "" });
					setSelectedAgentId(agent.id);
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
			},
		);
	});

	const handleDeleted = useCallback(() => {
		setSelectedAgentId(null);
	}, []);

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

	if (enabled && isHealthLoading) {
		return (
			<Box style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
				<Loader />
			</Box>
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
		<OverrealErrorBoundary fallbackTitle="Agents view error">
			<Box className={classes.agentsLayout}>
				<AgentList
					selectedId={selectedAgentId}
					onSelect={setSelectedAgentId}
					onCreate={showCreateHandle.open}
				/>
				<AgentDetail
					agentId={selectedAgentId}
					onDeleted={handleDeleted}
				/>
				<ChatPreview agentId={selectedAgentId} />
			</Box>

			<Modal
				opened={showCreate}
				onClose={showCreateHandle.close}
				title={<PrimaryTitle>Create agent</PrimaryTitle>}
				size="md"
			>
				<Stack>
					<TextInput
						label="Name"
						placeholder="my-agent"
						value={createForm.name}
						onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
						required
					/>
					<TextInput
						label="Model"
						placeholder="qwen2.5:7b"
						value={createForm.model}
						onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
						required
					/>
					<TextInput
						label="Description"
						placeholder="A helpful assistant for..."
						value={createForm.description}
						onChange={(e) =>
							setCreateForm({ ...createForm, description: e.target.value })
						}
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
							loading={createAgent.isPending}
							disabled={!createForm.name || !createForm.model}
							leftSection={<Icon path={iconPlus} />}
						>
							Create
						</Button>
					</Group>
				</Stack>
			</Modal>
		</OverrealErrorBoundary>
	);
}

export default AgentsView;
