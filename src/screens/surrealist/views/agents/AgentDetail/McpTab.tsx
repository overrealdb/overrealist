import { ActionIcon, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { Icon, iconClose, iconPlus } from "@surrealdb/ui";
import type { AgentDetail } from "~/types/overrealdb";

interface McpTabProps {
	agent: AgentDetail;
	onChange: (updates: Partial<AgentDetail>) => void;
}

export function McpTab({ agent, onChange }: McpTabProps) {
	const addEndpoint = () => {
		onChange({ mcp_endpoints: [...agent.mcp_endpoints, ""] });
	};

	const updateEndpoint = (index: number, value: string) => {
		const updated = [...agent.mcp_endpoints];
		updated[index] = value;
		onChange({ mcp_endpoints: updated });
	};

	const removeEndpoint = (index: number) => {
		onChange({
			mcp_endpoints: agent.mcp_endpoints.filter((_, i) => i !== index),
		});
	};

	return (
		<Stack gap="md">
			<Text size="sm">
				Configure MCP (Model Context Protocol) endpoints that this agent
				can connect to for additional tools and context.
			</Text>

			{agent.mcp_endpoints.map((endpoint, i) => (
				<Group
					key={i}
					gap="xs"
				>
					<TextInput
						flex={1}
						placeholder="https://mcp-server.example.com"
						value={endpoint}
						onChange={(e) => updateEndpoint(i, e.target.value)}
					/>
					<ActionIcon
						variant="subtle"
						color="red"
						onClick={() => removeEndpoint(i)}
					>
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			))}

			<Button
				variant="light"
				size="xs"
				leftSection={<Icon path={iconPlus} />}
				onClick={addEndpoint}
				w="fit-content"
			>
				Add MCP endpoint
			</Button>
		</Stack>
	);
}
