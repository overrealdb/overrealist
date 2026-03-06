/**
 * Shared mocks for component tests.
 *
 * Usage: vi.mock("~/hooks/overrealdb", () => overrealdbMocks({ agents: [...] }))
 */
import { vi } from "vitest";

/**
 * Create mock hook returns for overrealdb hooks.
 * Pass data objects that specific tests need; hooks not provided return safe defaults.
 */
export function overrealdbMocks(overrides: {
	agents?: unknown[];
	health?: { status: string };
	sessions?: unknown[];
	connectors?: unknown[];
	pipelines?: unknown[];
	sources?: unknown[];
	graph?: { nodes: unknown[]; edges: unknown[] };
} = {}) {
	const queryResult = (data: unknown) => ({
		data,
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	});

	const mutation = () => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
		isError: false,
		error: null,
	});

	return {
		useOverrealHealth: vi.fn(() => queryResult(overrides.health ?? { status: "ok" })),
		useOverrealAgents: vi.fn(() => queryResult(overrides.agents ?? [])),
		useOverrealAgent: vi.fn(() => queryResult(null)),
		useOverrealCreateAgent: vi.fn(mutation),
		useOverrealUpdateAgent: vi.fn(mutation),
		useOverrealAgentTools: vi.fn(() => queryResult([])),
		useOverrealSessions: vi.fn(() => queryResult(overrides.sessions ?? [])),
		useOverrealCreateSession: vi.fn(mutation),
		useOverrealMessages: vi.fn(() => queryResult([])),
		useOverrealDeleteSession: vi.fn(mutation),
		useOverrealKnowledgeSearch: vi.fn(mutation),
		useOverrealKnowledgeSources: vi.fn(() => queryResult(overrides.sources ?? [])),
		useOverrealKnowledgeDocuments: vi.fn(() => queryResult([])),
		useOverrealKnowledgeEntities: vi.fn(() => queryResult([])),
		useOverrealKnowledgeFacts: vi.fn(() => queryResult([])),
		useOverrealKnowledgeCommunities: vi.fn(() => queryResult([])),
		useOverrealKnowledgeGraph: vi.fn(() => queryResult(overrides.graph ?? { nodes: [], edges: [] })),
		useOverrealKnowledgeIngest: vi.fn(mutation),
		useOverrealKnowledgeDeleteSource: vi.fn(mutation),
		useOverrealDeduplicate: vi.fn(mutation),
		useOverrealPipelines: vi.fn(() => queryResult(overrides.pipelines ?? [])),
		useOverrealPipeline: vi.fn(() => queryResult(null)),
		useOverrealCreatePipeline: vi.fn(mutation),
		useOverrealUpdatePipeline: vi.fn(mutation),
		useOverrealDeletePipeline: vi.fn(mutation),
		useOverrealRunPipeline: vi.fn(mutation),
		useOverrealConnectors: vi.fn(() => queryResult(overrides.connectors ?? [])),
		useOverrealConnector: vi.fn(() => queryResult(null)),
		useOverrealCreateConnector: vi.fn(mutation),
		useOverrealUpdateConnector: vi.fn(mutation),
		useOverrealDeleteConnector: vi.fn(mutation),
		useOverrealTestConnector: vi.fn(mutation),
		useOverrealConnectorSchema: vi.fn(() => queryResult(null)),
	};
}

/**
 * Mock the config store to return enabled overrealdb settings.
 */
export function mockConfigStore() {
	return {
		useConfigStore: vi.fn((selector: (s: unknown) => unknown) => {
			const state = {
				settings: {
					overrealdb: {
						enabled: true,
						engineUrl: "http://localhost:3100",
					},
				},
			};
			return selector(state);
		}),
	};
}
