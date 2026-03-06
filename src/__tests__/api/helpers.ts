/**
 * E2E test helpers for the overrealdb engine API.
 *
 * Tests run against a real engine at ENGINE_URL (default http://localhost:3100).
 * All test resources use the `__e2e_` prefix for easy cleanup.
 */

export const ENGINE_URL = process.env.E2E_ENGINE_URL ?? "http://localhost:3100";

/**
 * Fetch JSON from the engine, handling 204 No Content.
 */
export async function api<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const resp = await apiRaw(path, options);
  if (resp.status === 204) {
    return undefined as T;
  }
  return resp.json();
}

/**
 * Raw fetch from the engine — returns the Response for status assertions.
 */
export async function apiRaw(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = `${ENGINE_URL}${path}`;
  const resp = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!resp.ok && resp.status !== 204) {
    const text = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status} ${path}: ${text}`);
  }

  return resp;
}

let _engineReachable: boolean | null = null;

/**
 * Check if the engine process is reachable (health endpoint only).
 * Use for tests that only hit /health or /version.
 */
export async function isEngineReachable(): Promise<boolean> {
  if (_engineReachable !== null) return _engineReachable;
  try {
    const resp = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    _engineReachable = resp.ok;
  } catch {
    _engineReachable = false;
  }
  return _engineReachable;
}

let _engineUp: boolean | null = null;

/**
 * Check if the engine is reachable AND operational (cached after first call).
 * Tests /health first, then verifies a real list endpoint returns 2xx.
 */
export async function isEngineUp(): Promise<boolean> {
  if (_engineUp !== null) return _engineUp;
  try {
    const health = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!health.ok) {
      _engineUp = false;
      return false;
    }
    // Verify actual DB operations work (health can be OK while DB is down)
    const probe = await fetch(`${ENGINE_URL}/agents`, {
      signal: AbortSignal.timeout(5000),
    });
    _engineUp = probe.ok;
  } catch {
    _engineUp = false;
  }
  return _engineUp;
}

let _knowledgeReady: boolean | null = null;

/**
 * Check if the knowledge graph subsystem is initialized.
 * Returns false when no embedder is configured (503 on knowledge routes).
 */
export async function isKnowledgeReady(): Promise<boolean> {
  if (_knowledgeReady !== null) return _knowledgeReady;
  if (!(await isEngineUp())) {
    _knowledgeReady = false;
    return false;
  }
  try {
    const resp = await fetch(`${ENGINE_URL}/knowledge/sources`, {
      signal: AbortSignal.timeout(5000),
    });
    _knowledgeReady = resp.ok;
  } catch {
    _knowledgeReady = false;
  }
  return _knowledgeReady;
}

/**
 * Generate a unique test ID with the __e2e_ prefix.
 */
export function testId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `__e2e_${prefix}_${rand}`;
}

/**
 * Delete a resource, ignoring 404/errors.
 */
export async function cleanupDelete(path: string): Promise<void> {
  try {
    await fetch(`${ENGINE_URL}${path}`, { method: "DELETE" });
  } catch {
    // ignore
  }
}
