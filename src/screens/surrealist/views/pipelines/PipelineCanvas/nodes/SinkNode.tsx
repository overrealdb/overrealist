import { Paper, Text, Group } from "@mantine/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, iconExplorer } from "@surrealdb/ui";
import { themed } from "~/util/overreal-colors";

export function SinkNode({ data }: NodeProps) {
	const color = themed("sink");
	return (
		<Paper
			withBorder
			p="sm"
			w={180}
			style={{
				borderColor: color,
				borderLeftWidth: 3,
			}}
		>
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: color }}
			/>
			<Group
				gap="xs"
				wrap="nowrap"
			>
				<Icon
					path={iconExplorer}
					size="sm"
					color={color}
				/>
				<Text
					size="sm"
					fw={500}
					truncate
				>
					{(data as Record<string, unknown>).label as string ?? "Sink"}
				</Text>
			</Group>
			<Text
				size="xs"
				c="dimmed"
				mt={4}
			>
				{(data as Record<string, unknown>).kind as string ?? "surrealdb_sink"}
			</Text>
		</Paper>
	);
}
