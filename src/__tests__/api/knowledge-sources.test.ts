// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { api, apiRaw, isKnowledgeReady, testId, cleanupDelete } from "./helpers";

const kgReady = await isKnowledgeReady();
const createdSourceIds: string[] = [];

describe.skipIf(!kgReady)("Knowledge Sources API", () => {
  afterAll(async () => {
    for (const id of createdSourceIds) {
      await cleanupDelete(`/knowledge/sources/${id}`);
    }
  });

  it("POST /knowledge/sources creates a source", async () => {
    const name = testId("source");
    const data = await api<{ id: string }>("/knowledge/sources", {
      method: "POST",
      body: JSON.stringify({
        name,
        kind: "docs",
        description: "E2E test source",
      }),
    });

    expect(data).toHaveProperty("id");
    expect(typeof data.id).toBe("string");
    expect(data.id).not.toContain(":");
    createdSourceIds.push(data.id);
  });

  it("GET /knowledge/sources returns array with document_count", async () => {
    const data = await api<Record<string, unknown>[]>("/knowledge/sources");

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0].id).not.toContain(":");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("document_count");
      expect(typeof data[0].document_count).toBe("number");
    }
  });

  it("GET /knowledge/sources/:id returns single source", async () => {
    if (createdSourceIds.length === 0) return;

    const data = await api<Record<string, unknown>>(
      `/knowledge/sources/${createdSourceIds[0]}`,
    );

    expect(data.id).toBe(createdSourceIds[0]);
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("kind");
  });

  it("GET /knowledge/sources/:id/documents returns array", async () => {
    if (createdSourceIds.length === 0) return;

    const data = await api<unknown[]>(
      `/knowledge/sources/${createdSourceIds[0]}/documents`,
    );

    expect(Array.isArray(data)).toBe(true);
  });

  it("DELETE /knowledge/sources/:id returns 204", async () => {
    const name = testId("del-source");
    const created = await api<{ id: string }>("/knowledge/sources", {
      method: "POST",
      body: JSON.stringify({ name, kind: "test" }),
    });

    const resp = await apiRaw(`/knowledge/sources/${created.id}`, {
      method: "DELETE",
    });
    expect(resp.status).toBe(204);
  });
});
