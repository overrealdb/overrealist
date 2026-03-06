import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { Icon, iconPlus, iconRefresh, iconSearch, iconSidekick } from "@surrealdb/ui";
import { useState } from "react";
import {
	type OverrealAgent,
	useOverrealAgents,
} from "~/hooks/overrealdb";
import classes from "./style.module.scss";
import clsx from "clsx";

interface AgentListProps {
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	onCreate: () => void;
}

export function AgentList({ selectedId, onSelect, onCreate }: AgentListProps) {
	const { data: agents, isLoading, refetch } = useOverrealAgents();
	const [filter, setFilter] = useState("");

	const filtered = agents?.filter(
		(a) =>
			!filter ||
			a.name.toLowerCase().includes(filter.toLowerCase()) ||
			a.description?.toLowerCase().includes(filter.toLowerCase()),
	);

	return (
		<Box className={classes.agentListPanel}>
			<Stack
				gap="xs"
				p="sm"
			>
				<Group
					justify="space-between"
					gap="xs"
				>
					<Text
						fw={600}
						size="sm"
					>
						Agents
					</Text>
					<Group gap={4}>
						<ActionIcon
							variant="subtle"
							size="sm"
							onClick={() => refetch()}
						>
							<Icon path={iconRefresh} />
						</ActionIcon>
						<ActionIcon
							variant="subtle"
							size="sm"
							color="surreal"
							onClick={onCreate}
						>
							<Icon path={iconPlus} />
						</ActionIcon>
					</Group>
				</Group>

				<TextInput
					size="xs"
					placeholder="Filter agents..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					leftSection={
						<Icon
							path={iconSearch}
							size="sm"
						/>
					}
				/>
			</Stack>

			<ScrollArea flex={1}>
				<Stack
					gap={2}
					px="sm"
					pb="sm"
				>
					{isLoading ? (
						<Loader size="sm" />
					) : filtered && filtered.length > 0 ? (
						filtered.map((agent) => (
							<Box
								key={agent.id}
								className={clsx(
									classes.agentItem,
									selectedId === agent.id && classes.agentItemActive,
								)}
								onClick={() => onSelect(agent.id)}
							>
								<Group
									gap="xs"
									wrap="nowrap"
									justify="space-between"
								>
									<Box style={{ overflow: "hidden" }}>
										<Group
											gap="xs"
											wrap="nowrap"
										>
											<Icon
												path={iconSidekick}
												size="sm"
											/>
											<Text
												size="sm"
												fw={500}
												truncate
											>
												{agent.name}
											</Text>
										</Group>
										<Text
											size="xs"
											c="dimmed"
											truncate
										>
											{agent.model}
										</Text>
									</Box>
									<Badge
										size="xs"
										color={agent.enabled ? "green" : "gray"}
										variant="light"
									>
										{agent.enabled ? "on" : "off"}
									</Badge>
								</Group>
							</Box>
						))
					) : (
						<Text
							size="xs"
							c="dimmed"
							ta="center"
							py="lg"
						>
							No agents found
						</Text>
					)}
				</Stack>
			</ScrollArea>

			<Box
				p="sm"
				style={{ borderTop: "1px solid var(--mantine-color-obsidian-6)" }}
			>
				<Button
					fullWidth
					size="xs"
					variant="gradient"
					leftSection={<Icon path={iconPlus} />}
					onClick={onCreate}
				>
					Create agent
				</Button>
			</Box>
		</Box>
	);
}
