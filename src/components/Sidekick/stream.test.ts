import { describe, expect, it } from "vitest";
import { parseSseLine, translateEngineEvent } from "./sse";

describe("parseSseLine", () => {
	it("parses a valid SSE data line", () => {
		const result = parseSseLine('data: {"type":"token","text":"hello"}');
		expect(result).toEqual({ type: "token", text: "hello" });
	});

	it("handles lines without data: prefix", () => {
		const result = parseSseLine('{"type":"done"}');
		expect(result).toEqual({ type: "done" });
	});

	it("returns null for empty lines", () => {
		expect(parseSseLine("")).toBeNull();
		expect(parseSseLine("   ")).toBeNull();
	});

	it("returns null for SSE comments (colon-prefixed)", () => {
		expect(parseSseLine(": keep-alive")).toBeNull();
	});

	it("returns null for invalid JSON", () => {
		expect(parseSseLine("data: not-json")).toBeNull();
	});

	it("handles data: with empty payload", () => {
		expect(parseSseLine("data: ")).toBeNull();
	});

	it("trims whitespace before parsing", () => {
		const result = parseSseLine('  data: {"type":"done"}  ');
		expect(result).toEqual({ type: "done" });
	});
});

describe("translateEngineEvent", () => {
	const sessionId = "test-session";
	const contentSoFar = "";

	it("translates token events to response events", () => {
		const result = translateEngineEvent(
			{ type: "token", text: "Hello" },
			sessionId,
			contentSoFar,
		);
		expect(result).toEqual({
			type: "response",
			data: { content: "Hello", complete: false },
		});
	});

	it("translates tool_result events to thinking events", () => {
		const result = translateEngineEvent(
			{ type: "tool_result", name: "search", result: [] },
			sessionId,
			contentSoFar,
		);
		expect(result).toEqual({
			type: "thinking",
			data: "Using search...",
		});
	});

	it("translates done events to complete events", () => {
		const result = translateEngineEvent(
			{ type: "done", usage: {} },
			sessionId,
			contentSoFar,
		);
		expect(result).toEqual({ type: "complete" });
	});

	it("translates error events", () => {
		const result = translateEngineEvent(
			{ type: "error", message: "Something went wrong" },
			sessionId,
			contentSoFar,
		);
		expect(result).toEqual({
			type: "error",
			data: "Something went wrong",
		});
	});

	it("returns null for unknown event types", () => {
		const result = translateEngineEvent(
			{ type: "unknown_event" },
			sessionId,
			contentSoFar,
		);
		expect(result).toBeNull();
	});
});
