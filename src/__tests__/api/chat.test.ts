// @vitest-environment node
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { api, apiRaw, isEngineUp, testId, cleanupDelete } from "./helpers";

const engineUp = await isEngineUp();

let agentId: string | null = null;
const sessionIds: string[] = [];

describe.skipIf(!engineUp)("Chat Sessions API", () => {
  beforeAll(async () => {
    const name = testId("chat-agent");
    const agent = await api<Record<string, unknown>>("/agents", {
      method: "POST",
      body: JSON.stringify({
        name,
        model: "test-model",
        enabled: true,
        system_prompt: "You are a test assistant.",
        tools: [],
        mcp_endpoints: [],
        memory_enabled: false,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    agentId = agent.id as string;
    expect(agentId).not.toContain(":");
  });

  afterAll(async () => {
    for (const sid of sessionIds) {
      await cleanupDelete(`/chat/sessions/${sid}`);
    }
    if (agentId) {
      await cleanupDelete(`/agents/${agentId}`);
    }
  });

  it("POST /chat/sessions creates a session", async () => {
    if (!agentId) return;

    const data = await api<{ id: string }>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId }),
    });

    expect(data).toHaveProperty("id");
    expect(typeof data.id).toBe("string");
    expect(data.id).not.toContain(":");
    sessionIds.push(data.id);
  });

  it("POST /chat/sessions rejects invalid agent_id", async () => {
    await expect(
      api("/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ agent_id: "nonexistent_agent_xyz" }),
      }),
    ).rejects.toThrow();
  });

  it("GET /chat/sessions lists sessions", async () => {
    const data = await api<unknown[]>("/chat/sessions");

    expect(Array.isArray(data)).toBe(true);
  });

  it("DELETE /chat/sessions/:id returns 204", async () => {
    if (!agentId) return;

    const session = await api<{ id: string }>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId }),
    });

    const resp = await apiRaw(`/chat/sessions/${session.id}`, {
      method: "DELETE",
    });
    expect(resp.status).toBe(204);
  });
});
