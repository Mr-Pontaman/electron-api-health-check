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
import { masterPasswordSchema } from "@shared/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { vaultStatusQueryKey } from "../query-keys";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * マスターパスワードの変更。
 * 全ターゲットを新しく暗号化し直すため、失敗した場合は何も変わらない。
 */
export const ChangeMasterPasswordDialog = ({ open, onOpenChange }: Props) => {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const queryClient = useQueryClient();

	const changeMutation = useMutation({
		mutationFn: async () => {
			const parsed = masterPasswordSchema.safeParse(newPassword);
			if (!parsed.success) {
				throw new Error(parsed.error.issues[0]?.message ?? "入力が不正です");
			}
			if (newPassword !== confirmation) {
				throw new Error("確認用のパスワードが一致しません");
			}

			const result = await window.api.changeMasterPassword(
				currentPassword,
				newPassword,
			);
			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			toast.success("マスターパスワードを変更しました");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmation("");
			onOpenChange(false);
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
			await queryClient.invalidateQueries({ queryKey: apiTargetsQueryKey });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>マスターパスワードの変更</DialogTitle>
					<DialogDescription>
						登録済みの API キーは新しいパスワードで暗号化し直されます。
					</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (!changeMutation.isPending) {
							changeMutation.mutate();
						}
					}}
				>
					<div className="space-y-2">
						<Label htmlFor="current-master-password">現在のパスワード</Label>
						<Input
							id="current-master-password"
							type="password"
							autoComplete="current-password"
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="new-master-password">新しいパスワード</Label>
						<Input
							id="new-master-password"
							type="password"
							autoComplete="new-password"
							value={newPassword}
							onChange={(event) => setNewPassword(event.target.value)}
						/>
						<p className="text-muted-foreground text-xs">12文字以上</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="new-master-password-confirmation">
							確認のためもう一度
						</Label>
						<Input
							id="new-master-password-confirmation"
							type="password"
							autoComplete="new-password"
							value={confirmation}
							onChange={(event) => setConfirmation(event.target.value)}
						/>
					</div>

					{changeMutation.error && (
						<p className="font-medium text-destructive text-xs">
							{changeMutation.error.message}
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
						<Button type="submit" disabled={changeMutation.isPending}>
							{changeMutation.isPending ? "変更中..." : "変更する"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
