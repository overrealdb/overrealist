import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfigStore } from "~/stores/config";

/**
 * Get the overrealdb engine base URL from settings.
 */
function useEngineUrl(): string {
	return useConfigStore((s) => s.settings.overrealdb.engineUrl);
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
	const response = await fetch(url, {
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
		queryFn: () => engineFetch<{ status: string }>(baseUrl, "/health"),
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
			engineFetch<OverrealMessage[]>(baseUrl, `/chat/sessions/${sessionId}/messages`),
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
			await engineFetch(baseUrl, `/chat/sessions/${sessionId}`, {
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
