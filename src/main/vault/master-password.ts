import { getPrisma } from "../db/client";
import {
	createSalt,
	decryptWithKey,
	deriveMasterKey,
	encryptWithKey,
} from "./crypto";

const SETTING_SALT = "vault.salt";
const SETTING_VERIFIER = "vault.verifier";
const SETTING_VERIFIER_IV = "vault.verifierIv";

/**
 * 解錠の判定に使う既知の文字列
 */
const VERIFIER_PLAINTEXT = "ponta-ping-vault-verifier-v1";

let unlockedKey: CryptoKey | null = null;

export const isUnlocked = (): boolean => unlockedKey !== null;

export const requireUnlockedKey = (): CryptoKey => {
	if (!unlockedKey) {
		throw new Error("マスターパスワードで解錠されていません");
	}
	return unlockedKey;
};

const readSetting = async (key: string): Promise<string | null> => {
	const row = await getPrisma().appSetting.findUnique({ where: { key } });
	return row?.value ?? null;
};

const upsertSetting = (key: string, value: string) => ({
	where: { key },
	create: { key, value },
	update: { value },
});

export const isMasterPasswordInitialized = async (): Promise<boolean> =>
	(await readSetting(SETTING_SALT)) !== null;

/**
 * 初回設定。既に設定済みの場合は上書きしない。
 */
export const setupMasterPassword = async (
	masterPassword: string,
): Promise<void> => {
	if (await isMasterPasswordInitialized()) {
		throw new Error("マスターパスワードは設定済みです");
	}

	const salt = createSalt();
	const key = await deriveMasterKey(masterPassword, salt);
	const verifier = await encryptWithKey(key, VERIFIER_PLAINTEXT);

	const prisma = getPrisma();
	await prisma.$transaction([
		prisma.appSetting.upsert(upsertSetting(SETTING_SALT, salt)),
		prisma.appSetting.upsert(upsertSetting(SETTING_VERIFIER, verifier.value)),
		prisma.appSetting.upsert(upsertSetting(SETTING_VERIFIER_IV, verifier.iv)),
	]);

	unlockedKey = key;
};

/**
 * 解錠。パスワードが違えば false を返す（例外にはしない）。
 */
export const unlock = async (masterPassword: string): Promise<boolean> => {
	const salt = await readSetting(SETTING_SALT);
	const verifierValue = await readSetting(SETTING_VERIFIER);
	const verifierIv = await readSetting(SETTING_VERIFIER_IV);

	if (!salt || !verifierValue || !verifierIv) {
		throw new Error("マスターパスワードが設定されていません");
	}

	const key = await deriveMasterKey(masterPassword, salt);
	try {
		await decryptWithKey(key, { value: verifierValue, iv: verifierIv });
	} catch {
		return false;
	}

	unlockedKey = key;
	return true;
};

export const lock = (): void => {
	unlockedKey = null;
};

/**
 * パスワード変更。
 * 全ターゲットを旧鍵で復号し、新鍵で暗号化し直してから設定を差し替える。
 * 途中で失敗しても中途半端な状態にならないよう、更新は 1 トランザクションにまとめる。
 */
export const changeMasterPassword = async (
	currentPassword: string,
	newPassword: string,
): Promise<void> => {
	if (!(await unlock(currentPassword))) {
		throw new Error("現在のマスターパスワードが正しくありません");
	}

	const oldKey = requireUnlockedKey();
	const salt = createSalt();
	const newKey = await deriveMasterKey(newPassword, salt);
	const verifier = await encryptWithKey(newKey, VERIFIER_PLAINTEXT);

	const prisma = getPrisma();
	const targets = await prisma.apiTarget.findMany({
		where: { NOT: { encryptedValue: null } },
	});

	const updates = [];
	for (const target of targets) {
		if (!target.encryptedValue || !target.iv) continue;

		const plain = await decryptWithKey(oldKey, {
			value: target.encryptedValue,
			iv: target.iv,
		});
		const reEncrypted = await encryptWithKey(newKey, plain);

		updates.push(
			prisma.apiTarget.update({
				where: { id: target.id },
				data: { encryptedValue: reEncrypted.value, iv: reEncrypted.iv },
			}),
		);
	}

	await prisma.$transaction([
		...updates,
		prisma.appSetting.upsert(upsertSetting(SETTING_SALT, salt)),
		prisma.appSetting.upsert(upsertSetting(SETTING_VERIFIER, verifier.value)),
		prisma.appSetting.upsert(upsertSetting(SETTING_VERIFIER_IV, verifier.iv)),
	]);

	unlockedKey = newKey;
};
