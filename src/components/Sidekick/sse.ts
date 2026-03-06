import type { StreamEvent } from "./types";

/**
 * Parse SSE "data:" lines from the overrealdb engine and translate them
 * into Sidekick StreamEvent format.
 *
 * Engine SSE events:
 *   {"type":"token","text":"..."}
 *   {"type":"tool_result","name":"...","result":...}
 *   {"type":"done","usage":...}
 *   {"type":"error","message":"..."}
 *
 * Sidekick StreamEvent expects:
 *   start, response, sources, thinking, title, complete, error, failure
 */
export function translateEngineEvent(
	raw: Record<string, unknown>,
	sessionId: string,
	contentSoFar: string,
): StreamEvent | null {
	switch (raw.type) {
		case "token":
			return {
				type: "response",
				data: { content: raw.text as string, complete: false },
			};

		case "tool_result":
			// Show tool execution as "thinking" indicator
			return {
				type: "thinking",
				data: `Using ${raw.name as string}...`,
			};

		case "done":
			return { type: "complete" };

		case "error":
			return {
				type: "error",
				data: (raw.message as string) ?? "Unknown error",
			};

		default:
			return null;
	}
}

/**
 * Parse SSE text stream (lines prefixed with "data: ") into JSON payloads.
 */
export function parseSseLine(line: string): Record<string, unknown> | null {
	const trimmed = line.replace(/\r$/, "").trim();
	if (!trimmed || trimmed.startsWith(":")) return null;

	const data = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;
	if (!data) return null;

	try {
		return JSON.parse(data);
	} catch {
		return null;
	}
}
