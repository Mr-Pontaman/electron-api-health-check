import { CollapsibleFormPanel } from "@renderer/components/form/collapsible-form-panel";
import { Button } from "@renderer/components/ui/button";
import { pingResultQueryKey } from "@renderer/features/health-check/query-keys";
import type { ApiTargetDto } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChartNoAxesCombined, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiTargetTable } from "./api-target-table";
import { PingStatsOverview } from "./ping-stats-overview";

type Props = {
	apiTargets: ApiTargetDto[];
};

export const ApiTargetList = ({ apiTargets }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const queryClient = useQueryClient();

	const batchPingMutation = useMutation({
		mutationFn: async () => {
			await Promise.allSettled(
				apiTargets.map(async (api) => {
					try {
						const result = await window.api.ping({
							kind: "target",
							targetId: api.id,
						});
						queryClient.setQueryData(pingResultQueryKey(api.id), result);
					} catch (error) {
						queryClient.setQueryData(pingResultQueryKey(api.id), {
							ok: false,
							status: 0,
							statusText: "ERROR",
							responseTimeMs: 0,
							error:
								error instanceof Error ? error.message : "実行に失敗しました",
						});
					}
				}),
			);
		},
		onMutate: () => {
			toast.info("全ターゲットへの一括Ping送信を開始しました...");
		},
		onSuccess: () => {
			toast.success("全ターゲットの一括Ping送信が完了しました");
		},
	});

	if (apiTargets.length === 0) {
		return (
			<div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
				アイテムがありません。
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<CollapsibleFormPanel
				icon={<ChartNoAxesCombined className="size-5 text-primary" />}
				title="Ping結果"
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				<PingStatsOverview apiTargets={apiTargets} />
				<div className="flex justify-end">
					<Button
						type="button"
						onClick={() => batchPingMutation.mutate()}
						disabled={batchPingMutation.isPending}
						className="w-full gap-2 sm:w-auto"
					>
						<Zap className="size-4 text-amber-600" />
						{batchPingMutation.isPending
							? "一括送信中..."
							: "全ターゲット一括Ping実行"}
					</Button>
				</div>
			</CollapsibleFormPanel>
			<ApiTargetTable apiTargets={apiTargets} />
		</div>
	);
};
