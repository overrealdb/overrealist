import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { Icon, iconDatabase, iconPlus, iconRefresh, iconSearch } from "@surrealdb/ui";
import { useState } from "react";
import { useOverrealConnectors } from "~/hooks/overrealdb";
import type { Connector } from "~/types/overrealdb";
import clsx from "clsx";
import classes from "./style.module.scss";

const KIND_COLORS: Record<string, string> = {
	postgres: "blue",
	mysql: "orange",
	http: "teal",
	file: "gray",
	custom: "violet",
};

interface ConnectorListProps {
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	onCreate: () => void;
}

export function ConnectorList({ selectedId, onSelect, onCreate }: ConnectorListProps) {
	const { data: connectors, isLoading, refetch } = useOverrealConnectors();
	const [filter, setFilter] = useState("");

	const filtered = connectors?.filter(
		(c: Connector) =>
			!filter ||
			c.name.toLowerCase().includes(filter.toLowerCase()) ||
			c.kind.toLowerCase().includes(filter.toLowerCase()),
	);

	return (
		<Box className={classes.connectorListPanel}>
			<Stack gap="xs" p="sm">
				<Group justify="space-between" gap="xs">
					<Text fw={600} size="sm">
						Connectors
					</Text>
					<Group gap={4}>
						<ActionIcon variant="subtle" size="sm" onClick={() => refetch()}>
							<Icon path={iconRefresh} />
						</ActionIcon>
						<ActionIcon
							variant="subtle"
							size="sm"
							color="surreal"
							onClick={onCreate}
						>
							<Icon path={iconPlus} />
						</ActionIcon>
					</Group>
				</Group>

				<TextInput
					size="xs"
					placeholder="Filter connectors..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					leftSection={<Icon path={iconSearch} size="sm" />}
				/>
			</Stack>

			<ScrollArea flex={1}>
				<Stack gap={2} px="sm" pb="sm">
					{isLoading ? (
						<Loader size="sm" />
					) : filtered && filtered.length > 0 ? (
						filtered.map((conn: Connector) => (
							<Box
								key={conn.id}
								className={clsx(
									classes.connectorItem,
									selectedId === conn.id && classes.connectorItemActive,
								)}
								onClick={() => onSelect(conn.id)}
							>
								<Group gap="xs" wrap="nowrap" justify="space-between">
									<Box style={{ overflow: "hidden" }}>
										<Group gap="xs" wrap="nowrap">
											<Icon path={iconDatabase} size="sm" />
											<Text size="sm" fw={500} truncate>
												{conn.name}
											</Text>
										</Group>
										<Text size="xs" c="dimmed" truncate>
											{conn.kind}
										</Text>
									</Box>
									<Badge
										size="xs"
										color={KIND_COLORS[conn.kind] ?? "gray"}
										variant="light"
									>
										{conn.kind}
									</Badge>
								</Group>
							</Box>
						))
					) : (
						<Text size="xs" c="dimmed" ta="center" py="lg">
							No connectors found
						</Text>
					)}
				</Stack>
			</ScrollArea>

			<Box p="sm" style={{ borderTop: "1px solid var(--mantine-color-obsidian-6)" }}>
				<Button
					fullWidth
					size="xs"
					variant="gradient"
					leftSection={<Icon path={iconPlus} />}
					onClick={onCreate}
				>
					Create connector
				</Button>
			</Box>
		</Box>
	);
}
