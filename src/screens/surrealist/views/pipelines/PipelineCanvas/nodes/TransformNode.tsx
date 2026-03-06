import { Paper, Text, Group } from "@mantine/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, iconFunction } from "@surrealdb/ui";
import { themed } from "~/util/overreal-colors";

export function TransformNode({ data }: NodeProps) {
	const color = themed("transform");
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
					path={iconFunction}
					size="sm"
					color={color}
				/>
				<Text
					size="sm"
					fw={500}
					truncate
				>
					{(data as Record<string, unknown>).label as string ?? "Transform"}
				</Text>
			</Group>
			<Text
				size="xs"
				c="dimmed"
				mt={4}
			>
				{(data as Record<string, unknown>).kind as string ?? "chunker"}
			</Text>
			<Handle
				type="source"
				position={Position.Right}
				style={{ background: color }}
			/>
		</Paper>
	);
}
