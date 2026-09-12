import { DashboardPage } from "@renderer/features/dashboard/components/dashboard-page";
import { SetupMasterPasswordScreen } from "@renderer/features/vault/components/setup-master-password-screen";
import { UnlockScreen } from "@renderer/features/vault/components/unlock-screen";
import { vaultStatusQueryKey } from "@renderer/features/vault/query-keys";
import { useQuery } from "@tanstack/react-query";

export const App = () => {
	const { data: vaultStatus, isPending } = useQuery({
		queryKey: vaultStatusQueryKey,
		queryFn: () => window.api.getVaultStatus(),
	});

	if (isPending || !vaultStatus) {
		return (
			<div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
				読み込み中...
			</div>
		);
	}

	if (!vaultStatus.initialized) {
		return <SetupMasterPasswordScreen />;
	}

	if (!vaultStatus.unlocked) {
		return <UnlockScreen />;
	}

	return <DashboardPage />;
};
