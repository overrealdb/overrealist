import { describe, expect, it } from "vitest";
import { VIEW_PAGES } from "./constants";

describe("VIEW_PAGES", () => {
	it("includes agents view gated by overrealdb flag", () => {
		const agents = VIEW_PAGES.agents;
		expect(agents).toBeDefined();
		expect(agents.id).toBe("agents");
		expect(agents.name).toBe("Agents");
		expect(agents.disabled).toBeDefined();

		// Should be disabled when overrealdb flag is false
		const disabledResult = agents.disabled?.({
			flags: { overrealdb: false } as any,
			connection: "",
			version: null,
			isCloud: false,
		});
		expect(disabledResult).toBe(true);

		// Should be enabled when overrealdb flag is true
		const enabledResult = agents.disabled?.({
			flags: { overrealdb: true } as any,
			connection: "",
			version: null,
			isCloud: false,
		});
		expect(enabledResult).toBe(false);
	});

	it("includes knowledge view gated by overrealdb flag", () => {
		const knowledge = VIEW_PAGES.knowledge;
		expect(knowledge).toBeDefined();
		expect(knowledge.id).toBe("knowledge");
		expect(knowledge.name).toBe("Knowledge");
		expect(knowledge.disabled).toBeDefined();

		const disabledResult = knowledge.disabled?.({
			flags: { overrealdb: false } as any,
			connection: "",
			version: null,
			isCloud: false,
		});
		expect(disabledResult).toBe(true);
	});

	it("has all standard views registered", () => {
		const expectedViews = [
			"dashboard",
			"monitor",
			"query",
			"explorer",
			"graphql",
			"designer",
			"authentication",
			"functions",
			"parameters",
			"documentation",
			"migrations",
			"agents",
			"knowledge",
		] as const;

		for (const view of expectedViews) {
			expect(VIEW_PAGES[view], `missing view: ${view}`).toBeDefined();
		}
	});
});
