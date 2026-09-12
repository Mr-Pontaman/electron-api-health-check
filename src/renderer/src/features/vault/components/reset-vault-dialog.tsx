import { Button } from "@renderer/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@renderer/components/ui/dialog";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import { apiTargetsQueryKey } from "@renderer/features/api-target/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { vaultStatusQueryKey } from "../query-keys";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * 初期化。登録済みのターゲットとマスターパスワードの設定を消して、
 * 初回起動と同じ状態に戻す。テーマなどの UI 設定は残す。
 *
 * 取り消せないので、誤操作を防ぐためにマスターパスワードの再入力を求める。
 */
export const ResetVaultDialog = ({ open, onOpenChange }: Props) => {
	const [masterPassword, setMasterPassword] = useState("");
	const queryClient = useQueryClient();

	const resetMutation = useMutation({
		mutationFn: async () => {
			const result = await window.api.resetVault(masterPassword);
			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			toast.success("初期化しました");
			setMasterPassword("");
			onOpenChange(false);
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
			await queryClient.invalidateQueries({ queryKey: apiTargetsQueryKey });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>初期化</DialogTitle>
					<DialogDescription>
						登録済みのターゲットとマスターパスワードの設定を消します。
					</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (!resetMutation.isPending) {
							resetMutation.mutate();
						}
					}}
				>
					<div className="flex gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-muted-foreground text-xs">
						<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
						<p>
							元に戻せません。必要なら先にバックアップを書き出してください。
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="reset-master-password">マスターパスワード</Label>
						<Input
							id="reset-master-password"
							type="password"
							autoComplete="current-password"
							value={masterPassword}
							onChange={(event) => setMasterPassword(event.target.value)}
						/>
					</div>

					{resetMutation.error && (
						<p className="font-medium text-destructive text-xs">
							{resetMutation.error.message}
						</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							キャンセル
						</Button>
						<Button
							type="submit"
							variant="destructive"
							disabled={resetMutation.isPending}
						>
							{resetMutation.isPending ? "初期化中..." : "初期化する"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
