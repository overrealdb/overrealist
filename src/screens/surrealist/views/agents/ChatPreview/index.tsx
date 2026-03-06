import {
	ActionIcon,
	Box,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { Icon, iconChat, iconClose, Markdown } from "@surrealdb/ui";
import { useCallback, useRef, useState } from "react";
import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { translateEngineEvent } from "~/components/Sidekick/sse";
import type { StreamEvent } from "~/components/Sidekick/types";
import classes from "./style.module.scss";
import clsx from "clsx";

interface ChatPreviewProps {
	agentId: string | null;
}

interface PreviewMessage {
	role: "user" | "assistant";
	content: string;
}

export function ChatPreview({ agentId }: ChatPreviewProps) {
	const engineUrl = useConfigStore((s) => s.settings.overrealdb.engineUrl);
	const [messages, setMessages] = useState<PreviewMessage[]>([]);
	const [input, setInput] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	const sendMessage = useCallback(async () => {
		if (!input.trim() || !agentId || isStreaming) return;

		const userMessage = input.trim();
		setInput("");
		setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
		setIsStreaming(true);

		try {
			const base = engineUrl.replace(/\/$/, "");

			// Create session if needed
			let sid = sessionId;
			if (!sid) {
				const resp = await adapter.fetch(`${base}/chat/sessions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ agent_id: agentId }),
				});
				const data = await resp.json();
				sid = data.id;
				setSessionId(sid);
			}

			// Stream response
			const resp = await adapter.fetch(`${base}/chat/sessions/${sid}/stream`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage }),
			});

			const reader = resp.body?.getReader();
			if (!reader) throw new Error("No stream body");

			const decoder = new TextDecoder();
			let assistantContent = "";
			setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const text = decoder.decode(value, { stream: true });
				const lines = text.split("\n");

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const json = line.slice(6).trim();
					if (!json) continue;

					try {
						const raw = JSON.parse(json);
						const event = translateEngineEvent(raw, sid ?? "", assistantContent);
						if (event?.type === "response") {
							assistantContent += event.data.content;
							setMessages((prev) => {
								const updated = [...prev];
								updated[updated.length - 1] = {
									role: "assistant",
									content: assistantContent,
								};
								return updated;
							});
						}
					} catch {
						// Skip malformed lines
					}
				}
			}
		} catch (err) {
			setMessages((prev) => [
				...prev.slice(0, -1).filter((m) => m.content), // Remove empty assistant message
				{ role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` },
			]);
		} finally {
			setIsStreaming(false);
		}
	}, [input, agentId, sessionId, engineUrl, isStreaming]);

	if (!agentId) {
		return <Box className={clsx(classes.chatPreviewPanel, classes.chatPreviewCollapsed)} />;
	}

	return (
		<Box className={classes.chatPreviewPanel}>
			<Group
				justify="space-between"
				p="sm"
				style={{ borderBottom: "1px solid var(--mantine-color-obsidian-6)" }}
			>
				<Group gap="xs">
					<Icon
						path={iconChat}
						size="sm"
					/>
					<Text
						size="sm"
						fw={600}
					>
						Chat Preview
					</Text>
				</Group>
			</Group>

			<ScrollArea
				flex={1}
				viewportRef={scrollRef}
			>
				<Stack
					gap="sm"
					p="sm"
				>
					{messages.length === 0 && (
						<Text
							size="sm"
							c="dimmed"
							ta="center"
							py="xl"
						>
							Send a message to test this agent
						</Text>
					)}
					{messages.map((msg, i) => (
						<Box key={i}>
							{msg.role === "user" ? (
								<Paper
									p="xs"
									bg="obsidian.6"
								>
									<Text size="sm">{msg.content}</Text>
								</Paper>
							) : (
								<Box>
									{msg.content ? (
										<Markdown content={msg.content} />
									) : (
										<Group gap="xs">
											<Loader
												size={12}
												color="surreal"
											/>
											<Text
												size="sm"
												c="dimmed"
											>
												Thinking...
											</Text>
										</Group>
									)}
								</Box>
							)}
						</Box>
					))}
				</Stack>
			</ScrollArea>

			<Box className={classes.chatInputArea}>
				<Textarea
					placeholder="Type a message..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							sendMessage();
						}
					}}
					minRows={1}
					maxRows={4}
					autosize
					disabled={isStreaming}
				/>
			</Box>
		</Box>
	);
}
