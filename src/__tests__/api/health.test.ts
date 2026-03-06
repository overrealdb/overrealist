// @vitest-environment node
import { describe, it, expect } from "vitest";
import { api, isEngineReachable } from "./helpers";

const reachable = await isEngineReachable();

describe.skipIf(!reachable)("Health API", () => {
  it("GET /health returns status and capabilities", async () => {
    const data = await api<Record<string, unknown>>("/health");

    expect(data.status).toBe("ok");
    expect(data).toHaveProperty("llm_configured");
    expect(data).toHaveProperty("embedder_configured");
  });

  it("GET /version returns service info", async () => {
    const data = await api<{ service?: string; version: string }>("/version");

    expect(data).toHaveProperty("version");
    expect(typeof data.version).toBe("string");
  });
});
