// Shared types for all overrealdb views
// Knowledge Graph, Pipeline Builder, Agent Builder

// ── Knowledge Graph ──────────────────────────────────────────────────

export interface KnowledgeSource {
	id: string;
	name: string;
	kind: string;
	document_count: number;
}

export interface KnowledgeDocument {
	id: string;
	source_id: string;
	title: string;
	chunk_count: number;
}

export interface KnowledgeEntity {
	id: string;
	name: string;
	entity_type: string;
	description: string;
}

export interface KnowledgeFact {
	id: string;
	subject: string;
	predicate: string;
	object: string;
}

export interface KnowledgeCommunity {
	id: string;
	title: string;
	summary: string;
	member_count: number;
}

export interface GraphNode {
	id: string;
	label: string;
	type: "entity" | "document" | "fact" | "community";
}

export interface GraphEdge {
	source: string;
	target: string;
	label: string;
}

export interface KnowledgeGraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

// ── Pipeline Builder ─────────────────────────────────────────────────

export interface Pipeline {
	id: string;
	name: string;
	description: string;
	status: string;
	steps: PipelineStep[];
	edges: PipelineEdge[];
}

export interface PipelineStep {
	id: string;
	kind: string;
	label?: string;
	config: Record<string, unknown>;
	position: { x: number; y: number };
}

export interface PipelineEdge {
	source: string;
	target: string;
}

export interface PipelineRun {
	id: string;
	pipeline_id: string;
	status: string;
	started_at: string;
	finished_at?: string;
}

export interface Connector {
	id: string;
	name: string;
	kind: string;
	config: Record<string, unknown>;
}

// ── Agent Builder ────────────────────────────────────────────────────

export interface AgentDetail {
	id: string;
	name: string;
	description?: string;
	model: string;
	enabled: boolean;
	system_prompt: string;
	tools: AgentTool[];
	mcp_endpoints: string[];
	memory_enabled: boolean;
	temperature: number;
	max_tokens: number;
}

export interface AgentTool {
	kind: string;
	name: string;
	description: string;
	enabled: boolean;
}

// ── Step node kinds (for pipeline canvas) ────────────────────────────

export type StepKind =
	| "file_connector"
	| "api_connector"
	| "chunker"
	| "embedder"
	| "extractor"
	| "surrealdb_sink";

export const STEP_KIND_LABELS: Record<StepKind, string> = {
	file_connector: "File Connector",
	api_connector: "API Connector",
	chunker: "Chunker",
	embedder: "Embedder",
	extractor: "Extractor",
	surrealdb_sink: "SurrealDB Sink",
};

export { STEP_KIND_COLORS } from "~/util/overreal-colors";
