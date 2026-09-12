import { join } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { app } from "electron";
import { PrismaClient } from "../../../prisma/generated/prisma/client";

const DATABASE_FILE_NAME = "api-health-check.db";

/**
 * DB はユーザーの userData 配下に置く。
 * app.getPath は app ready 前だと例外になるため、呼び出しは遅延させる。
 */
export const getDatabasePath = (): string =>
	join(app.getPath("userData"), DATABASE_FILE_NAME);

let client: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
	if (!client) {
		client = new PrismaClient({
			adapter: new PrismaBetterSqlite3({ url: `file:${getDatabasePath()}` }),
		});
	}
	return client;
};

export const closePrisma = async (): Promise<void> => {
	if (client) {
		await client.$disconnect();
		client = null;
	}
};
