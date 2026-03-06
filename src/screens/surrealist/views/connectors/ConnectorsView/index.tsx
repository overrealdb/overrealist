import {
	Box,
	Button,
	Group,
	Loader,
	Modal,
	NativeSelect,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconCheck, iconDatabase, iconPlus } from "@surrealdb/ui";
import { useCallback, useState } from "react";
import { Introduction } from "~/components/Introduction";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { useViewFocus } from "~/hooks/routing";
import { useOverrealConnectors, useOverrealCreateConnector, useOverrealHealth } from "~/hooks/overrealdb";
import { showNotification } from "@mantine/notifications";
import { showErrorNotification } from "~/util/helpers";
import { ConnectorList } from "../ConnectorList";
import { ConnectorDetail } from "../ConnectorDetail";
import classes from "./style.module.scss";

const CONNECTOR_KINDS = [
	{ value: "postgres", label: "PostgreSQL" },
	{ value: "mysql", label: "MySQL" },
	{ value: "http", label: "HTTP" },
	{ value: "file", label: "File" },
	{ value: "custom", label: "Custom" },
];

export function ConnectorsView() {
	const enabled = useConfigStore((s) => s.settings.overrealdb.enabled);
	const { data: health, isLoading: isHealthLoading } = useOverrealHealth();
	const { refetch } = useOverrealConnectors();
	const isConnected = enabled && health?.status === "ok";
	const createConnector = useOverrealCreateConnector();

	const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
	const [showCreate, showCreateHandle] = useDisclosure();
	const [createForm, setCreateForm] = useState({
		name: "",
		kind: "postgres",
		connection_string: "",
		description: "",
	});

	const handleCreate = useStable(() => {
		if (!createForm.name) return;
		createConnector.mutate(
			{
				name: createForm.name,
				kind: createForm.kind,
				connection_string: createForm.connection_string || undefined,
				description: createForm.description || undefined,
				enabled: true,
				write_enabled: false,
				config: {},
			},
			{
				onSuccess: (conn) => {
					showCreateHandle.close();
					setCreateForm({ name: "", kind: "postgres", connection_string: "", description: "" });
					setSelectedConnectorId(conn.id);
					showNotification({
						title: "Connector created",
						message: "The connector has been created successfully",
					});
				},
				onError: (err: Error) => {
					showErrorNotification({
						title: "Failed to create connector",
						content: err.message,
					});
				},
			},
		);
	});

	const handleDeleted = useCallback(() => {
		setSelectedConnectorId(null);
	}, []);

	useViewFocus("connectors", () => {
		refetch();
	});

	if (!enabled) {
		return (
			<Introduction title="Connectors" icon={iconDatabase}>
				<Text>
					Enable overrealdb in Settings to manage data connectors. Connectors
					bridge external databases, APIs, and files into your pipelines.
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
			<Introduction title="Connectors" icon={iconDatabase}>
				<Text>
					Unable to connect to the overrealdb engine. Verify the engine
					URL in Settings and ensure the engine is running.
				</Text>
			</Introduction>
		);
	}

	return (
		<>
			<Box className={classes.connectorsLayout}>
				<ConnectorList
					selectedId={selectedConnectorId}
					onSelect={setSelectedConnectorId}
					onCreate={showCreateHandle.open}
				/>
				<ConnectorDetail
					connectorId={selectedConnectorId}
					onDeleted={handleDeleted}
				/>
			</Box>

			<Modal
				opened={showCreate}
				onClose={showCreateHandle.close}
				title={<PrimaryTitle>Create connector</PrimaryTitle>}
				size="md"
			>
				<Stack>
					<TextInput
						label="Name"
						placeholder="my-postgres"
						value={createForm.name}
						onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
						required
					/>
					<NativeSelect
						label="Type"
						data={CONNECTOR_KINDS}
						value={createForm.kind}
						onChange={(e) => setCreateForm({ ...createForm, kind: e.target.value })}
					/>
					<TextInput
						label="Connection String"
						placeholder="postgres://user:pass@host:5432/db"
						value={createForm.connection_string}
						onChange={(e) =>
							setCreateForm({ ...createForm, connection_string: e.target.value })
						}
					/>
					<TextInput
						label="Description"
						placeholder="Production analytics database"
						value={createForm.description}
						onChange={(e) =>
							setCreateForm({ ...createForm, description: e.target.value })
						}
					/>
					<Group mt="md" justify="flex-end">
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
							loading={createConnector.isPending}
							disabled={!createForm.name}
							leftSection={<Icon path={iconPlus} />}
						>
							Create
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}

export default ConnectorsView;
