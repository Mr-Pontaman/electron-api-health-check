import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { vaultStatusQueryKey } from "../query-keys";
import { VaultScreenLayout } from "./vault-screen-layout";

export const UnlockScreen = () => {
	const [masterPassword, setMasterPassword] = useState("");
	const queryClient = useQueryClient();

	const unlockMutation = useMutation({
		mutationFn: async () => {
			const result = await window.api.unlockVault(masterPassword);
			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			setMasterPassword("");
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
		},
	});

	return (
		<VaultScreenLayout description="マスターパスワードを入力してください。">
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					if (!unlockMutation.isPending) {
						unlockMutation.mutate();
					}
				}}
			>
				<div className="space-y-2">
					<Label htmlFor="unlock-master-password" className="sr-only">
						マスターパスワード
					</Label>
					<Input
						id="unlock-master-password"
						type="password"
						autoComplete="current-password"
						autoFocus
						value={masterPassword}
						onChange={(event) => setMasterPassword(event.target.value)}
					/>
				</div>

				{unlockMutation.error && (
					<p className="font-medium text-destructive text-xs">
						{unlockMutation.error.message}
					</p>
				)}

				<Button
					type="submit"
					className="w-full"
					disabled={unlockMutation.isPending}
				>
					{unlockMutation.isPending ? "確認中..." : "解錠する"}
				</Button>
			</form>
		</VaultScreenLayout>
	);
};
