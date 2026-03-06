import {
	ActionIcon,
	Badge,
	Box,
	Code,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { Icon, iconClose, iconTune } from "@surrealdb/ui";
import { useOverrealPipeline } from "~/hooks/overrealdb";
import { STEP_KIND_COLORS, STEP_KIND_LABELS, type StepKind } from "~/types/overrealdb";
import classes from "./style.module.scss";
import clsx from "clsx";

interface ConfigPanelProps {
	pipelineId: string | null;
	stepId: string | null;
	onClose: () => void;
}

export function ConfigPanel({ pipelineId, stepId, onClose }: ConfigPanelProps) {
	const { data: pipeline } = useOverrealPipeline(pipelineId);
	const step = pipeline?.steps.find((s) => s.id === stepId);

	if (!stepId || !step) {
		return <Box className={clsx(classes.configPanel, classes.configPanelCollapsed)} />;
	}

	const kind = step.kind as StepKind;
	const color = STEP_KIND_COLORS[kind] ?? "#888";
	const label = STEP_KIND_LABELS[kind] ?? step.kind;

	return (
		<Box className={classes.configPanel}>
			<Group
				justify="space-between"
				p="sm"
				style={{ borderBottom: "1px solid var(--mantine-color-obsidian-6)" }}
			>
				<Group gap="xs">
					<Icon
						path={iconTune}
						size="sm"
					/>
					<Text
						size="sm"
						fw={600}
					>
						Step Configuration
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
					<Box>
						<Text
							size="xs"
							c="dimmed"
							mb={4}
						>
							Type
						</Text>
						<Badge
							color={color}
							variant="filled"
							styles={{ root: { backgroundColor: color } }}
						>
							{label}
						</Badge>
					</Box>

					<Box>
						<Text
							size="xs"
							c="dimmed"
							mb={4}
						>
							Step ID
						</Text>
						<Code>{step.id}</Code>
					</Box>

					<TextInput
						label="Label"
						value={step.label ?? ""}
						readOnly
						size="sm"
					/>

					<Box>
						<Text
							size="xs"
							c="dimmed"
							mb={4}
						>
							Configuration
						</Text>
						<Textarea
							value={JSON.stringify(step.config, null, 2)}
							readOnly
							minRows={6}
							maxRows={12}
							autosize
							styles={{
								input: {
									fontFamily: "var(--mantine-font-family-monospace)",
									fontSize: "var(--mantine-font-size-xs)",
								},
							}}
						/>
					</Box>

					<Box>
						<Text
							size="xs"
							c="dimmed"
							mb={4}
						>
							Position
						</Text>
						<Code>
							x: {step.position.x}, y: {step.position.y}
						</Code>
					</Box>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
