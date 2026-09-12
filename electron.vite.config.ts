import { resolve } from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

const shared = resolve("src/shared");

export default defineConfig({
	main: {
		resolve: { alias: { "@shared": shared } },
	},
	preload: {
		resolve: { alias: { "@shared": shared } },
		build: {
			rollupOptions: {
				external: ["electron"],
				output: { format: "cjs", entryFileNames: "[name].cjs" },
			},
		},
	},
	renderer: {
		build: {
			rollupOptions: {
				input: {
					index: resolve("src/renderer/index.html"),
				},
			},
		},
		resolve: {
			alias: {
				"@renderer": resolve("src/renderer/src"),
				"@shared": shared,
			},
		},
		plugins: [
			react(),
			tailwindcss(),
			babel({
				presets: [reactCompilerPreset()],
			}),
		],
	},
});
