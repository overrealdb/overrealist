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

let _engineUp: boolean | null = null;

/**
 * Check if the engine is reachable (cached after first call).
 */
export async function isEngineUp(): Promise<boolean> {
  if (_engineUp !== null) return _engineUp;
  try {
    const resp = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    _engineUp = resp.ok;
  } catch {
    _engineUp = false;
  }
  return _engineUp;
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
