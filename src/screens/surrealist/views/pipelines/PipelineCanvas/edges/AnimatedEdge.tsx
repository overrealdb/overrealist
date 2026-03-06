import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { themed } from "~/util/overreal-colors";

export function AnimatedEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
}: EdgeProps) {
	const [edgePath] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<BaseEdge
			path={edgePath}
			markerEnd={markerEnd}
			style={{
				...style,
				stroke: themed("transform"),
				strokeWidth: 2,
				strokeDasharray: "5 5",
				animation: "dash 1s linear infinite",
			}}
		/>
	);
}
