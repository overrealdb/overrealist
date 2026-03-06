import { Box, Text } from "@mantine/core";
import { iconBook } from "@surrealdb/ui";
import { useCallback, useState } from "react";
import { Introduction } from "~/components/Introduction";
import { useConfigStore } from "~/stores/config";
import { useOverrealHealth } from "~/hooks/overrealdb";
import { useViewFocus } from "~/hooks/routing";
import { SourcesPanel } from "../SourcesPanel";
import { GraphPanel } from "../GraphPanel";
import { DetailPanel } from "../DetailPanel";
import type { GraphNode } from "~/types/overrealdb";
import classes from "./style.module.scss";

export function KnowledgeView() {
	const enabled = useConfigStore((s) => s.settings.overrealdb.enabled);
	const { data: health } = useOverrealHealth();
	const isConnected = enabled && health?.status === "ok";

	const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [selectedNodeType, setSelectedNodeType] = useState<GraphNode["type"] | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const handleSelectNode = useCallback((nodeId: string, nodeType: GraphNode["type"]) => {
		setSelectedNodeId(nodeId);
		setSelectedNodeType(nodeType);
	}, []);

	const handleCloseDetail = useCallback(() => {
		setSelectedNodeId(null);
		setSelectedNodeType(null);
	}, []);

	const handleSearch = useCallback(() => {
		// Search is handled reactively via searchQuery prop to GraphPanel
	}, []);

	useViewFocus("knowledge", () => {
		// Refetch happens inside sub-components
	});

	if (!enabled) {
		return (
			<Introduction
				title="Knowledge"
				icon={iconBook}
			>
				<Text>
					Enable overrealdb in Settings to explore and manage the
					knowledge graph. Documents are chunked, embedded, and stored
					for semantic search.
				</Text>
			</Introduction>
		);
	}

	if (!isConnected) {
		return (
			<Introduction
				title="Knowledge"
				icon={iconBook}
			>
				<Text>
					Unable to connect to the overrealdb engine. Verify the engine
					URL in Settings and ensure the engine is running.
				</Text>
			</Introduction>
		);
	}

	return (
		<Box className={classes.knowledgeLayout}>
			<SourcesPanel
				selectedSourceId={selectedSourceId}
				onSelectSource={setSelectedSourceId}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onSearch={handleSearch}
			/>
			<GraphPanel
				searchQuery={searchQuery}
				onSelectNode={handleSelectNode}
			/>
			<DetailPanel
				nodeId={selectedNodeId}
				nodeType={selectedNodeType}
				onClose={handleCloseDetail}
			/>
		</Box>
	);
}

export default KnowledgeView;
