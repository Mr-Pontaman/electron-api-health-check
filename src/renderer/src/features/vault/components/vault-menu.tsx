import { Button } from "@renderer/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, KeyRound, Lock, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { vaultStatusQueryKey } from "../query-keys";
import { ChangeMasterPasswordDialog } from "./change-master-password-dialog";
import { ResetVaultDialog } from "./reset-vault-dialog";
import { RestoreVaultDialog } from "./restore-vault-dialog";

/** バックアップ、マスターパスワードの変更、アプリのロック、初期化 */
export const VaultMenu = () => {
	const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
	const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const lockMutation = useMutation({
		mutationFn: () => window.api.lockVault(),
		onSuccess: async () => {
			toast.success("ロックしました");
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
		},
	});

	const exportMutation = useMutation({
		mutationFn: async () => {
			const result = await window.api.exportVault();
			if (!result.ok) {
				throw new Error(result.error);
			}
			// null は保存先の選択をキャンセルした場合
			return result.data;
		},
		onSuccess: (data) => {
			if (data) {
				toast.success("バックアップを書き出しました");
			}
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-9 w-9">
						<KeyRound className="h-4 w-4" />
						<span className="sr-only">マスターパスワード</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						disabled={exportMutation.isPending}
						onSelect={() => exportMutation.mutate()}
					>
						<Download className="h-4 w-4" />
						JSONをエクスポート
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setIsRestoreDialogOpen(true)}>
						<Upload className="h-4 w-4" />
						JSONから復元
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem onSelect={() => setIsChangeDialogOpen(true)}>
						<KeyRound className="h-4 w-4" />
						マスターパスワードを変更
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => lockMutation.mutate()}
						disabled={lockMutation.isPending}
					>
						<Lock className="h-4 w-4" />
						ロックする
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setIsResetDialogOpen(true)}
					>
						<Trash2 className="h-4 w-4" />
						初期化
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ChangeMasterPasswordDialog
				open={isChangeDialogOpen}
				onOpenChange={setIsChangeDialogOpen}
			/>
			<RestoreVaultDialog
				open={isRestoreDialogOpen}
				onOpenChange={setIsRestoreDialogOpen}
			/>
			<ResetVaultDialog
				open={isResetDialogOpen}
				onOpenChange={setIsResetDialogOpen}
			/>
		</>
	);
};
