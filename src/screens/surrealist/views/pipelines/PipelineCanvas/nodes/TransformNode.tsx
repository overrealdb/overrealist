import { Paper, Text, Group } from "@mantine/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, iconFunction } from "@surrealdb/ui";

export function TransformNode({ data }: NodeProps) {
	return (
		<Paper
			withBorder
			p="sm"
			w={180}
			style={{
				borderColor: "#E67E22",
				borderLeftWidth: 3,
			}}
		>
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: "#E67E22" }}
			/>
			<Group
				gap="xs"
				wrap="nowrap"
			>
				<Icon
					path={iconFunction}
					size="sm"
					color="#E67E22"
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
				style={{ background: "#E67E22" }}
			/>
		</Paper>
	);
}
