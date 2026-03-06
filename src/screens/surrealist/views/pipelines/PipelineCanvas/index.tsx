import { ActionIcon, Box, Group, Loader, Menu, Text, Tooltip } from "@mantine/core";
import { Icon, iconPlus, iconRelation } from "@surrealdb/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ReactFlow,
	Controls,
	Background,
	BackgroundVariant,
	useNodesState,
	useEdgesState,
	addEdge,
	type Connection,
	type Node,
	type Edge,
} from "@xyflow/react";
import { useOverrealPipeline, useOverrealUpdatePipeline } from "~/hooks/overrealdb";
import { STEP_KIND_LABELS, type StepKind } from "~/types/overrealdb";
import { SourceNode } from "./nodes/SourceNode";
import { TransformNode } from "./nodes/TransformNode";
import { SinkNode } from "./nodes/SinkNode";
import { AnimatedEdge } from "./edges/AnimatedEdge";
import classes from "./style.module.scss";

const NODE_TYPES = {
	source: SourceNode,
	transform: TransformNode,
	sink: SinkNode,
};

const EDGE_TYPES = {
	animated: AnimatedEdge,
};

const STEP_KIND_TO_NODE_TYPE: Record<StepKind, string> = {
	file_connector: "source",
	api_connector: "source",
	chunker: "transform",
	embedder: "transform",
	extractor: "transform",
	surrealdb_sink: "sink",
};

interface PipelineCanvasProps {
	pipelineId: string | null;
	onSelectStep: (stepId: string | null) => void;
}

export function PipelineCanvas({ pipelineId, onSelectStep }: PipelineCanvasProps) {
	const { data: pipeline, isLoading } = useOverrealPipeline(pipelineId);
	const updatePipeline = useOverrealUpdatePipeline();
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Sync pipeline data to ReactFlow state
	useEffect(() => {
		if (!pipeline) {
			setNodes([]);
			setEdges([]);
			return;
		}

		const flowNodes: Node[] = (pipeline.steps ?? []).map((step, i) => ({
			id: step.id,
			type: STEP_KIND_TO_NODE_TYPE[step.kind as StepKind] ?? "transform",
			position: step.position ?? { x: 100 + i * 220, y: 150 },
			data: {
				label: step.label ?? STEP_KIND_LABELS[step.kind as StepKind] ?? step.kind ?? "Step",
				kind: step.kind ?? "chunker",
				config: step.config,
			},
		}));

		const flowEdges: Edge[] = (pipeline.edges ?? []).map((edge) => ({
			id: `e-${edge.source}-${edge.target}`,
			source: edge.source,
			target: edge.target,
			type: "animated",
		}));

		setNodes(flowNodes);
		setEdges(flowEdges);
	}, [pipeline]);

	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((eds) => addEdge({ ...connection, type: "animated" }, eds));
		},
		[setEdges],
	);

	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			onSelectStep(node.id);
		},
		[onSelectStep],
	);

	const addNode = useCallback(
		(kind: StepKind) => {
			const id = `step-${Date.now()}`;
			const nodeType = STEP_KIND_TO_NODE_TYPE[kind] ?? "transform";
			const newNode: Node = {
				id,
				type: nodeType,
				position: { x: 100 + nodes.length * 220, y: 150 },
				data: {
					label: STEP_KIND_LABELS[kind],
					kind,
					config: {},
				},
			};
			setNodes((nds) => [...nds, newNode]);
		},
		[nodes.length, setNodes],
	);

	if (!pipelineId) {
		return (
			<Box className={classes.canvasPanel}>
				<Box className={classes.emptyCanvas}>
					<Icon
						path={iconRelation}
						size="xl"
						color="dimmed"
					/>
					<Text
						size="sm"
						c="dimmed"
					>
						Select a pipeline to edit
					</Text>
				</Box>
			</Box>
		);
	}

	if (isLoading) {
		return (
			<Box className={classes.canvasPanel}>
				<Box className={classes.emptyCanvas}>
					<Loader />
				</Box>
			</Box>
		);
	}

	return (
		<Box className={classes.canvasPanel}>
			{/* Toolbar */}
			<Group
				className={classes.toolbar}
				gap="xs"
			>
				<Menu shadow="md">
					<Menu.Target>
						<Tooltip label="Add step">
							<ActionIcon
								variant="filled"
								color="surreal"
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Tooltip>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>Sources</Menu.Label>
						<Menu.Item onClick={() => addNode("file_connector")}>
							File Connector
						</Menu.Item>
						<Menu.Item onClick={() => addNode("api_connector")}>
							API Connector
						</Menu.Item>
						<Menu.Label>Transforms</Menu.Label>
						<Menu.Item onClick={() => addNode("chunker")}>Chunker</Menu.Item>
						<Menu.Item onClick={() => addNode("embedder")}>Embedder</Menu.Item>
						<Menu.Item onClick={() => addNode("extractor")}>Extractor</Menu.Item>
						<Menu.Label>Sinks</Menu.Label>
						<Menu.Item onClick={() => addNode("surrealdb_sink")}>
							SurrealDB Sink
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>

			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={onNodeClick}
				nodeTypes={NODE_TYPES}
				edgeTypes={EDGE_TYPES}
				fitView
				proOptions={{ hideAttribution: true }}
			>
				<Controls />
				<Background
					variant={BackgroundVariant.Dots}
					gap={20}
					size={1}
					color="#333333"
				/>
			</ReactFlow>
		</Box>
	);
}
