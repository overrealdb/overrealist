import { useRef, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { tagEvent } from "~/util/analytics";
import { parseSseLine, translateEngineEvent } from "./sse";
import type { StreamEvent } from "./types";

const SIDEKICK_ENDPOINT = "https://xzg2igifvha4rfi2w677skt7h40yrtsm.lambda-url.us-east-1.on.aws/";

export type StreamHandler = (message: StreamEvent) => void;

export interface SidekickStream {
	isResponding: boolean;
	sendMessage: (message: string, chatId?: string) => Promise<void>;
	cancel: () => void;
}

/**
 * Stream hook that connects to the overrealdb engine SSE endpoint.
 */
function useOverrealdbStream(handler: StreamHandler): SidekickStream {
	const [isResponding, setIsResponding] = useState(false);
	const controller = useRef<AbortController | null>(null);
	const engineUrl = useConfigStore((s) => s.settings.overrealdb.engineUrl);
	const defaultAgentId = useConfigStore((s) => s.settings.overrealdb.defaultAgentId);

	// Track the active session — overrealdb uses server-side sessions
	const sessionRef = useRef<string | null>(null);

	const sendMessage = useStable(async (message: string, chatId?: string) => {
		if (isResponding) {
			throw new Error("Sidekick is already responding");
		}

		setIsResponding(true);

		tagEvent("sidekick_message_sent", {
			chat_id: chatId,
		});

		try {
			controller.current = new AbortController();
			const base = engineUrl.replace(/\/$/, "");

			// Ensure we have a session
			let sessionId = chatId ?? sessionRef.current;
			if (!sessionId) {
				// Create a new session via the engine
				const agentId = defaultAgentId || "docs-assistant";
				const createResp = await adapter.fetch(`${base}/chat/sessions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					signal: controller.current.signal,
					body: JSON.stringify({ agent_id: agentId }),
				});

				if (!createResp.ok) {
					throw new Error(`Failed to create session: ${createResp.status}`);
				}

				const { id } = await createResp.json();
				sessionId = id;
				sessionRef.current = id;
			}

			// Emit a synthetic "start" event for the Sidekick store
			const startId = sessionId as string;
			const requestId = `req_${Date.now()}`;
			const responseId = `res_${Date.now()}`;

			handler({
				type: "start",
				data: {
					id: startId,
					request: { id: requestId, content: message },
					response: { id: responseId, content: "" },
				},
			});

			// POST to the streaming endpoint
			const response = await adapter.fetch(`${base}/chat/sessions/${sessionId}/stream`, {
				method: "POST",
				signal: controller.current.signal,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message }),
			});

			if (!response.ok) {
				const errText = await response.text().catch(() => "");
				throw new Error(`Engine error ${response.status}: ${errText}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error("No response body");

			const decoder = new TextDecoder();
			let buffer = "";
			let contentSoFar = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				buffer += chunk;

				// SSE lines are separated by newlines
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					const parsed = parseSseLine(line);
					if (!parsed) continue;

					if (parsed.type === "token") {
						contentSoFar += parsed.text as string;
					}

					const event = translateEngineEvent(parsed, startId, contentSoFar);
					if (event) handler(event);
				}
			}

			// Process any remaining buffer
			if (buffer.trim()) {
				const parsed = parseSseLine(buffer);
				if (parsed) {
					const event = translateEngineEvent(parsed, startId, contentSoFar);
					if (event) handler(event);
				}
			}
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				console.error("Failed to send message:", error);
				handler({
					type: "error",
					data: (error as Error).message ?? "Connection failed",
				});
			}
		} finally {
			setIsResponding(false);
		}
	});

	const cancel = useStable(() => {
		controller.current?.abort("Chat was cancelled");
	});

	return { sendMessage, isResponding, cancel };
}

/**
 * Original Lambda stream hook (unchanged).
 */
function useLambdaStream(handler: StreamHandler): SidekickStream {
	const [isResponding, setIsResponding] = useState(false);
	const controller = useRef<AbortController | null>(null);
	const accessToken = useCloudStore((state) => state.accessToken);

	const sendMessage = useStable(async (message: string, chatId?: string) => {
		if (isResponding) {
			throw new Error("Sidekick is already responding");
		}

		setIsResponding(true);

		tagEvent("sidekick_message_sent", {
			chat_id: chatId,
		});

		try {
			controller.current = new AbortController();

			const response = await fetch(SIDEKICK_ENDPOINT, {
				method: "POST",
				signal: controller.current.signal,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					message,
					chatId,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();

			if (!reader) {
				throw new Error("No response body");
			}

			const decoder = new TextDecoder();

			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });

				for (const char of chunk) {
					buffer += char;

					if (char === "\n") {
						const payload = buffer.trim();
						buffer = "";

						if (payload) {
							handler(JSON.parse(payload) as StreamEvent);
						}
					}
				}
			}
		} catch (error) {
			console.error("Failed to send message:", error);
		} finally {
			setIsResponding(false);
		}
	});

	const cancel = useStable(() => {
		controller.current?.abort("Chat was cancelled");
	});

	return { sendMessage, isResponding, cancel };
}

/**
 * Main stream hook — routes to overrealdb engine or Lambda based on settings.
 */
export function useSidekickStream(handler: StreamHandler): SidekickStream {
	const overrealdbEnabled = useConfigStore((s) => s.settings.overrealdb.enabled);

	// Both hooks are always called (rules of hooks), but only one is active
	const engineStream = useOverrealdbStream(handler);
	const lambdaStream = useLambdaStream(handler);

	return overrealdbEnabled ? engineStream : lambdaStream;
}
