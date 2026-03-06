import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import type {
	AgentDetail,
	AgentTool,
	Connector,
	ConnectorHealth,
	DeduplicationReport,
	KnowledgeCommunity,
	KnowledgeDocument,
	KnowledgeEntity,
	KnowledgeFact,
	KnowledgeGraphData,
	KnowledgeSource,
	Pipeline,
	PipelineRun,
	SchemaInfo,
} from "~/types/overrealdb";

/**
 * Get the overrealdb engine base URL from settings.
 */
function useEngineUrl(): string {
	return useConfigStore((s) => s.settings.overrealdb.engineUrl);
}

/** URL-encode an ID for use in path segments (defense-in-depth for record IDs with colons). */
function pathId(id: string): string {
	return encodeURIComponent(id);
}

function useOverrealdbEnabled(): boolean {
	return useConfigStore((s) => s.settings.overrealdb.enabled);
}

async function engineFetch<T = unknown>(
	baseUrl: string,
	path: string,
	options?: RequestInit,
): Promise<T> {
	const url = `${baseUrl.replace(/\/$/, "")}${path}`;
	const response = await adapter.fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options,
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`Engine error ${response.status}: ${text}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json();
}

// ── Health ───────────────────────────────────────────────────────────

export function useOverrealHealth() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "health"],
		enabled,
		refetchInterval: 30_000,
		retry: 1,
		queryFn: () =>
			engineFetch<{
				status: string;
				version?: string;
				llm_configured?: boolean;
				embedder_configured?: boolean;
				mcp_enabled?: boolean;
			}>(baseUrl, "/health"),
	});
}

// ── Agents ──────────────────────────────────────────────────────────

export interface OverrealAgent {
	id: string;
	name: string;
	description?: string;
	model: string;
	enabled: boolean;
}

export function useOverrealAgents() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "agents"],
		enabled,
		queryFn: () => engineFetch<OverrealAgent[]>(baseUrl, "/agents"),
	});
}

// ── Sessions ────────────────────────────────────────────────────────

export interface OverrealSession {
	id: string;
	agent: string;
	user_id?: string;
	created_at?: string;
}

export function useOverrealSessions() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "sessions"],
		enabled,
		queryFn: () => engineFetch<OverrealSession[]>(baseUrl, "/chat/sessions"),
	});
}

export function useOverrealCreateSession() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (agentId: string) => {
			const result = await engineFetch<{ id: string }>(baseUrl, "/chat/sessions", {
				method: "POST",
				body: JSON.stringify({ agent_id: agentId }),
			});
			return result.id;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "sessions"] });
		},
	});
}

export function useOverrealMessages(sessionId: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "messages", sessionId],
		enabled: enabled && !!sessionId,
		queryFn: () =>
			engineFetch<OverrealMessage[]>(baseUrl, `/chat/sessions/${pathId(sessionId!)}/messages`),
	});
}

export interface OverrealMessage {
	id: string;
	role: "user" | "assistant" | "tool";
	content: string;
	model?: string;
	tokens_used?: number;
	created_at?: string;
}

// ── Delete session ──────────────────────────────────────────────────

export function useOverrealDeleteSession() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sessionId: string) => {
			await engineFetch(baseUrl, `/chat/sessions/${pathId(sessionId)}`, {
				method: "DELETE",
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "sessions"] });
		},
	});
}

// ── Knowledge search ────────────────────────────────────────────────

export interface KnowledgeSearchResult {
	chunk_id: string;
	parent: string;
	content: string;
	distance: number;
	metadata?: Record<string, unknown>;
}

export function useOverrealKnowledgeSearch() {
	const baseUrl = useEngineUrl();

	return useMutation({
		mutationFn: async ({ query, topK }: { query: string; topK?: number }) => {
			return engineFetch<{ results: KnowledgeSearchResult[]; count: number }>(
				baseUrl,
				"/knowledge/search",
				{
					method: "POST",
					body: JSON.stringify({ query, top_k: topK ?? 5 }),
				},
			);
		},
	});
}

// ── Knowledge Graph (new hooks) ─────────────────────────────────────

export function useOverrealKnowledgeSources() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "knowledge", "sources"],
		enabled,
		queryFn: () => engineFetch<KnowledgeSource[]>(baseUrl, "/knowledge/sources"),
	});
}

export function useOverrealKnowledgeDocuments(sourceId: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "knowledge", "documents", sourceId],
		enabled: enabled && !!sourceId,
		queryFn: () =>
			engineFetch<KnowledgeDocument[]>(baseUrl, `/knowledge/sources/${pathId(sourceId!)}/documents`),
	});
}

export function useOverrealKnowledgeEntities(query?: string) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();
	const params = query ? `?q=${encodeURIComponent(query)}` : "";

	return useQuery({
		queryKey: ["overrealdb", "knowledge", "entities", query],
		enabled,
		queryFn: () => engineFetch<KnowledgeEntity[]>(baseUrl, `/knowledge/entities${params}`),
	});
}

export function useOverrealKnowledgeFacts(entityId: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "knowledge", "facts", entityId],
		enabled: enabled && !!entityId,
		queryFn: () =>
			engineFetch<KnowledgeFact[]>(baseUrl, `/knowledge/entities/${pathId(entityId!)}/facts`),
	});
}

export function useOverrealKnowledgeCommunities() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "knowledge", "communities"],
		enabled,
		queryFn: () => engineFetch<KnowledgeCommunity[]>(baseUrl, "/knowledge/communities"),
	});
}

export function useOverrealKnowledgeGraph(query?: string) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();
	const params = query ? `?q=${encodeURIComponent(query)}` : "";

	return useQuery({
		queryKey: ["overrealdb", "knowledge", "graph", query],
		enabled,
		queryFn: () => engineFetch<KnowledgeGraphData>(baseUrl, `/knowledge/graph${params}`),
	});
}

export function useOverrealKnowledgeIngest() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: {
			documents: { content: string; source: string; metadata?: Record<string, unknown> }[];
		}) => {
			return engineFetch<{ chunks_created: number }>(baseUrl, "/knowledge/ingest", {
				method: "POST",
				body: JSON.stringify(payload),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "knowledge"] });
		},
	});
}

export function useOverrealKnowledgeDeleteSource() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sourceId: string) => {
			await engineFetch(baseUrl, `/knowledge/sources/${pathId(sourceId)}`, {
				method: "DELETE",
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "knowledge"] });
		},
	});
}

// ── Pipelines ───────────────────────────────────────────────────────

export function useOverrealPipelines() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "pipelines"],
		enabled,
		queryFn: () => engineFetch<Pipeline[]>(baseUrl, "/pipelines"),
	});
}

export function useOverrealPipeline(id: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "pipeline", id],
		enabled: enabled && !!id,
		queryFn: () => engineFetch<Pipeline>(baseUrl, `/pipelines/${pathId(id!)}`),
	});
}

export function useOverrealCreatePipeline() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { name: string; description?: string }) => {
			return engineFetch<Pipeline>(baseUrl, "/pipelines", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "pipelines"] });
		},
	});
}

export function useOverrealUpdatePipeline() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Pipeline> }) => {
			return engineFetch<Pipeline>(baseUrl, `/pipelines/${pathId(id)}`, {
				method: "PUT",
				body: JSON.stringify(data),
			});
		},
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "pipelines"] });
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "pipeline", id] });
		},
	});
}

export function useOverrealDeletePipeline() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await engineFetch(baseUrl, `/pipelines/${pathId(id)}`, { method: "DELETE" });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "pipelines"] });
		},
	});
}

export function useOverrealConnectors() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "connectors"],
		enabled,
		queryFn: () => engineFetch<Connector[]>(baseUrl, "/connectors"),
	});
}

export function useOverrealConnector(id: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "connector", id],
		enabled: enabled && !!id,
		queryFn: () => engineFetch<Connector>(baseUrl, `/connectors/${pathId(id!)}`),
	});
}

export function useOverrealCreateConnector() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<Connector>) => {
			return engineFetch<Connector>(baseUrl, "/connectors", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "connectors"] });
		},
	});
}

export function useOverrealUpdateConnector() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Connector> }) => {
			return engineFetch<Connector>(baseUrl, `/connectors/${pathId(id)}`, {
				method: "PUT",
				body: JSON.stringify(data),
			});
		},
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "connectors"] });
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "connector", id] });
		},
	});
}

export function useOverrealDeleteConnector() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await engineFetch(baseUrl, `/connectors/${pathId(id)}`, { method: "DELETE" });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "connectors"] });
		},
	});
}

export function useOverrealTestConnector() {
	const baseUrl = useEngineUrl();

	return useMutation({
		mutationFn: async (id: string) => {
			return engineFetch<ConnectorHealth>(baseUrl, `/connectors/${pathId(id)}/test`, {
				method: "POST",
			});
		},
	});
}

export function useOverrealConnectorSchema(id: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "connector-schema", id],
		enabled: enabled && !!id,
		queryFn: () => engineFetch<SchemaInfo>(baseUrl, `/connectors/${pathId(id!)}/introspect`, { method: "POST" }),
	});
}

// ── Pipeline Runs ──────────────────────────────────────────────────

export function useOverrealRunPipeline() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return engineFetch<{
				pipeline_id: string;
				records_loaded: number;
				records_skipped: number;
				errors: string[];
			}>(baseUrl, `/pipelines/${pathId(id)}/run`, { method: "POST" });
		},
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "pipelines"] });
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "pipeline", id] });
		},
	});
}

// ── Knowledge Dedup ────────────────────────────────────────────────

export function useOverrealDeduplicate() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (threshold?: number) => {
			return engineFetch<DeduplicationReport>(baseUrl, "/knowledge/deduplicate", {
				method: "POST",
				body: JSON.stringify({ threshold: threshold ?? 0.85 }),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "knowledge"] });
		},
	});
}

// ── Agent Builder (extended) ────────────────────────────────────────

export function useOverrealAgent(id: string | null) {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "agent", id],
		enabled: enabled && !!id,
		queryFn: () => engineFetch<AgentDetail>(baseUrl, `/agents/${pathId(id!)}`),
	});
}

export function useOverrealCreateAgent() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<AgentDetail>) => {
			return engineFetch<AgentDetail>(baseUrl, "/agents", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "agents"] });
		},
	});
}

export function useOverrealUpdateAgent() {
	const baseUrl = useEngineUrl();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<AgentDetail> }) => {
			return engineFetch<AgentDetail>(baseUrl, `/agents/${pathId(id)}`, {
				method: "PUT",
				body: JSON.stringify(data),
			});
		},
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "agents"] });
			queryClient.invalidateQueries({ queryKey: ["overrealdb", "agent", id] });
		},
	});
}

export function useOverrealAgentTools() {
	const baseUrl = useEngineUrl();
	const enabled = useOverrealdbEnabled();

	return useQuery({
		queryKey: ["overrealdb", "agent-tools"],
		enabled,
		queryFn: () => engineFetch<AgentTool[]>(baseUrl, "/agents/tools"),
	});
}
