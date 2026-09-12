import type { PingResult } from "@shared/types";
import { skipToken, useQuery } from "@tanstack/react-query";
import { pingResultQueryKey } from "../query-keys";

/**
 * 手動実行した Ping の結果キャッシュを購読する。
 *
 * 実行は useMutation が担い、その結果が setQueryData でこのクエリキーに
 * 書き込まれる。skipToken によりこのクエリ自身は fetch しない。
 */
export const usePingResult = (apiId: string) =>
	useQuery<PingResult>({
		queryKey: pingResultQueryKey(apiId),
		queryFn: skipToken,
	});
