import { usePingResults } from "@renderer/features/health-check/hooks/use-ping-results";
import { cn } from "@renderer/lib/utils";
import type { ApiTargetDto, PingResult } from "@shared/types";
import { Activity, AlertCircle, CheckCircle2, Server } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
	apiTargets: ApiTargetDto[];
};

const TONES = {
	default: "bg-muted/60",
	success: "bg-emerald-500/10 text-emerald-600",
	error: "bg-destructive/10 text-destructive",
	info: "bg-blue-500/10 text-blue-600",
} as const;

const ICON_TONES = {
	default: "bg-primary/10 text-primary",
	success: "bg-emerald-500/20",
	error: "bg-destructive/20",
	info: "bg-blue-500/20",
} as const;

type StatCardProps = {
	icon: ReactNode;
	label: string;
	value: string;
	tone: keyof typeof TONES;
};

const StatCard = ({ icon, label, value, tone }: StatCardProps) => {
	return (
		<div
			className={cn(
				"flex items-center space-x-1.5 rounded-lg p-3 sm:space-x-3",
				TONES[tone],
			)}
		>
			<div className={cn("shrink-0 rounded-md p-2", ICON_TONES[tone])}>
				{icon}
			</div>
			<div>
				<p className="font-medium text-muted-foreground text-xs">{label}</p>
				<p className="font-bold text-xl tracking-tight sm:text-2xl">{value}</p>
			</div>
		</div>
	);
};

export const PingStatsOverview = ({ apiTargets }: Props) => {
	// 各 API の Ping キャッシュをまとめて購読（自動 fetch は行わない）
	const pingResults = usePingResults(apiTargets.map((api) => api.id));

	const total = apiTargets.length;

	// キャッシュが存在する（＝1回以上 Ping 実行された）データを抽出
	const executedPings = pingResults
		.map((q) => q.data)
		.filter((data): data is PingResult => data !== undefined);

	const successCount = executedPings.filter((res) => res.ok).length;
	const errorCount = executedPings.filter((res) => !res.ok).length;

	// 正常レスポンスの平均応答時間を計算
	const successPings = executedPings.filter(
		(res) => res.ok && res.responseTimeMs > 0,
	);
	const avgResponseTime =
		successPings.length > 0
			? Math.round(
					successPings.reduce((acc, cur) => acc + cur.responseTimeMs, 0) /
						successPings.length,
				)
			: 0;

	// 成功率 (Health Rate)
	const healthRate =
		executedPings.length > 0
			? Math.round((successCount / executedPings.length) * 100)
			: 100;

	return (
		<div className="space-y-4 p-4 sm:p-6">
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<StatCard
					icon={<Server className="h-5 w-5" />}
					label="総ターゲット"
					value={String(total)}
					tone="default"
				/>
				<StatCard
					icon={<CheckCircle2 className="h-5 w-5" />}
					label="正常"
					value={String(successCount)}
					tone="success"
				/>
				<StatCard
					icon={<AlertCircle className="h-5 w-5" />}
					label="エラー"
					value={String(errorCount)}
					tone="error"
				/>
				<StatCard
					icon={<Activity className="h-5 w-5" />}
					label="平均応答"
					value={executedPings.length > 0 ? `${avgResponseTime}ms` : "-"}
					tone="info"
				/>
			</div>

			{executedPings.length > 0 && (
				<div className="flex flex-col items-start justify-between gap-2 border-t pt-2 text-muted-foreground text-xs sm:flex-row sm:items-center">
					<div className="flex w-full items-center gap-2 sm:w-64">
						<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full bg-emerald-500 transition-all duration-300"
								style={{ width: `${healthRate}%` }}
							/>
							<div
								className="h-full bg-destructive transition-all duration-300"
								style={{ width: `${100 - healthRate}%` }}
							/>
						</div>
						<span className="shrink-0 font-mono font-semibold">
							{healthRate}%
						</span>
					</div>
					<span>
						実行済み: {executedPings.length} / {total}
					</span>
				</div>
			)}
		</div>
	);
};
