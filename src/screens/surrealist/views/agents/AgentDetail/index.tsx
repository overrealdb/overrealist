import {
	Box,
	Button,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Tabs,
	Text,
} from "@mantine/core";
import { Icon, iconCheck, iconDelete, iconSidekick } from "@surrealdb/ui";
import { useEffect, useState } from "react";
import {
	useOverrealAgent,
	useOverrealDeleteSession,
	useOverrealUpdateAgent,
} from "~/hooks/overrealdb";
import { useStable } from "~/hooks/stable";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";
import type { AgentDetail as AgentDetailType } from "~/types/overrealdb";
import { IdentityTab } from "./IdentityTab";
import { PromptTab } from "./PromptTab";
import { ToolsTab } from "./ToolsTab";
import { McpTab } from "./McpTab";
import { MemoryTab } from "./MemoryTab";
import classes from "./style.module.scss";

const DEFAULT_AGENT: AgentDetailType = {
	id: "",
	name: "",
	description: "",
	model: "",
	enabled: true,
	system_prompt: "",
	tools: [],
	mcp_endpoints: [],
	memory_enabled: false,
	temperature: 0.7,
	max_tokens: 4096,
};

interface AgentDetailProps {
	agentId: string | null;
	onDeleted: () => void;
}

export function AgentDetail({ agentId, onDeleted }: AgentDetailProps) {
	const { data: agentData, isLoading } = useOverrealAgent(agentId);
	const updateAgent = useOverrealUpdateAgent();
	const [draft, setDraft] = useState<AgentDetailType>(DEFAULT_AGENT);
	const [isDirty, setIsDirty] = useState(false);

	useEffect(() => {
		if (agentData) {
			setDraft(agentData);
			setIsDirty(false);
		}
	}, [agentData]);

	const handleChange = useStable((updates: Partial<AgentDetailType>) => {
		setDraft((prev) => ({ ...prev, ...updates }));
		setIsDirty(true);
	});

	const handleSave = useStable(() => {
		if (!agentId) return;
		updateAgent.mutate(
			{ id: agentId, data: draft },
			{
				onSuccess: () => {
					setIsDirty(false);
					showNotification({
						title: "Agent saved",
						message: "Changes saved successfully",
					});
				},
				onError: (err: Error) => {
					showErrorNotification({
						title: "Failed to save",
						content: err.message,
					});
				},
			},
		);
	});

	if (!agentId) {
		return (
			<Box className={classes.detailPanel}>
				<Stack
					align="center"
					justify="center"
					h="100%"
					gap="sm"
				>
					<Icon
						path={iconSidekick}
						size="xl"
						color="dimmed"
					/>
					<Text
						size="sm"
						c="dimmed"
					>
						Select an agent to configure
					</Text>
				</Stack>
			</Box>
		);
	}

	if (isLoading) {
		return (
			<Box className={classes.detailPanel}>
				<Stack
					align="center"
					justify="center"
					h="100%"
				>
					<Loader />
				</Stack>
			</Box>
		);
	}

	return (
		<Box className={classes.detailPanel}>
			<Group
				justify="space-between"
				p="sm"
				style={{ borderBottom: "1px solid var(--mantine-color-obsidian-6)" }}
			>
				<Text
					fw={600}
					size="lg"
				>
					{draft.name || "Untitled agent"}
				</Text>
				<Group gap="xs">
					<Button
						size="xs"
						variant="gradient"
						leftSection={<Icon path={iconCheck} />}
						onClick={handleSave}
						loading={updateAgent.isPending}
						disabled={!isDirty}
					>
						Save
					</Button>
				</Group>
			</Group>

			<Tabs
				defaultValue="identity"
				flex={1}
				style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
			>
				<Tabs.List px="sm">
					<Tabs.Tab value="identity">Identity</Tabs.Tab>
					<Tabs.Tab value="prompt">Prompt</Tabs.Tab>
					<Tabs.Tab value="tools">Tools</Tabs.Tab>
					<Tabs.Tab value="mcp">MCP</Tabs.Tab>
					<Tabs.Tab value="memory">Memory</Tabs.Tab>
				</Tabs.List>

				<ScrollArea flex={1}>
					<Box p="sm">
						<Tabs.Panel value="identity">
							<IdentityTab
								agent={draft}
								onChange={handleChange}
							/>
						</Tabs.Panel>
						<Tabs.Panel value="prompt">
							<PromptTab
								agent={draft}
								onChange={handleChange}
							/>
						</Tabs.Panel>
						<Tabs.Panel value="tools">
							<ToolsTab
								agent={draft}
								onChange={handleChange}
							/>
						</Tabs.Panel>
						<Tabs.Panel value="mcp">
							<McpTab
								agent={draft}
								onChange={handleChange}
							/>
						</Tabs.Panel>
						<Tabs.Panel value="memory">
							<MemoryTab
								agent={draft}
								onChange={handleChange}
							/>
						</Tabs.Panel>
					</Box>
				</ScrollArea>
			</Tabs>
		</Box>
	);
}
