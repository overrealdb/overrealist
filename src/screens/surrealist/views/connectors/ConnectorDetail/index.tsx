import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Code,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Switch,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { Icon, iconCheck, iconClose, iconDelete, iconRefresh } from "@surrealdb/ui";
import { useCallback, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";
import { useStable } from "~/hooks/stable";
import {
	useOverrealConnector,
	useOverrealUpdateConnector,
	useOverrealDeleteConnector,
	useOverrealTestConnector,
} from "~/hooks/overrealdb";
import type { Connector, ConnectorHealth } from "~/types/overrealdb";
import { SchemaBrowser } from "../SchemaBrowser";

interface ConnectorDetailProps {
	connectorId: string | null;
	onDeleted: () => void;
}

export function ConnectorDetail({ connectorId, onDeleted }: ConnectorDetailProps) {
	const { data: connector, isLoading } = useOverrealConnector(connectorId);
	const updateConnector = useOverrealUpdateConnector();
	const deleteConnector = useOverrealDeleteConnector();
	const testConnector = useOverrealTestConnector();

	const [draft, setDraft] = useState<Partial<Connector>>({});
	const [isDirty, setIsDirty] = useState(false);
	const [testResult, setTestResult] = useState<ConnectorHealth | null>(null);
	const [showSchema, setShowSchema] = useState(false);

	useEffect(() => {
		if (connector) {
			setDraft({
				name: connector.name,
				description: connector.description,
				connection_string: connector.connection_string,
				config: connector.config,
				enabled: connector.enabled,
				write_enabled: connector.write_enabled,
			});
			setIsDirty(false);
			setTestResult(null);
		}
	}, [connector]);

	const handleChange = useCallback(
		(updates: Partial<Connector>) => {
			setDraft((prev) => ({ ...prev, ...updates }));
			setIsDirty(true);
		},
		[],
	);

	const handleSave = useStable(() => {
		if (!connectorId || !isDirty) return;
		updateConnector.mutate(
			{ id: connectorId, data: draft },
			{
				onSuccess: () => {
					setIsDirty(false);
					showNotification({ title: "Saved", message: "Connector updated" });
				},
				onError: (err: Error) => {
					showErrorNotification({ title: "Failed to update", content: err.message });
				},
			},
		);
	});

	const handleDelete = useStable(() => {
		if (!connectorId) return;
		deleteConnector.mutate(connectorId, {
			onSuccess: () => {
				showNotification({ title: "Deleted", message: "Connector removed" });
				onDeleted();
			},
			onError: (err: Error) => {
				showErrorNotification({ title: "Failed to delete", content: err.message });
			},
		});
	});

	const handleTest = useStable(() => {
		if (!connectorId) return;
		setTestResult(null);
		testConnector.mutate(connectorId, {
			onSuccess: (result) => {
				setTestResult(result);
			},
			onError: (err: Error) => {
				setTestResult({ connector_id: connectorId, healthy: false, message: err.message, checked_at: new Date().toISOString() });
			},
		});
	});

	if (!connectorId) {
		return (
			<Box
				flex={1}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text c="dimmed" size="sm">
					Select a connector to view details
				</Text>
			</Box>
		);
	}

	if (isLoading) {
		return (
			<Box
				flex={1}
				style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
			>
				<Loader />
			</Box>
		);
	}

	if (!connector) {
		return (
			<Box
				flex={1}
				style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
			>
				<Text c="dimmed" size="sm">
					Connector not found
				</Text>
			</Box>
		);
	}

	const isDbConnector = ["postgres", "mysql"].includes(connector.kind);

	return (
		<Box flex={1} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
			<Group p="sm" justify="space-between" style={{ borderBottom: "1px solid var(--mantine-color-obsidian-6)" }}>
				<Group gap="xs">
					<Text fw={600} size="sm">
						{connector.name}
					</Text>
					<Badge size="xs" variant="light">
						{connector.kind}
					</Badge>
					<Code fz="xs">{connector.id}</Code>
				</Group>
				<Group gap="xs">
					<Button
						size="xs"
						variant="light"
						onClick={handleTest}
						loading={testConnector.isPending}
						leftSection={<Icon path={iconRefresh} />}
					>
						Test
					</Button>
					{isDbConnector && (
						<Button
							size="xs"
							variant="light"
							onClick={() => setShowSchema(!showSchema)}
						>
							{showSchema ? "Hide Schema" : "Schema"}
						</Button>
					)}
					<Button
						size="xs"
						variant="gradient"
						onClick={handleSave}
						disabled={!isDirty}
						loading={updateConnector.isPending}
						leftSection={<Icon path={iconCheck} />}
					>
						Save
					</Button>
					<ActionIcon
						variant="subtle"
						color="red"
						size="sm"
						onClick={handleDelete}
						loading={deleteConnector.isPending}
					>
						<Icon path={iconDelete} />
					</ActionIcon>
				</Group>
			</Group>

			{testResult && (
				<Box p="sm" style={{ borderBottom: "1px solid var(--mantine-color-obsidian-6)" }}>
					<Badge
						color={testResult.healthy ? "green" : "red"}
						variant="light"
						size="sm"
					>
						{testResult.healthy ? "Healthy" : "Unhealthy"}
					</Badge>
					{testResult.message && (
						<Text size="xs" c="dimmed" mt={4}>
							{testResult.message}
						</Text>
					)}
				</Box>
			)}

			<ScrollArea flex={1}>
				<Stack p="sm" gap="sm">
					<TextInput
						label="Name"
						value={draft.name ?? ""}
						onChange={(e) => handleChange({ name: e.target.value })}
					/>
					<TextInput
						label="Description"
						value={draft.description ?? ""}
						onChange={(e) => handleChange({ description: e.target.value })}
					/>
					<TextInput
						label="Connection String"
						value={draft.connection_string ?? ""}
						onChange={(e) => handleChange({ connection_string: e.target.value })}
						placeholder={isDbConnector ? "postgres://user:pass@host/db" : "https://api.example.com"}
					/>
					<Textarea
						label="Config (JSON)"
						value={JSON.stringify(draft.config ?? {}, null, 2)}
						onChange={(e) => {
							try {
								handleChange({ config: JSON.parse(e.target.value) });
							} catch {
								// Keep raw text while user is typing
							}
						}}
						autosize
						minRows={3}
						maxRows={10}
						styles={{ input: { fontFamily: "monospace", fontSize: "0.8rem" } }}
					/>
					<Group gap="lg">
						<Switch
							label="Enabled"
							checked={draft.enabled ?? true}
							onChange={(e) => handleChange({ enabled: e.currentTarget.checked })}
						/>
						<Switch
							label="Write enabled"
							checked={draft.write_enabled ?? false}
							onChange={(e) => handleChange({ write_enabled: e.currentTarget.checked })}
						/>
					</Group>
				</Stack>

				{showSchema && isDbConnector && connectorId && (
					<SchemaBrowser connectorId={connectorId} />
				)}
			</ScrollArea>
		</Box>
	);
}
