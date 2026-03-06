import { Badge, Box, Loader, Stack, Text, Tree } from "@mantine/core";
import { useOverrealConnectorSchema } from "~/hooks/overrealdb";

interface SchemaBrowserProps {
	connectorId: string;
}

export function SchemaBrowser({ connectorId }: SchemaBrowserProps) {
	const { data: schema, isLoading, isError } = useOverrealConnectorSchema(connectorId);

	if (isLoading) {
		return (
			<Box p="sm">
				<Loader size="sm" />
			</Box>
		);
	}

	if (isError || !schema) {
		return (
			<Box p="sm">
				<Text size="xs" c="dimmed">
					Unable to introspect schema
				</Text>
			</Box>
		);
	}

	if (schema.tables.length === 0) {
		return (
			<Box p="sm">
				<Text size="xs" c="dimmed">
					No tables found
				</Text>
			</Box>
		);
	}

	return (
		<Box p="sm">
			<Text fw={600} size="xs" mb="xs">
				Database Schema
			</Text>
			<Stack gap={4}>
				{schema.tables.map((table) => (
					<Box key={table.name}>
						<Text size="xs" fw={500}>
							{table.name}
							{table.row_count !== undefined && (
								<Badge size="xs" variant="light" ml="xs">
									{table.row_count} rows
								</Badge>
							)}
						</Text>
						<Stack gap={1} pl="md" mt={2}>
							{table.columns.map((col) => (
								<Text key={col.name} size="xs" c="dimmed">
									{col.is_primary_key ? "* " : "  "}
									{col.name}{" "}
									<Badge size="xs" variant="outline">
										{col.data_type}
									</Badge>
									{col.nullable && (
										<Text span size="xs" c="dimmed">
											{" "}nullable
										</Text>
									)}
								</Text>
							))}
						</Stack>
					</Box>
				))}
			</Stack>
		</Box>
	);
}
