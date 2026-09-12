import { getPrisma } from "../db/client";

export const SETTING_SALT = "vault.salt";
export const SETTING_VERIFIER = "vault.verifier";
export const SETTING_VERIFIER_IV = "vault.verifierIv";

/**
 * マスターパスワードに関わる設定キー。
 * 初期化のときは app_setting 全体ではなくこれだけを消す。
 * 将来ほかの設定を app_setting に足したときに巻き込まないため。
 */
export const VAULT_SETTING_KEYS = [
	SETTING_SALT,
	SETTING_VERIFIER,
	SETTING_VERIFIER_IV,
] as const;

/**
 * 解錠の判定に使う既知の文字列。
 * これを暗号化して保存しておき、復号できればパスワードが正しいと判断する。
 */
export const VERIFIER_PLAINTEXT = "ponta-ping-vault-verifier-v1";

export const readSetting = async (key: string): Promise<string | null> => {
	const row = await getPrisma().appSetting.findUnique({ where: { key } });
	return row?.value ?? null;
};

export const upsertSetting = (key: string, value: string) => ({
	where: { key },
	create: { key, value },
	update: { value },
});
