import type { Configuration } from "electron-builder";
import { APP_NAME, GITHUB_REPO, GITHUB_USERNAME } from "./constants";

const config: Configuration = {
	appId: "com.mr_pontaman.pontaping",
	productName: APP_NAME,
	directories: {
		buildResources: "build",
	},
	files: [
		"!**/.vscode/*",
		"!src/*",
		"!electron.vite.config.{js,ts,mjs,cjs}",
		"!electron-builder.config.{js,ts,mjs,cjs}",
		"!constants.ts",
		"!{.eslintcache,biome.json,dev-app-update.yml,CHANGELOG.md,README.md}",
		"!{.env,.env.*,.npmrc,pnpm-lock.yaml,pnpm-workspace.yaml}",
		"!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}",
		"!build/*",
		"!scripts/*",
		"!snap/*",
		"!.tsbuild/*",
	],
	asarUnpack: [
		"resources/**",
		"**/*.node",
		"**/*.wasm",
		"prisma/migrations/**",
	],
	linux: {
		target: ["AppImage", "deb"],
		maintainer: GITHUB_USERNAME,
		category: "Utility",
	},
	appImage: {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: electron-builder の書式
		artifactName: "${name}-${version}.${ext}",
	},
	deb: {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: electron-builder の書式
		artifactName: "${name}-${version}.${ext}",
	},
	npmRebuild: true,
	publish: {
		provider: "github",
		owner: GITHUB_USERNAME,
		repo: GITHUB_REPO,
		releaseType: "release",
	},
};

export default config;
