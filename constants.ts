import pkg from "./package.json" with { type: "json" };

export { APP_NAME } from "./src/shared/constants";

export const GITHUB_USERNAME = pkg.author;

// pop()は配列の末尾を取り出す
export const GITHUB_REPO = pkg.repository.url.split("/").pop();
