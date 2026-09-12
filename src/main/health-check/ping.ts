import { AUTH_TYPE } from "@shared/constants";
import type { PingRequest, PingResult } from "@shared/types";
import { safeFetch } from "./safe-fetch";

/** 一括 Ping で同時に飛ばす最大本数。相手先サーバとこの端末の両方を守るため。 */
const MAX_CONCURRENT_REQUESTS = 6;

let activeRequests = 0;
const waiting: (() => void)[] = [];

const acquireSlot = async (): Promise<void> => {
	if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
		await new Promise<void>((resolve) => waiting.push(resolve));
	}
	activeRequests += 1;
};

const releaseSlot = (): void => {
	activeRequests -= 1;
	waiting.shift()?.();
};

/**
 * QUERY のときは URL にクエリパラメータとして資格情報を付与する。
 * 保存している URL 自体にはキーを含めない。
 */
const buildRequestUrl = (input: PingRequest): string => {
	if (
		input.authType !== AUTH_TYPE.QUERY ||
		!input.credentialKey ||
		!input.plainCredential
	) {
		return input.url;
	}

	const url = new URL(input.url);
	url.searchParams.set(input.credentialKey, input.plainCredential);
	return url.toString();
};

const buildRequestHeaders = (input: PingRequest): Record<string, string> => {
	const headers: Record<string, string> = { "User-Agent": "PontaPing/1.0" };
	const { credentialKey, plainCredential, authType } = input;

	if (authType === AUTH_TYPE.NONE || !plainCredential) {
		return headers;
	}

	if (authType === AUTH_TYPE.API_KEY) {
		headers[credentialKey || "x-api-key"] = plainCredential;
	} else if (authType === AUTH_TYPE.BEARER) {
		headers.Authorization = `Bearer ${plainCredential}`;
	} else if (authType === AUTH_TYPE.CUSTOM && credentialKey) {
		headers[credentialKey] = plainCredential;
	}

	return headers;
};

/**
 * 1 件のヘルスチェックを実行する。
 * 渡された資格情報はリクエストに載せるだけで、どこにも保存しない。
 */
export const ping = async (input: PingRequest): Promise<PingResult> => {
	await acquireSlot();
	const startTime = performance.now();

	try {
		const result = await safeFetch(buildRequestUrl(input), {
			method: input.method,
			headers: buildRequestHeaders(input),
		});

		if (!result.ok) {
			return {
				ok: false,
				status: 0,
				statusText: "REDIRECT_BLOCKED",
				responseTimeMs: Math.round(performance.now() - startTime),
				error: result.error,
			};
		}

		const response = result.response;
		const body = await response.text();

		return {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			responseTimeMs: Math.round(performance.now() - startTime),
			contentType: response.headers.get("content-type") ?? "",
			body,
		};
	} catch (error) {
		return {
			ok: false,
			status: 0,
			statusText: "FETCH_ERROR",
			responseTimeMs: Math.round(performance.now() - startTime),
			error:
				error instanceof Error ? error.message : "リクエストに失敗しました",
		};
	} finally {
		releaseSlot();
	}
};
