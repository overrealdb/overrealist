/**
 * Vitest global setup: starts overrealdb-engine before E2E tests, stops it after.
 *
 * Requires SurrealDB running on :8000 (docker compose up -d).
 * The engine binary must be pre-built at the expected cargo target path.
 *
 * Skip by setting E2E_SKIP_ENGINE=1 (e.g. when engine is already running).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

const ENGINE_BIN =
	process.env.OVERREALDB_ENGINE_BIN ??
	"/Users/22f/overrealdb/overrealdb/target/debug/overrealdb-engine";

const ENGINE_PORT = process.env.OVERREALDB_TEST_PORT ?? "3100";
const ENGINE_URL = `http://127.0.0.1:${ENGINE_PORT}`;
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://10.0.0.2:11434";
const STARTUP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 300;

async function waitForHealth(url: string, timeoutMs: number): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const resp = await fetch(`${url}/health`, {
				signal: AbortSignal.timeout(2000),
			});
			if (resp.ok) return true;
		} catch {
			// not ready yet
		}
		await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
	}
	return false;
}

export async function setup(): Promise<() => Promise<void>> {
	if (process.env.E2E_SKIP_ENGINE === "1") {
		console.log("[globalSetup] E2E_SKIP_ENGINE=1, skipping engine launch");
		return async () => {};
	}

	// Check if engine is already running
	try {
		const resp = await fetch(`${ENGINE_URL}/health`, {
			signal: AbortSignal.timeout(2000),
		});
		if (resp.ok) {
			console.log("[globalSetup] Engine already running on", ENGINE_URL);
			return async () => {};
		}
	} catch {
		// not running, we'll start it
	}

	if (!existsSync(ENGINE_BIN)) {
		console.warn(
			`[globalSetup] Engine binary not found at ${ENGINE_BIN}. ` +
				"Build with: cd /Users/22f/overrealdb/overrealdb && cargo build -p overrealdb-engine",
		);
		console.warn("[globalSetup] API tests will be skipped.");
		return async () => {};
	}

	console.log("[globalSetup] Starting overrealdb-engine...");

	const engine: ChildProcess = spawn(ENGINE_BIN, [], {
		env: {
			...process.env,
			OVERREALDB_BIND: `127.0.0.1:${ENGINE_PORT}`,
			OVERREALDB_SDB_URL: "ws://localhost:8000",
			OVERREALDB_SDB_USER: "root",
			OVERREALDB_SDB_PASS: "root",
			OVERREALDB_SEED_KNOWLEDGE: "false",
			OVERREALDB_AUTH_REQUIRED: "false",
			OVERREALDB_EMBEDDER_CONFIG: JSON.stringify({
				kind: "ollama",
				base_url: OLLAMA_URL,
				model: "nomic-embed-text",
				dimensions: 768,
			}),
			OVERREALDB_EMBEDDING_DIMENSIONS: "768",
			RUST_LOG: "warn,overrealdb_engine=info",
		},
		stdio: ["ignore", "pipe", "pipe"],
	});

	// Forward engine logs with prefix
	engine.stdout?.on("data", (data: Buffer) => {
		for (const line of data.toString().split("\n").filter(Boolean)) {
			console.log(`[engine] ${line}`);
		}
	});
	engine.stderr?.on("data", (data: Buffer) => {
		for (const line of data.toString().split("\n").filter(Boolean)) {
			console.log(`[engine] ${line}`);
		}
	});

	const healthy = await waitForHealth(ENGINE_URL, STARTUP_TIMEOUT_MS);
	if (!healthy) {
		engine.kill("SIGTERM");
		throw new Error(
			`[globalSetup] Engine failed to start within ${STARTUP_TIMEOUT_MS / 1000}s. ` +
				"Is SurrealDB running? (docker compose up -d)",
		);
	}

	// Verify DB operations work (not just health endpoint)
	try {
		const probe = await fetch(`${ENGINE_URL}/agents`, {
			signal: AbortSignal.timeout(5000),
		});
		if (!probe.ok) {
			console.warn(`[globalSetup] Engine healthy but /agents returned ${probe.status}`);
		}
	} catch (e) {
		console.warn("[globalSetup] Engine healthy but /agents probe failed:", e);
	}

	console.log("[globalSetup] Engine ready on", ENGINE_URL);

	// Return teardown function
	return async () => {
		console.log("[globalSetup] Stopping engine (pid:", engine.pid, ")...");
		engine.kill("SIGTERM");

		// Wait for graceful shutdown (max 5s)
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				console.warn("[globalSetup] Force killing engine");
				engine.kill("SIGKILL");
				resolve();
			}, 5000);

			engine.on("exit", () => {
				clearTimeout(timeout);
				console.log("[globalSetup] Engine stopped");
				resolve();
			});
		});
	};
}
