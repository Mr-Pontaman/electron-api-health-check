import type { PontaPingApi } from "@shared/types";

declare global {
	interface Window {
		api: PontaPingApi;
	}
}
