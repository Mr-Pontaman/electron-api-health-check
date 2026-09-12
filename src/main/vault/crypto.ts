const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** OWASP 推奨の計算コスト */
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptedValue = {
	value: string;
	iv: string;
};

export const createSalt = (): string =>
	Buffer.from(crypto.getRandomValues(new Uint8Array(SALT_BYTES))).toString(
		"base64",
	);

/**
 * マスターパスワードから AES-GCM 用の鍵を導出する。
 * PBKDF2 は 1 回あたり数百ミリ秒かかるため、解錠時に一度だけ実行して
 * 得られた鍵をメモリ上に保持する（レコードごとに導出し直さない）。
 */
export const deriveMasterKey = async (
	masterPassword: string,
	saltBase64: string,
): Promise<CryptoKey> => {
	const baseKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(masterPassword),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: Buffer.from(saltBase64, "base64"),
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		baseKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
};

export const encryptWithKey = async (
	key: CryptoKey,
	plainText: string,
): Promise<EncryptedValue> => {
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoder.encode(plainText),
	);

	return {
		value: Buffer.from(encrypted).toString("base64"),
		iv: Buffer.from(iv).toString("base64"),
	};
};

export const decryptWithKey = async (
	key: CryptoKey,
	encrypted: EncryptedValue,
): Promise<string> => {
	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: Buffer.from(encrypted.iv, "base64") },
		key,
		Buffer.from(encrypted.value, "base64"),
	);

	return decoder.decode(decrypted);
};
