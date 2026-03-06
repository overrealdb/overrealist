// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { api, apiRaw, isEngineUp, testId, cleanupDelete } from "./helpers";

const engineUp = await isEngineUp();
const createdIds: string[] = [];

describe.skipIf(!engineUp)("Connectors API", () => {
  afterAll(async () => {
    for (const id of createdIds) {
      await cleanupDelete(`/connectors/${id}`);
    }
  });

  it("POST /connectors creates a new connector", async () => {
    const name = testId("conn");
    const data = await api<Record<string, unknown>>("/connectors", {
      method: "POST",
      body: JSON.stringify({
        name,
        kind: "http",
        connection_string: "https://example.com/api",
        description: "E2E test connector",
        enabled: true,
        write_enabled: false,
        config: { timeout: 30 },
      }),
    });

    expect(data).toHaveProperty("id");
    expect(typeof data.id).toBe("string");
    expect(data.id).not.toContain(":");

    createdIds.push(data.id as string);
  });

  it("GET /connectors lists connectors", async () => {
    const data = await api<unknown[]>("/connectors");

    expect(Array.isArray(data)).toBe(true);
    if (createdIds.length > 0) {
      const found = data.find((c: any) => c.id === createdIds[0]);
      expect(found).toBeDefined();
    }
  });

  it("GET /connectors/:id returns connector detail", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/connectors/${createdIds[0]}`);

    expect(data.id).toBe(createdIds[0]);
    expect(data.id).not.toContain(":");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("kind");
  });

  it("PUT /connectors/:id updates connector", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/connectors/${createdIds[0]}`, {
      method: "PUT",
      body: JSON.stringify({
        name: testId("conn-upd"),
        kind: "http",
        description: "Updated by E2E",
        enabled: true,
        write_enabled: true,
      }),
    });

    expect(data.id).toBe(createdIds[0]);
    expect(data.updated).toBe(true);
  });

  it("POST /connectors/:id/test tests connector health", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/connectors/${createdIds[0]}/test`, {
      method: "POST",
    });

    expect(data).toHaveProperty("healthy");
    expect(data).toHaveProperty("connector_id");
    expect(data).toHaveProperty("status");
  });

  it("DELETE /connectors/:id returns 204", async () => {
    const name = testId("del-conn");
    const created = await api<Record<string, unknown>>("/connectors", {
      method: "POST",
      body: JSON.stringify({
        name,
        kind: "file",
        enabled: true,
        write_enabled: false,
      }),
    });

    const resp = await apiRaw(`/connectors/${created.id}`, { method: "DELETE" });
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.deleted).toBe(true);
  });
});
