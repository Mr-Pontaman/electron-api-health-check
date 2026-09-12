import { z } from "zod";
import { AUTH_TYPE, HTTP_METHODS } from "./constants";

/**
 * http / https の URL であることだけを検証する。
 *
 * デスクトップアプリでは登録する URL はユーザー自身が入力するもので、
 * 第三者が URL を差し込む経路がない。そのため localhost やプライベート IP を
 * 禁止せず、ローカルの開発サーバも監視対象にできるようにしている。
 */
export const urlSchema = z.url().refine(
	(val) => {
		try {
			const parsed = new URL(val);
			return parsed.protocol === "http:" || parsed.protocol === "https:";
		} catch {
			return false;
		}
	},
	{ message: "http:// または https:// で始まるURLを入力してください" },
);

export const httpMethodSchema = z.enum(HTTP_METHODS);
export const authTypeSchema = z.enum(AUTH_TYPE);

export const nameSchema = z.string().min(1, "名前を入力してください");

export const credentialKeySchema = z
	.string()
	.min(1, "キー名を入力してください");

/**
 * 暗号文が漏れた場合、マスターパスワードの強度だけが総当たり耐性を決める。
 * PBKDF2 のコストを見込んでも 8 文字では弱いため 12 文字以上とする。
 */
export const masterPasswordSchema = z
	.string()
	.min(12, "マスターパスワードは12文字以上で設定してください");

/** バックアップ JSON の識別子と、このアプリが読める形式の版 */
export const VAULT_BACKUP_FORMAT = "ponta-ping-vault";
export const VAULT_BACKUP_SCHEMA_VERSION = 1;

/**
 * バックアップに含まれるターゲット1件。
 *
 * 登録時と違い、ここでは URL を http/https に限定しない。
 * バックアップは自分自身が書き出したものなので、検証を通すために
 * 過去のデータを弾いてしまうほうが害が大きい。
 */
export const vaultBackupTargetSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	url: z.string(),
	method: httpMethodSchema,
	authType: authTypeSchema,
	credentialKey: z.string().nullable(),
	encryptedValue: z.string().nullable(),
	iv: z.string().nullable(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

/**
 * バックアップ JSON の構造。
 *
 * format と schemaVersion はあえて緩く受ける。z.literal にすると
 * 「新しい版で作られたファイル」を弾いたときのメッセージが
 * フィールド名だけの不親切なものになるため、判定は呼び出し側で行う。
 */
export const vaultBackupSchema = z.object({
	format: z.string(),
	schemaVersion: z.number().int(),
	appVersion: z.string(),
	exportedAt: z.string().min(1),
	/** 書き出し時点で適用済みだったマイグレーション名 */
	migrations: z.array(z.string()),
	settings: z.object({
		"vault.salt": z.string().min(1),
		"vault.verifier": z.string().min(1),
		"vault.verifierIv": z.string().min(1),
	}),
	targets: z.array(vaultBackupTargetSchema),
});

export type VaultBackup = z.infer<typeof vaultBackupSchema>;

export const createApiTargetSchema = z.object({
	name: nameSchema,
	url: urlSchema,
	method: httpMethodSchema,
	authType: authTypeSchema,
	credentialKey: credentialKeySchema.nullable(),
	plainCredential: z.string().nullable(),
});

export const updateApiTargetSchema = createApiTargetSchema.extend({
	id: z.string().min(1),
});

export const pingInputSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("target"),
		targetId: z.string().min(1),
	}),
	z.object({
		kind: z.literal("adhoc"),
		url: urlSchema,
		method: httpMethodSchema,
		authType: authTypeSchema,
		credentialKey: z.string().nullable(),
		plainCredential: z.string().nullable(),
	}),
]);

/** TanStack Form の validator に渡すためのエラーメッセージ変換 */
export const validateWith = <T>(schema: z.ZodType<T>) => {
	return ({ value }: { value: unknown }): string | undefined => {
		const result = schema.safeParse(value);
		if (!result.success) {
			return result.error.issues[0]?.message;
		}
		return undefined;
	};
};
