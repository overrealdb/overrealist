import { describe, it, expect } from "vitest";
import { STEP_KIND_LABELS } from "~/types/overrealdb";
import type {
	Pipeline,
	PipelineStep,
	Connector,
	AgentDetail,
	KnowledgeSource,
	DeduplicationReport,
	ConnectorHealth,
	SchemaInfo,
} from "~/types/overrealdb";

describe("overrealdb types", () => {
	it("STEP_KIND_LABELS has all step kinds", () => {
		expect(STEP_KIND_LABELS.file_connector).toBe("File Connector");
		expect(STEP_KIND_LABELS.api_connector).toBe("API Connector");
		expect(STEP_KIND_LABELS.chunker).toBe("Chunker");
		expect(STEP_KIND_LABELS.embedder).toBe("Embedder");
		expect(STEP_KIND_LABELS.extractor).toBe("Extractor");
		expect(STEP_KIND_LABELS.surrealdb_sink).toBe("SurrealDB Sink");
	});

	it("Pipeline type is structurally valid", () => {
		const pipeline: Pipeline = {
			id: "test-1",
			name: "My Pipeline",
			description: "A test pipeline",
			status: "idle",
			steps: [
				{
					id: "step-1",
					kind: "file_connector",
					label: "CSV Source",
					config: { path: "/data/input.csv" },
					position: { x: 100, y: 150 },
				},
			],
			edges: [{ source: "step-1", target: "step-2" }],
		};

		expect(pipeline.id).toBe("test-1");
		expect(pipeline.steps).toHaveLength(1);
		expect(pipeline.steps[0].kind).toBe("file_connector");
	});

	it("Connector type includes new fields", () => {
		const connector: Connector = {
			id: "c-1",
			name: "pg-prod",
			kind: "postgres",
			description: "Production DB",
			connection_string: "postgres://localhost/prod",
			config: { schema: "public" },
			enabled: true,
			write_enabled: false,
		};

		expect(connector.enabled).toBe(true);
		expect(connector.write_enabled).toBe(false);
		expect(connector.description).toBe("Production DB");
	});

	it("AgentDetail type structure", () => {
		const agent: AgentDetail = {
			id: "a-1",
			name: "test-agent",
			model: "qwen2.5:7b",
			enabled: true,
			system_prompt: "You are helpful.",
			tools: [{ kind: "search", name: "Search", description: "Search KB", enabled: true }],
			mcp_endpoints: [],
			memory_enabled: true,
			temperature: 0.7,
			max_tokens: 4096,
		};

		expect(agent.tools).toHaveLength(1);
		expect(agent.tools[0].kind).toBe("search");
	});

	it("DeduplicationReport type structure", () => {
		const report: DeduplicationReport = {
			entities_scanned: 100,
			clusters_found: 5,
			merged_count: 3,
			details: [
				{ from: "entity-1", into: "entity-2", similarity: 0.92 },
			],
		};

		expect(report.merged_count).toBe(3);
		expect(report.details[0].similarity).toBeGreaterThan(0.9);
	});

	it("ConnectorHealth type structure", () => {
		const health: ConnectorHealth = {
			connector_id: "c-1",
			healthy: true,
			message: "Connection OK",
			checked_at: "2026-03-06T12:00:00Z",
		};

		expect(health.healthy).toBe(true);
	});

	it("SchemaInfo type structure", () => {
		const schema: SchemaInfo = {
			tables: [
				{
					name: "users",
					columns: [
						{ name: "id", data_type: "integer", nullable: false, is_primary_key: true },
						{ name: "email", data_type: "varchar", nullable: false, is_primary_key: false },
					],
					row_count: 42,
				},
			],
		};

		expect(schema.tables).toHaveLength(1);
		expect(schema.tables[0].columns).toHaveLength(2);
		expect(schema.tables[0].row_count).toBe(42);
	});
});
