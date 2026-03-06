import { Stack, Switch, Text } from "@mantine/core";
import type { AgentDetail } from "~/types/overrealdb";

interface MemoryTabProps {
	agent: AgentDetail;
	onChange: (updates: Partial<AgentDetail>) => void;
}

export function MemoryTab({ agent, onChange }: MemoryTabProps) {
	return (
		<Stack gap="md">
			<Switch
				label="Enable memory"
				description="Allow the agent to remember context across conversations"
				checked={agent.memory_enabled}
				onChange={(e) => onChange({ memory_enabled: e.target.checked })}
			/>
			<Text
				size="sm"
				c="dimmed"
			>
				When memory is enabled, the agent stores and retrieves relevant
				context from previous conversations to provide more personalized
				responses.
			</Text>
		</Stack>
	);
}
