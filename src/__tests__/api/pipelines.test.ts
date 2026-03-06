// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { api, apiRaw, isEngineUp, testId, cleanupDelete } from "./helpers";

const engineUp = await isEngineUp();
const createdIds: string[] = [];

describe.skipIf(!engineUp)("Pipelines API", () => {
  afterAll(async () => {
    for (const id of createdIds) {
      await cleanupDelete(`/pipelines/${id}`);
    }
  });

  it("POST /pipelines creates a pipeline", async () => {
    const name = testId("pipeline");
    const data = await api<Record<string, unknown>>("/pipelines", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "E2E test pipeline",
      }),
    });

    expect(data).toHaveProperty("id");
    expect(typeof data.id).toBe("string");
    expect(data.id).not.toContain(":");
    expect(data.name).toBe(name);

    createdIds.push(data.id as string);
  });

  it("GET /pipelines lists pipelines", async () => {
    const data = await api<unknown[]>("/pipelines");

    expect(Array.isArray(data)).toBe(true);
  });

  it("GET /pipelines/:id returns pipeline with all fields", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/pipelines/${createdIds[0]}`);

    expect(data.id).toBe(createdIds[0]);
    expect(data.id).not.toContain(":");
    expect(data).toHaveProperty("name");
  });

  it("PUT /pipelines/:id updates pipeline", async () => {
    if (createdIds.length === 0) return;

    // Fetch existing pipeline to get full config
    const existing = await api<Record<string, unknown>>(`/pipelines/${createdIds[0]}`);

    const data = await api<Record<string, unknown>>(`/pipelines/${createdIds[0]}`, {
      method: "PUT",
      body: JSON.stringify({
        name: existing.name,
        description: "Updated by E2E",
      }),
    });

    expect(data.id).toBe(createdIds[0]);
    expect(data.id).not.toContain(":");
  });

  it("DELETE /pipelines/:id returns 204", async () => {
    const name = testId("del-pipeline");
    const created = await api<Record<string, unknown>>("/pipelines", {
      method: "POST",
      body: JSON.stringify({ name, description: "temp" }),
    });

    const resp = await apiRaw(`/pipelines/${created.id}`, { method: "DELETE" });
    expect(resp.status).toBe(204);
  });
});
