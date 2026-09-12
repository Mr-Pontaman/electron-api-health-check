import { AUTH_TYPE, type AuthType } from "@shared/constants";

/**
 * credentialKey はヘッダー名にもクエリパラメータ名にもなるため、
 * 認証タイプに応じてラベルと入力例を出し分ける。
 */
export const getCredentialKeyLabel = (authType: AuthType): string =>
	authType === AUTH_TYPE.QUERY ? "クエリパラメータ名" : "ヘッダーキー名";

export const getCredentialKeyPlaceholder = (authType: AuthType): string => {
	switch (authType) {
		case AUTH_TYPE.API_KEY:
			return "x-api-key";
		case AUTH_TYPE.QUERY:
			return "apikey";
		default:
			return "X-Custom-Header";
	}
};

/** 認証タイプごとの既定のキー名 */
export const getDefaultCredentialKey = (authType: AuthType): string => {
	switch (authType) {
		case AUTH_TYPE.API_KEY:
			return "x-api-key";
		case AUTH_TYPE.QUERY:
			return "apikey";
		default:
			return "";
	}
};
