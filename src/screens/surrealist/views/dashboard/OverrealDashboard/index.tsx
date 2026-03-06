import {
	Badge,
	Box,
	Button,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";
import {
	Icon,
	iconBook,
	iconChat,
	iconCheck,
	iconErrorCircle,
	iconFunction,
	iconQuery,
	iconRelation,
	iconSidekick,
	iconWarning,
} from "@surrealdb/ui";
import { useConnectionNavigator } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import {
	useOverrealHealth,
	useOverrealAgents,
	useOverrealKnowledgeSources,
	useOverrealPipelines,
} from "~/hooks/overrealdb";
import classes from "./style.module.scss";

interface StatCardProps {
	label: string;
	value: number | string;
	icon: string;
	color: string;
	onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
	return (
		<Paper
			className={classes.statCard}
			p="lg"
			onClick={onClick}
			style={{ cursor: onClick ? "pointer" : "default" }}
		>
			<Group justify="space-between">
				<Stack gap={4}>
					<Text
						size="xs"
						c="dimmed"
						tt="uppercase"
						fw={600}
					>
						{label}
					</Text>
					<Text
						size="xl"
						fw={700}
					>
						{value}
					</Text>
				</Stack>
				<ThemeIcon
					size="lg"
					radius="md"
					variant="light"
					color={color}
				>
					<Icon
						path={icon}
						size="sm"
					/>
				</ThemeIcon>
			</Group>
		</Paper>
	);
}

export function OverrealDashboard() {
	const engineUrl = useConfigStore((s) => s.settings.overrealdb.engineUrl);
	const navigateConnection = useConnectionNavigator();

	const { data: health } = useOverrealHealth();
	const { data: agents } = useOverrealAgents();
	const { data: sources } = useOverrealKnowledgeSources();
	const { data: pipelines } = useOverrealPipelines();

	const isHealthy = health?.status === "ok";
	const agentCount = agents?.length ?? 0;
	const sourceCount = sources?.length ?? 0;
	const pipelineCount = pipelines?.length ?? 0;

	return (
		<Box className={classes.dashboard}>
			<Stack gap="xl">
				{/* Engine Status */}
				<Paper
					className={classes.statusBanner}
					p="lg"
				>
					<Group justify="space-between">
						<Group gap="md">
							<ThemeIcon
								size="xl"
								radius="xl"
								variant="light"
								color={isHealthy ? "green" : "red"}
							>
								<Icon
									path={isHealthy ? iconCheck : iconErrorCircle}
									size="md"
								/>
							</ThemeIcon>
							<Stack gap={2}>
								<Text
									fw={600}
									size="lg"
								>
									overrealdb Engine
								</Text>
								<Group gap="xs">
									<Badge
										variant="dot"
										color={isHealthy ? "green" : "red"}
										size="sm"
									>
										{isHealthy ? "Connected" : "Disconnected"}
									</Badge>
									<Text
										size="xs"
										c="dimmed"
									>
										{engineUrl}
									</Text>
								</Group>
							</Stack>
						</Group>
						{health?.version && (
							<Badge
								variant="light"
								color="surreal"
								size="lg"
							>
								v{health.version}
							</Badge>
						)}
					</Group>
				</Paper>

				{/* Stats Grid */}
				<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
					<StatCard
						label="Agents"
						value={agentCount}
						icon={iconSidekick}
						color="surreal"
						onClick={() => navigateConnection("agents")}
					/>
					<StatCard
						label="Knowledge Sources"
						value={sourceCount}
						icon={iconBook}
						color="blue"
						onClick={() => navigateConnection("knowledge")}
					/>
					<StatCard
						label="Pipelines"
						value={pipelineCount}
						icon={iconRelation}
						color="teal"
						onClick={() => navigateConnection("pipelines")}
					/>
					<StatCard
						label="Engine"
						value={isHealthy ? "Healthy" : "Down"}
						icon={isHealthy ? iconCheck : iconWarning}
						color={isHealthy ? "green" : "red"}
					/>
				</SimpleGrid>

				{/* Quick Actions */}
				<Stack gap="sm">
					<Text
						size="sm"
						fw={600}
						c="dimmed"
						tt="uppercase"
					>
						Quick Actions
					</Text>
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
						<Paper
							className={classes.actionCard}
							p="md"
							onClick={() => navigateConnection("query")}
							style={{ cursor: "pointer" }}
						>
							<Group gap="sm">
								<ThemeIcon
									variant="light"
									color="surreal"
									radius="md"
								>
									<Icon
										path={iconQuery}
										size="sm"
									/>
								</ThemeIcon>
								<Stack gap={2}>
									<Text
										size="sm"
										fw={600}
									>
										Open Query Editor
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Write and execute SurrealQL queries
									</Text>
								</Stack>
							</Group>
						</Paper>

						<Paper
							className={classes.actionCard}
							p="md"
							onClick={() => navigateConnection("agents")}
							style={{ cursor: "pointer" }}
						>
							<Group gap="sm">
								<ThemeIcon
									variant="light"
									color="surreal"
									radius="md"
								>
									<Icon
										path={iconSidekick}
										size="sm"
									/>
								</ThemeIcon>
								<Stack gap={2}>
									<Text
										size="sm"
										fw={600}
									>
										Manage Agents
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Create and configure AI agents
									</Text>
								</Stack>
							</Group>
						</Paper>

						<Paper
							className={classes.actionCard}
							p="md"
							onClick={() => navigateConnection("knowledge")}
							style={{ cursor: "pointer" }}
						>
							<Group gap="sm">
								<ThemeIcon
									variant="light"
									color="blue"
									radius="md"
								>
									<Icon
										path={iconBook}
										size="sm"
									/>
								</ThemeIcon>
								<Stack gap={2}>
									<Text
										size="sm"
										fw={600}
									>
										Ingest Knowledge
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Add documents to the knowledge graph
									</Text>
								</Stack>
							</Group>
						</Paper>

						<Paper
							className={classes.actionCard}
							p="md"
							onClick={() => navigateConnection("pipelines")}
							style={{ cursor: "pointer" }}
						>
							<Group gap="sm">
								<ThemeIcon
									variant="light"
									color="teal"
									radius="md"
								>
									<Icon
										path={iconRelation}
										size="sm"
									/>
								</ThemeIcon>
								<Stack gap={2}>
									<Text
										size="sm"
										fw={600}
									>
										Build Pipeline
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Create data processing pipelines
									</Text>
								</Stack>
							</Group>
						</Paper>

						<Paper
							className={classes.actionCard}
							p="md"
							onClick={() => navigateConnection("functions")}
							style={{ cursor: "pointer" }}
						>
							<Group gap="sm">
								<ThemeIcon
									variant="light"
									color="grape"
									radius="md"
								>
									<Icon
										path={iconFunction}
										size="sm"
									/>
								</ThemeIcon>
								<Stack gap={2}>
									<Text
										size="sm"
										fw={600}
									>
										Functions
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Manage SurrealQL functions
									</Text>
								</Stack>
							</Group>
						</Paper>

						<Paper
							className={classes.actionCard}
							p="md"
							style={{ cursor: "pointer" }}
						>
							<Group gap="sm">
								<ThemeIcon
									variant="light"
									color="surreal"
									radius="md"
								>
									<Icon
										path={iconChat}
										size="sm"
									/>
								</ThemeIcon>
								<Stack gap={2}>
									<Text
										size="sm"
										fw={600}
									>
										Chat with Sidekick
									</Text>
									<Text
										size="xs"
										c="dimmed"
									>
										Ask questions about your data
									</Text>
								</Stack>
							</Group>
						</Paper>
					</SimpleGrid>
				</Stack>

				{/* Capabilities */}
				{health && (
					<Stack gap="sm">
						<Text
							size="sm"
							fw={600}
							c="dimmed"
							tt="uppercase"
						>
							Engine Capabilities
						</Text>
						<Paper p="md">
							<Group gap="xs">
								{health.llm_configured && (
									<Badge
										variant="light"
										color="surreal"
									>
										LLM
									</Badge>
								)}
								{health.embedder_configured && (
									<Badge
										variant="light"
										color="blue"
									>
										Embedder
									</Badge>
								)}
								<Badge
									variant="light"
									color="teal"
								>
									SurrealDB
								</Badge>
								{health.mcp_enabled && (
									<Badge
										variant="light"
										color="grape"
									>
										MCP
									</Badge>
								)}
							</Group>
						</Paper>
					</Stack>
				)}
			</Stack>
		</Box>
	);
}
