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
    expect(data.name).toBe(name);
    expect(data).toHaveProperty("steps");
    expect(data).toHaveProperty("edges");
    expect(data).toHaveProperty("status");

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
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("steps");
    expect(data).toHaveProperty("edges");
    expect(data).toHaveProperty("status");
    expect(Array.isArray(data.steps)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
  });

  it("PUT /pipelines/:id updates pipeline", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/pipelines/${createdIds[0]}`, {
      method: "PUT",
      body: JSON.stringify({ description: "Updated by E2E" }),
    });

    expect(data.id).toBe(createdIds[0]);
    expect(data.description).toBe("Updated by E2E");
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
