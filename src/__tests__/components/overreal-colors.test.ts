import { describe, it, expect, afterEach } from "vitest";
import { getColorScheme, themed, nodeColor, STEP_KIND_COLORS } from "~/util/overreal-colors";

describe("overreal-colors", () => {
	afterEach(() => {
		// Reset to no attribute (defaults to dark)
		document.documentElement.removeAttribute("data-mantine-color-scheme");
	});

	it("getColorScheme defaults to dark", () => {
		expect(getColorScheme()).toBe("dark");
	});

	it("getColorScheme reads light from DOM", () => {
		document.documentElement.setAttribute("data-mantine-color-scheme", "light");
		expect(getColorScheme()).toBe("light");
	});

	it("themed returns dark colors by default", () => {
		expect(themed("source")).toBe("#3498DB");
		expect(themed("transform")).toBe("#E67E22");
		expect(themed("sink")).toBe("#E74C3C");
	});

	it("themed returns light colors when light scheme", () => {
		document.documentElement.setAttribute("data-mantine-color-scheme", "light");
		expect(themed("source")).toBe("#2980B9");
		expect(themed("transform")).toBe("#D35400");
		expect(themed("sink")).toBe("#C0392B");
	});

	it("themed returns fallback for unknown keys", () => {
		expect(themed("nonexistent")).toBe("#888888");
	});

	it("nodeColor returns themed color for graph node types", () => {
		expect(nodeColor("entity")).toBe("#E67E22");
		expect(nodeColor("document")).toBe("#3498DB");
		expect(nodeColor("fact")).toBe("#2ECC71");
		expect(nodeColor("community")).toBe("#9B59B6");
	});

	it("STEP_KIND_COLORS maps step kinds to themed colors", () => {
		expect(STEP_KIND_COLORS.file_connector).toBe("#3498DB"); // source
		expect(STEP_KIND_COLORS.chunker).toBe("#E67E22"); // transform
		expect(STEP_KIND_COLORS.surrealdb_sink).toBe("#E74C3C"); // sink
	});
});
