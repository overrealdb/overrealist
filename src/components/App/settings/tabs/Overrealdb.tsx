import { Alert, Box, Button, ScrollArea, Switch, Text, TextInput } from "@mantine/core";
import { iconCheck, iconWarning } from "@surrealdb/ui";
import { useSetting } from "~/hooks/config";
import { useOverrealHealth } from "~/hooks/overrealdb";
import { SettingsSection } from "../utilities";

const CAT = "overrealdb";

export function OverrealdbTab() {
	const [enabled, setEnabled] = useSetting(CAT, "enabled");
	const [engineUrl, setEngineUrl] = useSetting(CAT, "engineUrl");
	const [defaultAgentId, setDefaultAgentId] = useSetting(CAT, "defaultAgentId");

	const health = useOverrealHealth();
	const isHealthy = health.data?.status === "ok";

	return (
		<ScrollArea
			pr="xl"
			flex={1}
			scrollbars="y"
			type="always"
			pb={32}
		>
			<Box m="xs">
				<Text
					mb="xl"
					maw={500}
				>
					Connect the Sidekick to an overrealdb engine for BYOK (Bring Your Own Key) AI
					chat with local LLMs, knowledge graph search, and agent tools.
				</Text>

				<SettingsSection label="Connection">
					<Switch
						label="Enable overrealdb engine"
						description="Use the overrealdb engine instead of Surreal Cloud for Sidekick chat"
						checked={enabled}
						onChange={(e) => setEnabled(e.currentTarget.checked)}
					/>

					<TextInput
						label="Engine URL"
						description="HTTP endpoint of the overrealdb engine"
						placeholder="http://localhost:3100"
						value={engineUrl}
						onChange={(e) => setEngineUrl(e.currentTarget.value)}
						disabled={!enabled}
					/>

					<TextInput
						label="Default Agent ID"
						description="Agent to use for new Sidekick sessions (leave empty for first available)"
						placeholder="docs-assistant"
						value={defaultAgentId}
						onChange={(e) => setDefaultAgentId(e.currentTarget.value)}
						disabled={!enabled}
					/>

					{enabled && (
						<Box mt="xs">
							{health.isLoading ? (
								<Text
									size="sm"
									c="dimmed"
								>
									Checking connection...
								</Text>
							) : isHealthy ? (
								<Alert
									color="green.8"
									variant="light"
									title="Connected"
								>
									Engine is healthy and responding.
								</Alert>
							) : (
								<Alert
									color="red.8"
									variant="light"
									title="Connection failed"
								>
									Could not reach the engine at {engineUrl}.{" "}
									{health.error ? String(health.error) : "Check that the engine is running."}
								</Alert>
							)}

							<Button
								mt="xs"
								variant="light"
								size="xs"
								onClick={() => health.refetch()}
							>
								Test connection
							</Button>
						</Box>
					)}
				</SettingsSection>
			</Box>
		</ScrollArea>
	);
}
