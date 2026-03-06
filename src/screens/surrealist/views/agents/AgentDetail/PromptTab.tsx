import { Stack, Textarea } from "@mantine/core";
import type { AgentDetail } from "~/types/overrealdb";

interface PromptTabProps {
	agent: AgentDetail;
	onChange: (updates: Partial<AgentDetail>) => void;
}

export function PromptTab({ agent, onChange }: PromptTabProps) {
	return (
		<Stack
			gap="md"
			h="100%"
		>
			<Textarea
				label="System prompt"
				placeholder="You are a helpful AI assistant..."
				value={agent.system_prompt}
				onChange={(e) => onChange({ system_prompt: e.target.value })}
				minRows={12}
				maxRows={30}
				autosize
				styles={{
					input: {
						fontFamily: "var(--mantine-font-family-monospace)",
						fontSize: "var(--mantine-font-size-sm)",
					},
				}}
			/>
		</Stack>
	);
}
