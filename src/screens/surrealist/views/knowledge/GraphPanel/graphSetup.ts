import Graph from "graphology";
import type { GraphNode, GraphEdge, KnowledgeGraphData } from "~/types/overrealdb";

/** Node type → color mapping */
export const NODE_COLORS: Record<GraphNode["type"], string> = {
	entity: "#E67E22",
	document: "#3498DB",
	fact: "#2ECC71",
	community: "#9B59B6",
};

/** Node type → size mapping */
export const NODE_SIZES: Record<GraphNode["type"], number> = {
	entity: 8,
	document: 6,
	fact: 4,
	community: 10,
};

/**
 * Build a graphology graph from API response data.
 */
export function buildGraph(data: KnowledgeGraphData): Graph {
	const graph = new Graph({ multi: false, type: "directed" });

	for (const node of data.nodes) {
		if (!graph.hasNode(node.id)) {
			graph.addNode(node.id, {
				label: node.label,
				size: NODE_SIZES[node.type] ?? 6,
				color: NODE_COLORS[node.type] ?? "#888888",
				nodeType: node.type,
				x: Math.random() * 500,
				y: Math.random() * 500,
			});
		}
	}

	for (const edge of data.edges) {
		if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
			const key = `${edge.source}->${edge.target}`;
			if (!graph.hasEdge(key)) {
				graph.addEdgeWithKey(key, edge.source, edge.target, {
					label: edge.label,
					size: 1,
					color: "#555555",
				});
			}
		}
	}

	return graph;
}

/**
 * Highlight nodes matching a search query.
 * Returns set of matched node IDs.
 */
export function highlightMatches(graph: Graph, query: string): Set<string> {
	const matched = new Set<string>();
	const lower = query.toLowerCase();

	if (!lower) return matched;

	graph.forEachNode((nodeId, attrs) => {
		if ((attrs.label as string)?.toLowerCase().includes(lower)) {
			matched.add(nodeId);
		}
	});

	// Dim non-matching nodes
	graph.forEachNode((nodeId, attrs) => {
		const isMatch = matched.has(nodeId);
		graph.setNodeAttribute(nodeId, "color", isMatch
			? NODE_COLORS[attrs.nodeType as GraphNode["type"]] ?? "#E67E22"
			: "#333333");
	});

	return matched;
}

/**
 * Reset all node colors to defaults.
 */
export function resetHighlights(graph: Graph) {
	graph.forEachNode((nodeId, attrs) => {
		graph.setNodeAttribute(
			nodeId,
			"color",
			NODE_COLORS[attrs.nodeType as GraphNode["type"]] ?? "#888888",
		);
	});
}
