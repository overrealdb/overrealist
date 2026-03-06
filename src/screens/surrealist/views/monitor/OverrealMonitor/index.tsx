import {
	Badge,
	Box,
	Group,
	Paper,
	Progress,
	RingProgress,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";
import {
	Icon,
	iconBook,
	iconChart,
	iconCheck,
	iconErrorCircle,
	iconRelation,
	iconSidekick,
	iconWarning,
} from "@surrealdb/ui";
import { useEffect, useState } from "react";
import { useConfigStore } from "~/stores/config";
import {
	useOverrealHealth,
	useOverrealAgents,
	useOverrealKnowledgeSources,
	useOverrealPipelines,
} from "~/hooks/overrealdb";
import classes from "./style.module.scss";

interface UptimeTick {
	timestamp: number;
	healthy: boolean;
}

export function OverrealMonitor() {
	const engineUrl = useConfigStore((s) => s.settings.overrealdb.engineUrl);
	const { data: health, dataUpdatedAt } = useOverrealHealth();
	const { data: agents } = useOverrealAgents();
	const { data: sources } = useOverrealKnowledgeSources();
	const { data: pipelines } = useOverrealPipelines();

	const isHealthy = health?.status === "ok";
	const [uptimeHistory, setUptimeHistory] = useState<UptimeTick[]>([]);

	// Track uptime history
	useEffect(() => {
		if (dataUpdatedAt > 0) {
			setUptimeHistory((prev) => {
				const tick: UptimeTick = {
					timestamp: dataUpdatedAt,
					healthy: isHealthy,
				};
				const updated = [...prev, tick];
				// Keep last 60 ticks (30 minutes at 30s interval)
				return updated.slice(-60);
			});
		}
	}, [dataUpdatedAt, isHealthy]);

	const uptimePercent =
		uptimeHistory.length > 0
			? Math.round((uptimeHistory.filter((t) => t.healthy).length / uptimeHistory.length) * 100)
			: isHealthy
				? 100
				: 0;

	return (
		<ScrollArea
			flex={1}
			scrollbars="y"
			type="scroll"
		>
			<Box className={classes.monitor}>
				<Stack gap="xl">
					{/* Health Overview */}
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
						<Paper
							p="lg"
							className={classes.card}
						>
							<Stack
								gap="xs"
								align="center"
							>
								<RingProgress
									size={80}
									thickness={8}
									roundCaps
									sections={[
										{
											value: uptimePercent,
											color: uptimePercent > 95 ? "green" : uptimePercent > 50 ? "orange" : "red",
										},
									]}
									label={
										<Text
											ta="center"
											fw={700}
											size="sm"
										>
											{uptimePercent}%
										</Text>
									}
								/>
								<Text
									size="xs"
									c="dimmed"
									tt="uppercase"
									fw={600}
								>
									Uptime
								</Text>
							</Stack>
						</Paper>

						<Paper
							p="lg"
							className={classes.card}
						>
							<Stack gap="xs">
								<Group justify="space-between">
									<Text
										size="xs"
										c="dimmed"
										tt="uppercase"
										fw={600}
									>
										Engine Status
									</Text>
									<ThemeIcon
										size="sm"
										variant="light"
										color={isHealthy ? "green" : "red"}
										radius="xl"
									>
										<Icon
											path={isHealthy ? iconCheck : iconErrorCircle}
											size="xs"
										/>
									</ThemeIcon>
								</Group>
								<Text
									size="lg"
									fw={700}
								>
									{isHealthy ? "Healthy" : "Unreachable"}
								</Text>
								<Text
									size="xs"
									c="dimmed"
								>
									{engineUrl}
								</Text>
							</Stack>
						</Paper>

						<Paper
							p="lg"
							className={classes.card}
						>
							<Stack gap="xs">
								<Text
									size="xs"
									c="dimmed"
									tt="uppercase"
									fw={600}
								>
									Version
								</Text>
								<Text
									size="lg"
									fw={700}
								>
									{health?.version ?? "Unknown"}
								</Text>
								<Group gap={4}>
									{health?.llm_configured && (
										<Badge
											size="xs"
											variant="dot"
											color="surreal"
										>
											LLM
										</Badge>
									)}
									{health?.embedder_configured && (
										<Badge
											size="xs"
											variant="dot"
											color="blue"
										>
											Embedder
										</Badge>
									)}
								</Group>
							</Stack>
						</Paper>

						<Paper
							p="lg"
							className={classes.card}
						>
							<Stack gap="xs">
								<Text
									size="xs"
									c="dimmed"
									tt="uppercase"
									fw={600}
								>
									Resources
								</Text>
								<Group gap="lg">
									<Stack
										gap={2}
										align="center"
									>
										<Text
											size="lg"
											fw={700}
										>
											{agents?.length ?? 0}
										</Text>
										<Text
											size="xs"
											c="dimmed"
										>
											Agents
										</Text>
									</Stack>
									<Stack
										gap={2}
										align="center"
									>
										<Text
											size="lg"
											fw={700}
										>
											{sources?.length ?? 0}
										</Text>
										<Text
											size="xs"
											c="dimmed"
										>
											Sources
										</Text>
									</Stack>
									<Stack
										gap={2}
										align="center"
									>
										<Text
											size="lg"
											fw={700}
										>
											{pipelines?.length ?? 0}
										</Text>
										<Text
											size="xs"
											c="dimmed"
										>
											Pipelines
										</Text>
									</Stack>
								</Group>
							</Stack>
						</Paper>
					</SimpleGrid>

					{/* Uptime Timeline */}
					<Paper
						p="lg"
						className={classes.card}
					>
						<Stack gap="sm">
							<Group justify="space-between">
								<Text
									size="sm"
									fw={600}
								>
									Uptime History
								</Text>
								<Text
									size="xs"
									c="dimmed"
								>
									Last {uptimeHistory.length} checks (30s interval)
								</Text>
							</Group>
							<Group
								gap={2}
								className={classes.uptimeBars}
							>
								{uptimeHistory.length === 0 ? (
									<Text
										size="xs"
										c="dimmed"
									>
										Collecting data...
									</Text>
								) : (
									uptimeHistory.map((tick, i) => (
										<Box
											key={i}
											className={classes.uptimeBar}
											style={{
												backgroundColor: tick.healthy
													? "var(--mantine-color-green-6)"
													: "var(--mantine-color-red-6)",
											}}
										/>
									))
								)}
							</Group>
						</Stack>
					</Paper>

					{/* Service Health */}
					<Paper
						p="lg"
						className={classes.card}
					>
						<Stack gap="md">
							<Text
								size="sm"
								fw={600}
							>
								Service Components
							</Text>
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<ServiceRow
									name="SurrealDB"
									status={isHealthy}
									description="Database engine"
								/>
								<ServiceRow
									name="LLM Provider"
									status={health?.llm_configured ?? false}
									description={health?.llm_configured ? "Connected" : "Not configured"}
								/>
								<ServiceRow
									name="Embedding Provider"
									status={health?.embedder_configured ?? false}
									description={health?.embedder_configured ? "Connected" : "Not configured"}
								/>
								<ServiceRow
									name="MCP Server"
									status={health?.mcp_enabled ?? false}
									description={health?.mcp_enabled ? "Enabled" : "Disabled"}
								/>
							</SimpleGrid>
						</Stack>
					</Paper>

					{/* Resource Summary */}
					<SimpleGrid cols={{ base: 1, sm: 3 }}>
						<ResourceCard
							icon={iconSidekick}
							color="surreal"
							label="Agents"
							count={agents?.length ?? 0}
							items={agents?.slice(0, 5).map((a) => a.name) ?? []}
						/>
						<ResourceCard
							icon={iconBook}
							color="blue"
							label="Knowledge Sources"
							count={sources?.length ?? 0}
							items={sources?.slice(0, 5).map((s) => s.name) ?? []}
						/>
						<ResourceCard
							icon={iconRelation}
							color="teal"
							label="Pipelines"
							count={pipelines?.length ?? 0}
							items={pipelines?.slice(0, 5).map((p) => p.name) ?? []}
						/>
					</SimpleGrid>
				</Stack>
			</Box>
		</ScrollArea>
	);
}

function ServiceRow({
	name,
	status,
	description,
}: {
	name: string;
	status: boolean;
	description: string;
}) {
	return (
		<Group
			justify="space-between"
			p="xs"
		>
			<Stack gap={2}>
				<Text
					size="sm"
					fw={500}
				>
					{name}
				</Text>
				<Text
					size="xs"
					c="dimmed"
				>
					{description}
				</Text>
			</Stack>
			<Badge
				variant="light"
				color={status ? "green" : "gray"}
				size="sm"
			>
				{status ? "Active" : "Inactive"}
			</Badge>
		</Group>
	);
}

function ResourceCard({
	icon,
	color,
	label,
	count,
	items,
}: {
	icon: string;
	color: string;
	label: string;
	count: number;
	items: string[];
}) {
	return (
		<Paper
			p="lg"
			className={classes.card}
		>
			<Stack gap="sm">
				<Group justify="space-between">
					<Group gap="xs">
						<ThemeIcon
							variant="light"
							color={color}
							size="sm"
						>
							<Icon
								path={icon}
								size="xs"
							/>
						</ThemeIcon>
						<Text
							size="sm"
							fw={600}
						>
							{label}
						</Text>
					</Group>
					<Badge
						variant="light"
						color={color}
						size="sm"
					>
						{count}
					</Badge>
				</Group>
				{items.length > 0 ? (
					<Stack gap={4}>
						{items.map((item, i) => (
							<Text
								key={i}
								size="xs"
								c="dimmed"
								lineClamp={1}
							>
								{item}
							</Text>
						))}
						{count > 5 && (
							<Text
								size="xs"
								c="dimmed"
								fs="italic"
							>
								+{count - 5} more
							</Text>
						)}
					</Stack>
				) : (
					<Text
						size="xs"
						c="dimmed"
					>
						None configured
					</Text>
				)}
			</Stack>
		</Paper>
	);
}
