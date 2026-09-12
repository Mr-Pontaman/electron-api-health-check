import { Button } from "@renderer/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { vaultStatusQueryKey } from "../query-keys";
import { ChangeMasterPasswordDialog } from "./change-master-password-dialog";

/** マスターパスワードの変更と、アプリのロック */
export const VaultMenu = () => {
	const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const lockMutation = useMutation({
		mutationFn: () => window.api.lockVault(),
		onSuccess: async () => {
			toast.success("ロックしました");
			await queryClient.invalidateQueries({ queryKey: vaultStatusQueryKey });
		},
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
				</DropdownMenuContent>
			</DropdownMenu>

			<ChangeMasterPasswordDialog
				open={isChangeDialogOpen}
				onOpenChange={setIsChangeDialogOpen}
			/>
		</>
	);
};
