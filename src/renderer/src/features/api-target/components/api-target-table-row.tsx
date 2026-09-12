import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { TableCell, TableRow } from "@renderer/components/ui/table";
import { usePingResult } from "@renderer/features/health-check/hooks/use-ping-result";
import { pingResultQueryKey } from "@renderer/features/health-check/query-keys";
import { cn } from "@renderer/lib/utils";
import type { ApiTargetDto, PingResult } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiTargetsQueryKey } from "../query-keys";
import { ApiRowDetail } from "./api-row-detail";

type Props = {
	api: ApiTargetDto;
};

const PingStatusBadge = ({ result }: { result: PingResult | undefined }) => {
	if (!result) {
		return (
			<span className="pl-1 font-sans text-muted-foreground text-xs">
				未実行
			</span>
		);
	}

	return (
		<Badge
			className={cn(
				"px-2 py-0.5 font-semibold text-[10px]",
				result.ok
					? "border-emerald-600/30 bg-emerald-600/15 text-emerald-600"
					: "border-destructive/30 bg-destructive/15 text-destructive",
			)}
			variant="outline"
		>
			{result.status > 0 ? `${result.status} ${result.statusText}` : "ERROR"}
		</Badge>
	);
};

export const ApiTargetTableRow = ({ api }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data: result } = usePingResult(api.id);

	// 資格情報の復号は main 側で行うため、レンダラーは ID を渡すだけでよい
	const pingMutation = useMutation({
		mutationFn: async (): Promise<PingResult> => {
			const res = await window.api.ping({ kind: "target", targetId: api.id });
			queryClient.setQueryData(pingResultQueryKey(api.id), res);
			return res;
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const res = await window.api.deleteApiTarget(api.id);
			if (!res.ok) {
				throw new Error(res.error);
			}
		},
		onSuccess: async () => {
			toast.success(`「${api.name}」を削除しました`);
			queryClient.removeQueries({ queryKey: pingResultQueryKey(api.id) });
			await queryClient.invalidateQueries({ queryKey: apiTargetsQueryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || "削除に失敗しました");
		},
	});

	return (
		<>
			<TableRow className="transition-colors hover:bg-muted/40">
				<TableCell className="w-28 font-mono">
					<PingStatusBadge result={result} />
				</TableCell>

				<TableCell className="max-w-[220px] sm:max-w-xs">
					<div className="flex flex-col truncate">
						<span className="truncate font-semibold text-foreground text-sm">
							{api.name}
						</span>
						<span className="truncate font-mono text-muted-foreground text-xs">
							{api.url}
						</span>
					</div>
				</TableCell>

				<TableCell className="w-20">
					<Badge variant="outline" className="font-mono text-[10px] uppercase">
						{api.method}
					</Badge>
				</TableCell>

				<TableCell className="w-24 font-mono text-xs sm:text-left">
					{result ? (
						<span className="font-semibold">{result.responseTimeMs} ms</span>
					) : (
						<span className="text-muted-foreground">-</span>
					)}
				</TableCell>

				<TableCell className="w-28 text-right">
					<Button
						size="sm"
						variant="outline"
						className="h-8 gap-1.5 px-3 text-xs shadow shadow-accent"
						onClick={() => pingMutation.mutate()}
						disabled={pingMutation.isPending}
					>
						<Zap className="size-3.5 text-amber-500" />
						{pingMutation.isPending ? "実行中" : "Ping"}
					</Button>
				</TableCell>

				<TableCell className="w-12 text-right">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => setIsOpen(!isOpen)}
					>
						<ChevronDown
							className={cn(
								"h-4 w-4 text-muted-foreground transition-transform duration-200",
								isOpen && "rotate-180",
							)}
						/>
						<span className="sr-only">詳細を切り替え</span>
					</Button>
				</TableCell>
			</TableRow>

			{isOpen && (
				<TableRow className="border-b bg-muted/20 hover:bg-muted/20">
					<TableCell colSpan={6} className="p-4">
						<ApiRowDetail
							api={api}
							result={result}
							pingError={pingMutation.error}
							onDelete={deleteMutation.mutate}
							isDeleting={deleteMutation.isPending}
							isEditDialogOpen={isEditDialogOpen}
							onEditDialogOpenChange={setIsEditDialogOpen}
						/>
					</TableCell>
				</TableRow>
			)}
		</>
	);
};
