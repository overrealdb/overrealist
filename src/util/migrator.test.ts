import { describe, expect, it } from "vitest";
import { applyMigrations } from "./migrator";

function makeBaseConfig(overrides?: Record<string, unknown>) {
	return {
		configVersion: 2,
		connections: [],
		sandbox: {
			authentication: { accessFields: [] },
			queries: [],
		},
		settings: {
			behavior: {
				recordDiagnostics: false,
				diagnosticsHistorySize: 300,
			},
			appearance: {},
			templates: { list: [] },
			serving: {},
			cloud: {},
			gtm: {},
		},
		...overrides,
	};
}

describe("applyMigrations", () => {
	it("adds overrealdb settings to configs missing them", () => {
		const config = makeBaseConfig();
		const result = applyMigrations(config);

		expect(result.settings.overrealdb).toEqual({
			enabled: false,
			engineUrl: "http://localhost:3100",
			defaultAgentId: "",
		});
	});

	it("preserves existing overrealdb settings", () => {
		const config = makeBaseConfig() as any;
		config.settings.overrealdb = {
			enabled: true,
			engineUrl: "http://my-engine:4000",
			defaultAgentId: "custom-agent",
		};

		const result = applyMigrations(config);

		expect(result.settings.overrealdb).toEqual({
			enabled: true,
			engineUrl: "http://my-engine:4000",
			defaultAgentId: "custom-agent",
		});
	});

	it("adds diagnostics settings when missing", () => {
		const config = makeBaseConfig();
		delete (config.settings.behavior as Record<string, unknown>).recordDiagnostics;
		delete (config.settings.behavior as Record<string, unknown>).diagnosticsHistorySize;

		const result = applyMigrations(config);

		expect(result.settings.behavior.recordDiagnostics).toBe(false);
		expect(result.settings.behavior.diagnosticsHistorySize).toBe(300);
	});

	it("applies connection migrations for accessFields", () => {
		const config = makeBaseConfig({
			connections: [
				{
					authentication: {},
					queries: [],
				},
			],
		});

		const result = applyMigrations(config);

		expect(result.connections[0].authentication.accessFields).toEqual([]);
	});
});
