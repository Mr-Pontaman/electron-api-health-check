import pkg from "./package.json" with { type: "json" };

export { APP_NAME } from "./src/shared/constants";

export const GITHUB_USERNAME = pkg.author;

export const GITHUB_REPO = pkg.repository.url.split("/").pop();
