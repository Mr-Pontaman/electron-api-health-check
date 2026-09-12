import { urlSchema } from "@shared/validation";

const MAX_REDIRECTS = 5;

export type SafeFetchResult =
	| { ok: true; response: Response; finalUrl: string }
	| { ok: false; error: string };

/**
 * リダイレクトを自動追跡せず、各ホップの URL を検証しながら追跡する fetch。
 *
 * redirect: "follow"（デフォルト）だと、途中のリダイレクト先が何であっても
 * そのまま辿ってしまう。Node の fetch は redirect: "manual" で 3xx と
 * Location ヘッダをそのまま返すため、1 ホップずつ確認できる。
 */
export const safeFetch = async (
	url: string,
	init: { method?: string; headers?: HeadersInit } = {},
): Promise<SafeFetchResult> => {
	let currentUrl = url;
	let method = (init.method ?? "GET").toUpperCase();

	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		const response = await fetch(currentUrl, {
			method,
			headers: init.headers,
			redirect: "manual",
		});

		if (response.status < 300 || response.status >= 400) {
			return { ok: true, response, finalUrl: currentUrl };
		}

		const location = response.headers.get("location");
		if (!location) {
			return { ok: true, response, finalUrl: currentUrl };
		}

		let nextUrl: string;
		try {
			nextUrl = new URL(location, currentUrl).toString();
		} catch {
			return { ok: false, error: "リダイレクト先のURLを解釈できませんでした" };
		}

		if (!urlSchema.safeParse(nextUrl).success) {
			return {
				ok: false,
				error: "リダイレクト先が http/https 以外のため追跡を中断しました",
			};
		}

		// Fetch 仕様: 303、および 301/302 の POST は GET に切り替わる
		if (
			response.status === 303 ||
			((response.status === 301 || response.status === 302) &&
				method === "POST")
		) {
			method = "GET";
		}

		currentUrl = nextUrl;
	}

	return {
		ok: false,
		error: `リダイレクトが上限（${MAX_REDIRECTS}回）を超えました`,
	};
};
