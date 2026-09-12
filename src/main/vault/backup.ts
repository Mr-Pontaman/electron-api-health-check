import { readFile, writeFile } from "node:fs/promises";
import type { VaultBackupSummary } from "@shared/types";
import {
	VAULT_BACKUP_FORMAT,
	VAULT_BACKUP_SCHEMA_VERSION,
	type VaultBackup,
	vaultBackupSchema,
} from "@shared/validation";
import { app, BrowserWindow, dialog } from "electron";
import { getPrisma } from "../db/client";
import { decryptWithKey, deriveMasterKey } from "./crypto";
import { lock, unlock } from "./master-password";
import {
	readSetting,
	SETTING_SALT,
	SETTING_VERIFIER,
	SETTING_VERIFIER_IV,
	upsertSetting,
	VAULT_SETTING_KEYS,
} from "./settings";

const BACKUP_FILTERS = [
	{ name: "Ponta Ping バックアップ", extensions: ["json"] },
];

/**
 * ファイルを選んだあと、パスワードが入力されるまでの間だけ保持する。
 * レンダラーには概要しか渡さないので、暗号文は main の中に留まる。
 */
let pendingImport: VaultBackup | null = null;

const buildBackup = async (): Promise<VaultBackup> => {
	const salt = await readSetting(SETTING_SALT);
	const verifier = await readSetting(SETTING_VERIFIER);
	const verifierIv = await readSetting(SETTING_VERIFIER_IV);

	if (!salt || !verifier || !verifierIv) {
		throw new Error("マスターパスワードが設定されていません");
	}

	const prisma = getPrisma();
	const [targets, migrations] = await Promise.all([
		prisma.apiTarget.findMany({ orderBy: { createdAt: "asc" } }),
		// _migration は Prisma のモデルではないので生の SQL で読む
		prisma.$queryRaw<{ name: string }[]>`
			SELECT "name" FROM "_migration" ORDER BY "name"
		`,
	]);

	return {
		format: VAULT_BACKUP_FORMAT,
		schemaVersion: VAULT_BACKUP_SCHEMA_VERSION,
		appVersion: app.getVersion(),
		exportedAt: new Date().toISOString(),
		migrations: migrations.map((row) => row.name),
		settings: {
			"vault.salt": salt,
			"vault.verifier": verifier,
			"vault.verifierIv": verifierIv,
		},
		targets: targets.map((target) => ({
			id: target.id,
			name: target.name,
			url: target.url,
			method: target.method,
			authType: target.authType,
			credentialKey: target.credentialKey,
			encryptedValue: target.encryptedValue,
			iv: target.iv,
			createdAt: target.createdAt.toISOString(),
			updatedAt: target.updatedAt.toISOString(),
		})),
	};
};

/**
 * 読み込んだテキストを検証する。
 * 「JSON ではない」「別のアプリのファイル」「新しい版で作られた」を
 * それぞれ区別できるメッセージで返したいので、zod の前に素朴に判定する。
 */
const parseVaultBackup = (raw: string): VaultBackup => {
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		throw new Error("ファイルを JSON として読み取れませんでした");
	}

	if (typeof json !== "object" || json === null) {
		throw new Error("バックアップファイルの形式が正しくありません");
	}

	const { format, schemaVersion } = json as Record<string, unknown>;

	if (format !== VAULT_BACKUP_FORMAT) {
		throw new Error("Ponta Ping のバックアップファイルではありません");
	}
	if (
		typeof schemaVersion !== "number" ||
		schemaVersion > VAULT_BACKUP_SCHEMA_VERSION
	) {
		throw new Error(
			"このバックアップは新しいバージョンのアプリで作成されています。アプリを更新してください",
		);
	}

	const parsed = vaultBackupSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error("バックアップの内容が壊れています");
	}
	return parsed.data;
};

/** バックアップを書き出す。キャンセルされたら null を返す。 */
export const exportVaultToFile = async (): Promise<{
	filePath: string;
} | null> => {
	const options = {
		title: "バックアップの保存先",
		defaultPath: `ponta-ping-backup-${new Date().toISOString().slice(0, 10)}.json`,
		filters: BACKUP_FILTERS,
	};

	const parent = BrowserWindow.getFocusedWindow();
	const result = parent
		? await dialog.showSaveDialog(parent, options)
		: await dialog.showSaveDialog(options);

	if (result.canceled || !result.filePath) {
		return null;
	}

	// 保存先を決めてもらってから組み立てる。キャンセル時に無駄に読まないため。
	const backup = await buildBackup();
	await writeFile(
		result.filePath,
		`${JSON.stringify(backup, null, 2)}\n`,
		"utf-8",
	);

	return { filePath: result.filePath };
};

/** バックアップを選んで検証し、概要を返す。キャンセルされたら null を返す。 */
export const selectVaultBackup =
	async (): Promise<VaultBackupSummary | null> => {
		const options = {
			title: "バックアップの選択",
			properties: ["openFile" as const],
			filters: BACKUP_FILTERS,
		};

		const parent = BrowserWindow.getFocusedWindow();
		const result = parent
			? await dialog.showOpenDialog(parent, options)
			: await dialog.showOpenDialog(options);

		// キャンセルしたときは前に選んだファイルを保持したままにする。
		// レンダラー側も概要を出したままにするので、ここで消すと
		// 「選び直そうとしてやめたら復元できなくなった」という食い違いになる。
		if (result.canceled || result.filePaths.length === 0) {
			return null;
		}

		const raw = await readFile(result.filePaths[0], "utf-8");
		const backup = parseVaultBackup(raw);
		pendingImport = backup;

		return {
			exportedAt: backup.exportedAt,
			appVersion: backup.appVersion,
			targetCount: backup.targets.length,
		};
	};

/**
 * 選択済みのバックアップで現在のデータを置き換える。
 *
 * 検証をすべて書き込みの前に済ませるのが肝。順番を逆にすると、
 * パスワードを打ち間違えただけで既存のデータを壊してしまう。
 */
export const restoreVaultFromPending = async (
	masterPassword: string,
): Promise<void> => {
	const backup = pendingImport;
	if (!backup) {
		throw new Error("バックアップが選択されていません");
	}

	// 1. バックアップ自身が持つ salt で鍵を導出し、verifier を復号できれば
	//    パスワードは正しい。ここで DB には一切触らない。
	const key = await deriveMasterKey(
		masterPassword,
		backup.settings["vault.salt"],
	);

	try {
		await decryptWithKey(key, {
			value: backup.settings["vault.verifier"],
			iv: backup.settings["vault.verifierIv"],
		});
	} catch {
		throw new Error("マスターパスワードが正しくありません");
	}

	// 2. 個々の認証情報も復号できるか確かめる。鍵導出は済んでいるので
	//    AES-GCM の分しかコストがかからない。
	for (const target of backup.targets) {
		if (!target.encryptedValue || !target.iv) continue;

		try {
			await decryptWithKey(key, {
				value: target.encryptedValue,
				iv: target.iv,
			});
		} catch {
			throw new Error(`「${target.name}」の認証情報を復号できませんでした`);
		}
	}

	// 3. ここまで通って初めて置き換える。マージはしない。
	const prisma = getPrisma();
	await prisma.$transaction([
		prisma.apiTarget.deleteMany({}),
		prisma.appSetting.upsert(
			upsertSetting(SETTING_SALT, backup.settings["vault.salt"]),
		),
		prisma.appSetting.upsert(
			upsertSetting(SETTING_VERIFIER, backup.settings["vault.verifier"]),
		),
		prisma.appSetting.upsert(
			upsertSetting(SETTING_VERIFIER_IV, backup.settings["vault.verifierIv"]),
		),
		...backup.targets.map((target) =>
			prisma.apiTarget.create({
				data: {
					id: target.id,
					name: target.name,
					url: target.url,
					method: target.method,
					authType: target.authType,
					credentialKey: target.credentialKey,
					encryptedValue: target.encryptedValue,
					iv: target.iv,
					createdAt: new Date(target.createdAt),
					updatedAt: new Date(target.updatedAt),
				},
			}),
		),
	]);

	pendingImport = null;

	// 4. 復元した内容のまま解錠状態にする。unlock は保存済みの salt を読むので、
	//    いま書いた salt から手順1と同じ鍵が導出される。
	await unlock(masterPassword);
};

/**
 * 初期化。認証情報とマスターパスワード設定を消して未初期化状態に戻す。
 * app_setting 全体ではなく vault の3キーだけを消す。
 */
export const resetVault = async (masterPassword: string): Promise<void> => {
	if (!(await unlock(masterPassword))) {
		throw new Error("マスターパスワードが正しくありません");
	}

	const prisma = getPrisma();
	await prisma.$transaction([
		prisma.apiTarget.deleteMany({}),
		prisma.appSetting.deleteMany({
			where: { key: { in: [...VAULT_SETTING_KEYS] } },
		}),
	]);

	pendingImport = null;
	// 消した salt から導出した鍵を持ち続けないよう、必ず落とす。
	lock();
};
