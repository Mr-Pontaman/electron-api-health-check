import { Badge } from "@renderer/components/ui/badge";
import { ResponseBodyPreview } from "@renderer/features/health-check/components/response-body-preview";
import type { PingResult } from "@shared/types";

export const PingResultView = ({ result }: { result: PingResult }) => {
	return (
		<div className="space-y-3 rounded-lg border bg-muted/50 p-4 font-mono text-xs">
			<div className="flex items-center justify-between">
				<span className="font-bold text-sm">実行結果</span>
				<Badge
					className={
						result.ok
							? "bg-green-600 font-semibold text-white"
							: "bg-red-600 font-semibold text-white"
					}
				>
					{result.status > 0
						? `${result.status} ${result.statusText}`
						: "ERROR"}
				</Badge>
			</div>

			<div className="flex justify-between text-[11px] text-muted-foreground">
				<p>
					応答時間:{" "}
					<span className="font-bold text-foreground">
						{result.responseTimeMs} ms
					</span>
				</p>
				{result.contentType && (
					<p className="max-w-55 truncate" title={result.contentType}>
						Type: {result.contentType.split(";")[0]}
					</p>
				)}
			</div>

			{result.error && (
				<p className="font-semibold text-destructive">{result.error}</p>
			)}

			{result.body && <ResponseBodyPreview body={result.body} />}
		</div>
	);
};
