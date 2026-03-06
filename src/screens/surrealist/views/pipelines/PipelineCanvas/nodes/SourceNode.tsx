import { Paper, Text, Group } from "@mantine/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, iconDatabase } from "@surrealdb/ui";

export function SourceNode({ data }: NodeProps) {
	return (
		<Paper
			withBorder
			p="sm"
			w={180}
			style={{
				borderColor: "#3498DB",
				borderLeftWidth: 3,
			}}
		>
			<Group
				gap="xs"
				wrap="nowrap"
			>
				<Icon
					path={iconDatabase}
					size="sm"
					color="#3498DB"
				/>
				<Text
					size="sm"
					fw={500}
					truncate
				>
					{(data as Record<string, unknown>).label as string ?? "Source"}
				</Text>
			</Group>
			<Text
				size="xs"
				c="dimmed"
				mt={4}
			>
				{(data as Record<string, unknown>).kind as string ?? "file_connector"}
			</Text>
			<Handle
				type="source"
				position={Position.Right}
				style={{ background: "#3498DB" }}
			/>
		</Paper>
	);
}
