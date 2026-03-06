import { ActionIcon, Box, Group, Loader, Text, Tooltip } from "@mantine/core";
import { Icon, iconRefresh, iconSearch } from "@surrealdb/ui";
import { useEffect, useRef, useCallback } from "react";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useOverrealKnowledgeGraph } from "~/hooks/overrealdb";
import { buildGraph, highlightMatches, resetHighlights } from "./graphSetup";
import type { GraphNode } from "~/types/overrealdb";
import classes from "./style.module.scss";

interface GraphPanelProps {
	searchQuery: string;
	onSelectNode: (nodeId: string, nodeType: GraphNode["type"]) => void;
}

export function GraphPanel({ searchQuery, onSelectNode }: GraphPanelProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const sigmaRef = useRef<Sigma | null>(null);
	const { data: graphData, isLoading, refetch } = useOverrealKnowledgeGraph();

	// Initialize and update graph
	useEffect(() => {
		if (!containerRef.current || !graphData) return;

		// Clean up previous instance
		if (sigmaRef.current) {
			sigmaRef.current.kill();
			sigmaRef.current = null;
		}

		const graph = buildGraph(graphData);

		// Apply force-directed layout
		if (graph.order > 0) {
			forceAtlas2.assign(graph, {
				iterations: 100,
				settings: {
					gravity: 1,
					scalingRatio: 2,
					barnesHutOptimize: graph.order > 100,
				},
			});
		}

		const renderer = new Sigma(graph, containerRef.current, {
			renderEdgeLabels: false,
			defaultEdgeType: "arrow",
			labelRenderedSizeThreshold: 6,
			labelColor: { color: "#CCCCCC" },
			labelFont: "'Outfit', system-ui, sans-serif",
			labelSize: 12,
		});

		// Click handler
		renderer.on("clickNode", ({ node }) => {
			const attrs = graph.getNodeAttributes(node);
			onSelectNode(node, (attrs.nodeType as GraphNode["type"]) ?? "entity");
		});

		sigmaRef.current = renderer;

		return () => {
			renderer.kill();
			sigmaRef.current = null;
		};
	}, [graphData, onSelectNode]);

	// Search highlight
	useEffect(() => {
		if (!sigmaRef.current) return;
		const graph = sigmaRef.current.getGraph();

		if (searchQuery.trim()) {
			highlightMatches(graph, searchQuery);
		} else {
			resetHighlights(graph);
		}

		sigmaRef.current.refresh();
	}, [searchQuery]);

	const handleZoomIn = useCallback(() => {
		const camera = sigmaRef.current?.getCamera();
		if (camera) camera.animatedZoom({ duration: 200 });
	}, []);

	const handleZoomOut = useCallback(() => {
		const camera = sigmaRef.current?.getCamera();
		if (camera) camera.animatedUnzoom({ duration: 200 });
	}, []);

	const handleReset = useCallback(() => {
		const camera = sigmaRef.current?.getCamera();
		if (camera) camera.animatedReset({ duration: 300 });
	}, []);

	if (isLoading) {
		return (
			<Box className={classes.graphPanel}>
				<Box className={classes.emptyState}>
					<Loader />
					<Text
						size="sm"
						c="dimmed"
					>
						Loading knowledge graph...
					</Text>
				</Box>
			</Box>
		);
	}

	if (!graphData || (graphData.nodes.length === 0 && graphData.edges.length === 0)) {
		return (
			<Box className={classes.graphPanel}>
				<Box className={classes.emptyState}>
					<Icon
						path={iconSearch}
						size="xl"
						color="dimmed"
					/>
					<Text
						size="sm"
						c="dimmed"
					>
						No graph data available. Ingest documents to populate the knowledge graph.
					</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box className={classes.graphPanel}>
			<Box
				ref={containerRef}
				className={classes.graphContainer}
			/>

			<Group
				className={classes.graphControls}
				gap={4}
			>
				<Tooltip label="Zoom in">
					<ActionIcon
						variant="filled"
						color="obsidian"
						size="sm"
						onClick={handleZoomIn}
					>
						+
					</ActionIcon>
				</Tooltip>
				<Tooltip label="Zoom out">
					<ActionIcon
						variant="filled"
						color="obsidian"
						size="sm"
						onClick={handleZoomOut}
					>
						-
					</ActionIcon>
				</Tooltip>
				<Tooltip label="Reset view">
					<ActionIcon
						variant="filled"
						color="obsidian"
						size="sm"
						onClick={handleReset}
					>
						<Icon path={iconRefresh} />
					</ActionIcon>
				</Tooltip>
			</Group>
		</Box>
	);
}
