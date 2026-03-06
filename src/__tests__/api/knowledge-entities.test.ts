// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { api, isEngineUp, testId, cleanupDelete } from "./helpers";

const engineUp = await isEngineUp();
const createdEntityIds: string[] = [];

describe.skipIf(!engineUp)("Knowledge Entities API", () => {
  afterAll(async () => {
    for (const id of createdEntityIds) {
      await cleanupDelete(`/knowledge/entities/${id}`);
    }
  });

  it("POST /knowledge/entities creates an entity", async () => {
    const name = testId("entity");
    const data = await api<{ id: string }>("/knowledge/entities", {
      method: "POST",
      body: JSON.stringify({
        name,
        entity_type: "concept",
        description: "E2E test entity",
      }),
    });

    expect(data).toHaveProperty("id");
    expect(typeof data.id).toBe("string");
    createdEntityIds.push(data.id);
  });

  it("GET /knowledge/entities returns array", async () => {
    const data = await api<Record<string, unknown>[]>("/knowledge/entities");

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("entity_type");
    }
  });

  it("GET /knowledge/entities?q=term filters results", async () => {
    if (createdEntityIds.length === 0) return;

    const data = await api<Record<string, unknown>[]>("/knowledge/entities?q=__e2e_");

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET /knowledge/entities/:id/facts returns array", async () => {
    if (createdEntityIds.length === 0) return;

    const data = await api<unknown[]>(
      `/knowledge/entities/${createdEntityIds[0]}/facts`,
    );

    expect(Array.isArray(data)).toBe(true);
  });
});
