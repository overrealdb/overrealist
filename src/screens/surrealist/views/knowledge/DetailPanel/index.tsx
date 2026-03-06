import {
	ActionIcon,
	Badge,
	Box,
	Code,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import { Icon, iconClose } from "@surrealdb/ui";
import {
	useOverrealKnowledgeEntities,
	useOverrealKnowledgeFacts,
} from "~/hooks/overrealdb";
import type { GraphNode } from "~/types/overrealdb";
import { NODE_COLORS } from "../GraphPanel/graphSetup";
import classes from "./style.module.scss";
import clsx from "clsx";

interface DetailPanelProps {
	nodeId: string | null;
	nodeType: GraphNode["type"] | null;
	onClose: () => void;
}

export function DetailPanel({ nodeId, nodeType, onClose }: DetailPanelProps) {
	const isOpen = !!nodeId;
	const { data: facts, isLoading: factsLoading } = useOverrealKnowledgeFacts(
		nodeType === "entity" ? nodeId : null,
	);

	if (!isOpen) {
		return <Box className={clsx(classes.detailPanel, classes.detailPanelCollapsed)} />;
	}

	const color = nodeType ? NODE_COLORS[nodeType] : "#888";

	return (
		<Box className={classes.detailPanel}>
			<Group
				justify="space-between"
				p="sm"
				style={{ borderBottom: "1px solid var(--mantine-color-obsidian-6)" }}
			>
				<Group gap="xs">
					<Badge
						size="sm"
						color={color}
						variant="filled"
						styles={{ root: { backgroundColor: color } }}
					>
						{nodeType}
					</Badge>
					<Text
						size="sm"
						fw={600}
						truncate
						maw={200}
					>
						{nodeId}
					</Text>
				</Group>
				<ActionIcon
					variant="subtle"
					size="sm"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>

			<ScrollArea flex={1}>
				<Stack
					p="sm"
					gap="md"
				>
					{/* Node ID */}
					<Box>
						<Text
							size="xs"
							c="dimmed"
							mb={4}
						>
							ID
						</Text>
						<Code>{nodeId}</Code>
					</Box>

					{/* Type-specific content */}
					{nodeType === "entity" && (
						<Box>
							<Text
								size="xs"
								c="dimmed"
								mb={4}
							>
								Facts
							</Text>
							{factsLoading ? (
								<Loader size="sm" />
							) : facts && facts.length > 0 ? (
								<Stack gap={0}>
									{facts.map((fact) => (
										<Box
											key={fact.id}
											className={classes.factRow}
										>
											<Group
												gap={4}
												wrap="nowrap"
											>
												<Text
													size="xs"
													fw={500}
													c="violet"
												>
													{fact.subject}
												</Text>
												<Text
													size="xs"
													c="dimmed"
												>
													{fact.predicate}
												</Text>
												<Text
													size="xs"
													fw={500}
												>
													{fact.object}
												</Text>
											</Group>
										</Box>
									))}
								</Stack>
							) : (
								<Text
									size="xs"
									c="dimmed"
								>
									No facts found
								</Text>
							)}
						</Box>
					)}

					{nodeType === "document" && (
						<Text
							size="xs"
							c="dimmed"
						>
							Select an entity node to view its facts and relationships.
						</Text>
					)}

					{nodeType === "community" && (
						<Text
							size="xs"
							c="dimmed"
						>
							Community nodes represent clusters of related entities.
						</Text>
					)}

					{nodeType === "fact" && (
						<Text
							size="xs"
							c="dimmed"
						>
							Fact nodes represent extracted relationships between entities.
						</Text>
					)}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
