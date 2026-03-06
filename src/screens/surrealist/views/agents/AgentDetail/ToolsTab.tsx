import { Card, Group, Loader, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import { useOverrealAgentTools } from "~/hooks/overrealdb";
import type { AgentDetail, AgentTool } from "~/types/overrealdb";
import classes from "./style.module.scss";
import clsx from "clsx";

interface ToolsTabProps {
	agent: AgentDetail;
	onChange: (updates: Partial<AgentDetail>) => void;
}

export function ToolsTab({ agent, onChange }: ToolsTabProps) {
	const { data: availableTools, isLoading } = useOverrealAgentTools();

	const toggleTool = (tool: AgentTool) => {
		const existing = agent.tools.find((t) => t.kind === tool.kind && t.name === tool.name);
		if (existing) {
			onChange({
				tools: agent.tools.map((t) =>
					t.kind === tool.kind && t.name === tool.name
						? { ...t, enabled: !t.enabled }
						: t,
				),
			});
		} else {
			onChange({
				tools: [...agent.tools, { ...tool, enabled: true }],
			});
		}
	};

	const isToolEnabled = (tool: AgentTool): boolean => {
		return agent.tools.some((t) => t.kind === tool.kind && t.name === tool.name && t.enabled);
	};

	if (isLoading) return <Loader />;

	return (
		<SimpleGrid
			cols={{ base: 1, sm: 2 }}
			spacing="sm"
		>
			{availableTools?.map((tool) => {
				const enabled = isToolEnabled(tool);
				return (
					<Card
						key={`${tool.kind}-${tool.name}`}
						withBorder
						padding="sm"
						className={clsx(classes.toolCard, enabled && classes.toolCardEnabled)}
						onClick={() => toggleTool(tool)}
					>
						<Group
							justify="space-between"
							wrap="nowrap"
						>
							<Stack gap={2}>
								<Text
									size="sm"
									fw={500}
								>
									{tool.name}
								</Text>
								<Text
									size="xs"
									c="dimmed"
									lineClamp={2}
								>
									{tool.description}
								</Text>
							</Stack>
							<Switch
								checked={enabled}
								onChange={() => toggleTool(tool)}
								onClick={(e) => e.stopPropagation()}
							/>
						</Group>
					</Card>
				);
			})}

			{(!availableTools || availableTools.length === 0) && (
				<Text
					size="sm"
					c="dimmed"
				>
					No tools available
				</Text>
			)}
		</SimpleGrid>
	);
}
