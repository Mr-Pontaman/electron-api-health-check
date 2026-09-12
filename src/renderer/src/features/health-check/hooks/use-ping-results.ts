import { skipToken, useQueries } from "@tanstack/react-query";
import { pingResultQueryKey } from "../query-keys";

/**
 * 複数ターゲットの Ping 結果キャッシュをまとめて購読する。
 * 各クエリは skipToken で fetch せず、setQueryData による書き込みだけを購読する。
 */
export const usePingResults = (apiIds: string[]) =>
	useQueries({
		queries: apiIds.map((apiId) => ({
			queryKey: pingResultQueryKey(apiId),
			queryFn: skipToken,
		})),
	});
