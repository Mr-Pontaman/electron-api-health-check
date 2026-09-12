import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { app } from "electron";
import { getDatabasePath } from "./client";

/**
 * 配布したアプリには Prisma CLI が無いため、prisma/migrations の SQL を
 * 起動時に自前で適用する。適用済みは _migration テーブルで管理する。
 */
const resolveMigrationsDir = (): string | null => {
	const candidates = [
		join(process.resourcesPath, "app.asar.unpacked", "prisma", "migrations"),
		join(app.getAppPath(), "prisma", "migrations"),
	];
	return candidates.find((dir) => existsSync(dir)) ?? null;
};

export const applyMigrations = (): void => {
	const migrationsDir = resolveMigrationsDir();
	if (!migrationsDir) {
		throw new Error("prisma/migrations が見つかりませんでした");
	}

	const db = new Database(getDatabasePath());
	try {
		db.exec(`
			CREATE TABLE IF NOT EXISTS "_migration" (
				"name" TEXT NOT NULL PRIMARY KEY,
				"appliedAt" TEXT NOT NULL
			);
		`);

		const applied = new Set(
			db
				.prepare('SELECT "name" FROM "_migration"')
				.all()
				.map((row) => (row as { name: string }).name),
		);

		const directories = readdirSync(migrationsDir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort();

		const record = db.prepare(
			'INSERT INTO "_migration" ("name", "appliedAt") VALUES (?, ?)',
		);

		for (const name of directories) {
			if (applied.has(name)) continue;

			const sqlPath = join(migrationsDir, name, "migration.sql");
			if (!existsSync(sqlPath)) continue;

			db.transaction(() => {
				db.exec(readFileSync(sqlPath, "utf-8"));
				record.run(name, new Date().toISOString());
			})();
		}
	} finally {
		db.close();
	}
};
