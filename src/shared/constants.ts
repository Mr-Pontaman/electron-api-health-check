export const APP_NAME = "Ponta Ping";

export const AUTH_TYPE = {
	NONE: "NONE",
	/** x-api-key などのヘッダーで渡す */
	API_KEY: "API_KEY",
	/** Authorization: Bearer で渡す */
	BEARER: "BEARER",
	/** 任意のヘッダー名で渡す */
	CUSTOM: "CUSTOM",
	/** ?apikey=... のようなクエリパラメータで渡す */
	QUERY: "QUERY",
} as const;

export type AuthType = (typeof AUTH_TYPE)[keyof typeof AUTH_TYPE];

export const AUTH_TYPE_OPTIONS: { value: AuthType; label: string }[] = [
	{ value: AUTH_TYPE.NONE, label: "なし (NONE)" },
	{ value: AUTH_TYPE.API_KEY, label: "API Key (x-api-key)" },
	{ value: AUTH_TYPE.BEARER, label: "Bearer Token (Authorization)" },
	{ value: AUTH_TYPE.CUSTOM, label: "カスタムヘッダー" },
	{ value: AUTH_TYPE.QUERY, label: "クエリパラメータ" },
];

export const HTTP_METHODS = {
	GET: "GET",
	POST: "POST",
	PUT: "PUT",
	DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
