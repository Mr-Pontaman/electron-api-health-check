import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import { apiTargetsQueryKey } from "@renderer/features/api-target/query-keys";
import type { VaultBackupSummary } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { vaultStatusQueryKey } from "../query-keys";

type Props = {
	/** 既存のデータを置き換える場合に警告を出す */
	overwrite?: boolean;
	onCancel?: () => void;
	onRestored?: () => void;
};

/**
 * バックアップからの復元。
 *
 * ここで入力するのは「新しいパスワード」ではなく、バックアップを作った
 * 時点で使っていたパスワード。暗号鍵はバックアップに同梱された salt から
 * 導出されるので、別のパスワードでは復号できない。
 */
export const RestoreVaultPanel = ({
	overwrite = false,
	onCancel,
	onRestored,
}: Props) => {
	const [masterPassword, setMasterPassword] = useState("");
	const [summary, setSummary] = useState<VaultBackupSummary | null>(null);
	const queryClient = useQueryClient();

	const selectMutation = useMutation({
		mutationFn: async () => {
			const result = await window.api.selectVaultBackup();
			if (!result.ok) {
				throw new Error(result.error);
			}
			return result.data;
		},
		onSuccess: (data) => {
			// null はファイル選択のキャンセル
			if (data) {
				setSummary(data);
			}
		},
	});

	const restoreMutation = useMutation({
		mutationFn: async () => {
			const result = await window.api.restoreVault(masterPassword);
			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			toast.success("バックアップから復元しました");
			setMasterPassword("");
			setSummary(null);
			onRestored?.();
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
			await queryClient.invalidateQueries({ queryKey: apiTargetsQueryKey });
		},
	});

	if (!summary) {
		return (
			<div className="space-y-5">
				{overwrite && (
					<div className="flex gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-muted-foreground text-xs">
						<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
						<p>いま登録されている内容はすべて置き換わります。</p>
					</div>
				)}

				<Button
					type="button"
					variant="outline"
					className="w-full"
					disabled={selectMutation.isPending}
					onClick={() => selectMutation.mutate()}
				>
					<FileUp className="h-4 w-4" />
					{selectMutation.isPending
						? "読み込み中..."
						: "バックアップファイルを選択"}
				</Button>

				{selectMutation.error && (
					<p className="font-medium text-destructive text-xs">
						{selectMutation.error.message}
					</p>
				)}

				{onCancel && (
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						onClick={onCancel}
					>
						戻る
					</Button>
				)}
			</div>
		);
	}

	return (
		<form
			className="space-y-5"
			onSubmit={(event) => {
				event.preventDefault();
				if (!restoreMutation.isPending) {
					restoreMutation.mutate();
				}
			}}
		>
			<div className="space-y-1 rounded-md border bg-muted/40 p-3 text-xs">
				<p className="font-medium">選択したバックアップ</p>
				<p className="text-muted-foreground">
					書き出し日時: {new Date(summary.exportedAt).toLocaleString()}
				</p>
				<p className="text-muted-foreground">
					アプリのバージョン: {summary.appVersion}
				</p>
				<p className="text-muted-foreground">
					登録件数: {summary.targetCount}件
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="restore-master-password">
					バックアップを作成したときのパスワード
				</Label>
				<Input
					id="restore-master-password"
					type="password"
					autoComplete="current-password"
					value={masterPassword}
					onChange={(event) => setMasterPassword(event.target.value)}
				/>
				<p className="text-muted-foreground text-xs">
					新しく決めるパスワードではありません。
				</p>
			</div>

			{restoreMutation.error && (
				<p className="font-medium text-destructive text-xs">
					{restoreMutation.error.message}
				</p>
			)}

			<div className="space-y-2">
				<Button
					type="submit"
					className="w-full"
					disabled={restoreMutation.isPending}
				>
					{restoreMutation.isPending ? "復元中..." : "復元する"}
				</Button>
				<Button
					type="button"
					variant="ghost"
					className="w-full"
					disabled={restoreMutation.isPending}
					onClick={() => {
						setSummary(null);
						setMasterPassword("");
						restoreMutation.reset();
					}}
				>
					別のファイルを選ぶ
				</Button>
			</div>
		</form>
	);
};
