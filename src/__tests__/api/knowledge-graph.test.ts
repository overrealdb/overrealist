// @vitest-environment node
import { describe, it, expect } from "vitest";
import { api, isEngineUp } from "./helpers";

const engineUp = await isEngineUp();

describe.skipIf(!engineUp)("Knowledge Graph API", () => {
  it("GET /knowledge/graph returns nodes and edges", async () => {
    const data = await api<{ nodes: unknown[]; edges: unknown[] }>("/knowledge/graph");

    expect(data).toHaveProperty("nodes");
    expect(data).toHaveProperty("edges");
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
  });

  it("GET /knowledge/graph?q=filter returns filtered graph", async () => {
    const data = await api<{ nodes: unknown[]; edges: unknown[] }>(
      "/knowledge/graph?q=nonexistent_term_xyz",
    );

    expect(data).toHaveProperty("nodes");
    expect(Array.isArray(data.nodes)).toBe(true);
  });

  it("GET /knowledge/communities returns array", async () => {
    const data = await api<Record<string, unknown>[]>("/knowledge/communities");

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("member_count");
      expect(typeof data[0].member_count).toBe("number");
    }
  });
});
