import logoDarkUrl from "~/assets/images/dark/overreal-logo.svg";
import logoLightUrl from "~/assets/images/light/overreal-logo.svg";
import { useThemeImage } from "./theme";

export function useLogoUrl() {
	return useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});
}
