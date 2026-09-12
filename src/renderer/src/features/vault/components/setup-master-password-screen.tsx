import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import { masterPasswordSchema } from "@shared/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useState } from "react";
import { vaultStatusQueryKey } from "../query-keys";
import { VaultScreenLayout } from "./vault-screen-layout";

/**
 * 初回起動時のマスターパスワード設定。
 * このパスワードから API キーの暗号鍵を導出するため、忘れると復旧できない。
 */
export const SetupMasterPasswordScreen = () => {
	const [masterPassword, setMasterPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const queryClient = useQueryClient();

	const setupMutation = useMutation({
		mutationFn: async () => {
			const parsed = masterPasswordSchema.safeParse(masterPassword);
			if (!parsed.success) {
				throw new Error(parsed.error.issues[0]?.message ?? "入力が不正です");
			}
			if (masterPassword !== confirmation) {
				throw new Error("確認用のパスワードが一致しません");
			}

			const result = await window.api.setupVault(masterPassword);
			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
		},
	});

	return (
		<VaultScreenLayout
			title="マスターパスワードの設定"
			description="API キーの暗号化に使うパスワードを決めてください。"
		>
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					if (!setupMutation.isPending) {
						setupMutation.mutate();
					}
				}}
			>
				<div className="flex gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-muted-foreground text-xs">
					<Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
					<p>
						このパスワードは保存されません。忘れると登録済みの API
						キーを復号できなくなり、復旧する手段はありません。
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="setup-master-password">マスターパスワード</Label>
					<Input
						id="setup-master-password"
						type="password"
						autoComplete="new-password"
						value={masterPassword}
						onChange={(event) => setMasterPassword(event.target.value)}
					/>
					<p className="text-muted-foreground text-xs">12文字以上</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="setup-master-password-confirmation">
						確認のためもう一度
					</Label>
					<Input
						id="setup-master-password-confirmation"
						type="password"
						autoComplete="new-password"
						value={confirmation}
						onChange={(event) => setConfirmation(event.target.value)}
					/>
				</div>

				{setupMutation.error && (
					<p className="font-medium text-destructive text-xs">
						{setupMutation.error.message}
					</p>
				)}

				<Button
					type="submit"
					className="w-full"
					disabled={setupMutation.isPending}
				>
					{setupMutation.isPending ? "設定中..." : "設定して開始"}
				</Button>
			</form>
		</VaultScreenLayout>
	);
};
