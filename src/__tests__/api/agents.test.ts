// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { api, apiRaw, isEngineUp, testId, cleanupDelete } from "./helpers";

const engineUp = await isEngineUp();
const createdIds: string[] = [];

describe.skipIf(!engineUp)("Agents API", () => {
  afterAll(async () => {
    for (const id of createdIds) {
      await cleanupDelete(`/agents/${id}`);
    }
  });

  it("POST /agents creates a new agent", async () => {
    const name = testId("agent");
    const data = await api<Record<string, unknown>>("/agents", {
      method: "POST",
      body: JSON.stringify({
        name,
        model: "test-model",
        description: "E2E test agent",
        enabled: true,
        system_prompt: "You are a test assistant.",
        tools: [],
        mcp_endpoints: [],
        memory_enabled: false,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    expect(data).toHaveProperty("id");
    expect(typeof data.id).toBe("string");
    expect(data.name).toBe(name);
    expect(data.model).toBe("test-model");
    expect(data).toHaveProperty("temperature");
    expect(data).toHaveProperty("max_tokens");
    expect(data).toHaveProperty("tools");
    expect(data).toHaveProperty("mcp_endpoints");
    expect(data).toHaveProperty("memory_enabled");

    createdIds.push(data.id as string);
  });

  it("GET /agents lists agents", async () => {
    const data = await api<unknown[]>("/agents");

    expect(Array.isArray(data)).toBe(true);
    if (createdIds.length > 0) {
      const found = data.find((a: any) => a.id === createdIds[0]);
      expect(found).toBeDefined();
    }
  });

  it("GET /agents/:id returns agent detail", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/agents/${createdIds[0]}`);

    expect(data.id).toBe(createdIds[0]);
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("model");
    expect(data).toHaveProperty("temperature");
    expect(data).toHaveProperty("tools");
  });

  it("PUT /agents/:id updates agent", async () => {
    if (createdIds.length === 0) return;

    const data = await api<Record<string, unknown>>(`/agents/${createdIds[0]}`, {
      method: "PUT",
      body: JSON.stringify({
        description: "Updated by E2E test",
        temperature: 0.9,
      }),
    });

    expect(data.id).toBe(createdIds[0]);
    expect(data.description).toBe("Updated by E2E test");
  });

  it("GET /agents/tools returns available tools", async () => {
    const data = await api<unknown[]>("/agents/tools");

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      const tool = data[0] as Record<string, unknown>;
      expect(tool).toHaveProperty("kind");
      expect(tool).toHaveProperty("name");
    }
  });

  it("DELETE /agents/:id returns 204", async () => {
    const name = testId("del-agent");
    const created = await api<Record<string, unknown>>("/agents", {
      method: "POST",
      body: JSON.stringify({
        name,
        model: "test-model",
        enabled: true,
        system_prompt: "",
        tools: [],
        mcp_endpoints: [],
        memory_enabled: false,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const resp = await apiRaw(`/agents/${created.id}`, { method: "DELETE" });
    expect(resp.status).toBe(204);
  });
});
