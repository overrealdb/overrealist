import type { GraphNode } from "~/types/overrealdb";
import type { StepKind } from "~/types/overrealdb";

/**
 * Theme-aware color pairs for overrealdb UI elements.
 * Each key maps to [dark, light] hex values.
 */
const COLOR_PAIRS: Record<string, [dark: string, light: string]> = {
	// Pipeline node types
	source: ["#3498DB", "#2980B9"],
	transform: ["#E67E22", "#D35400"],
	sink: ["#E74C3C", "#C0392B"],

	// Knowledge graph node types
	entity: ["#E67E22", "#D35400"],
	document: ["#3498DB", "#2980B9"],
	fact: ["#2ECC71", "#27AE60"],
	community: ["#9B59B6", "#8E44AD"],

	// Graph chrome
	edge: ["#555555", "#AAAAAA"],
	dimmed: ["#333333", "#CCCCCC"],
	label: ["#CCCCCC", "#333333"],
	bgDot: ["#333333", "#CCCCCC"],
};

/**
 * Read the current color scheme from the DOM.
 * Falls back to "dark" if unset.
 */
export function getColorScheme(): "dark" | "light" {
	if (typeof document === "undefined") return "dark";
	const attr = document.documentElement.getAttribute("data-mantine-color-scheme");
	return attr === "light" ? "light" : "dark";
}

/**
 * Return the themed hex color for a given key.
 */
export function themed(key: string): string {
	const pair = COLOR_PAIRS[key];
	if (!pair) return "#888888";
	return getColorScheme() === "light" ? pair[1] : pair[0];
}

/** Themed node colors for the knowledge graph. */
export function nodeColor(type: GraphNode["type"]): string {
	return themed(type);
}

/** Themed step kind colors for the pipeline canvas. */
export const STEP_KIND_COLORS: Record<StepKind, string> = new Proxy(
	{} as Record<StepKind, string>,
	{
		get(_target, prop: string) {
			const mapping: Record<string, string> = {
				file_connector: "source",
				api_connector: "fact",
				chunker: "transform",
				embedder: "transform",
				extractor: "community",
				surrealdb_sink: "sink",
			};
			return themed(mapping[prop] ?? prop);
		},
	},
);
