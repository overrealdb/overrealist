import { Box, Loader, Text } from "@mantine/core";
import { iconRelation } from "@surrealdb/ui";
import { Introduction } from "~/components/Introduction";
import { useConfigStore } from "~/stores/config";
import { useOverrealHealth } from "~/hooks/overrealdb";
import { PipelineCanvas } from "../PipelineCanvas";
import { PipelineList } from "../PipelineList";
import { ConfigPanel } from "../ConfigPanel";
import { useState } from "react";
import classes from "./style.module.scss";

export function PipelinesView() {
	const enabled = useConfigStore((s) => s.settings.overrealdb.enabled);
	const { data: health, isLoading: isHealthLoading } = useOverrealHealth();
	const isConnected = enabled && health?.status === "ok";

	const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
	const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

	if (!enabled) {
		return (
			<Introduction
				title="Pipelines"
				icon={iconRelation}
			>
				<Text>
					Enable overrealdb in Settings to build data pipelines.
					Pipelines connect sources, transforms, and sinks into
					automated data flows.
				</Text>
			</Introduction>
		);
	}

	if (enabled && isHealthLoading) {
		return (
			<Box style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
				<Loader />
			</Box>
		);
	}

	if (!isConnected) {
		return (
			<Introduction
				title="Pipelines"
				icon={iconRelation}
			>
				<Text>
					Unable to connect to the overrealdb engine. Verify the engine
					URL in Settings and ensure the engine is running.
				</Text>
			</Introduction>
		);
	}

	return (
		<Box className={classes.pipelinesLayout}>
			<PipelineList
				selectedId={selectedPipelineId}
				onSelect={setSelectedPipelineId}
			/>
			<PipelineCanvas
				pipelineId={selectedPipelineId}
				onSelectStep={setSelectedStepId}
			/>
			<ConfigPanel
				pipelineId={selectedPipelineId}
				stepId={selectedStepId}
				onClose={() => setSelectedStepId(null)}
			/>
		</Box>
	);
}

export default PipelinesView;
