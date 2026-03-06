import { SURREALIST_THEME } from "./mantine";

/**
 * Overrealdb theme extension.
 * CSS variables do the heavy lifting; this ensures JS-level font overrides
 * propagate through Mantine's style system.
 */
export const OVERREAL_THEME = {
	...SURREALIST_THEME,
	fontFamily: "'Outfit', 'Satoshi', system-ui, sans-serif",
	fontFamilyMonospace: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};
