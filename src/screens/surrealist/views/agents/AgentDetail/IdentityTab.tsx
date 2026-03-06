import { Group, NumberInput, Select, Stack, Switch, TextInput } from "@mantine/core";
import type { AgentDetail } from "~/types/overrealdb";

interface IdentityTabProps {
	agent: AgentDetail;
	onChange: (updates: Partial<AgentDetail>) => void;
}

export function IdentityTab({ agent, onChange }: IdentityTabProps) {
	return (
		<Stack gap="md">
			<TextInput
				label="Name"
				value={agent.name}
				onChange={(e) => onChange({ name: e.target.value })}
				required
			/>
			<TextInput
				label="Description"
				value={agent.description ?? ""}
				onChange={(e) => onChange({ description: e.target.value })}
			/>
			<TextInput
				label="Model"
				placeholder="qwen2.5:7b"
				value={agent.model}
				onChange={(e) => onChange({ model: e.target.value })}
				required
			/>
			<Group grow>
				<NumberInput
					label="Temperature"
					value={agent.temperature}
					onChange={(val) => onChange({ temperature: Number(val) })}
					min={0}
					max={2}
					step={0.1}
					decimalScale={1}
				/>
				<NumberInput
					label="Max tokens"
					value={agent.max_tokens}
					onChange={(val) => onChange({ max_tokens: Number(val) })}
					min={1}
					max={128000}
					step={256}
				/>
			</Group>
			<Switch
				label="Enabled"
				checked={agent.enabled}
				onChange={(e) => onChange({ enabled: e.target.checked })}
			/>
		</Stack>
	);
}
