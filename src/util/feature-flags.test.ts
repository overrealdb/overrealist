import { describe, expect, it } from "vitest";
import { schema } from "./feature-flags";

describe("feature flag schema", () => {
	it("includes overrealdb flag", () => {
		expect(schema.overrealdb).toBeDefined();
		expect(schema.overrealdb.options).toEqual([false, true]);
	});

	it("includes all expected view flags", () => {
		const viewFlags = [
			"query_view",
			"explorer_view",
			"graphql_view",
			"designer_view",
			"auth_view",
			"functions_view",
			"parameters_view",
			"apidocs_view",
		] as const;

		for (const flag of viewFlags) {
			expect(schema[flag], `missing flag: ${flag}`).toBeDefined();
		}
	});
});
