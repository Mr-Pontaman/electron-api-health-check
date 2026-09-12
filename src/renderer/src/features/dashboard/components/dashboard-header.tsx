import icon from "@renderer/assets/icon.png";
import { ThemeToggle } from "@renderer/components/theme-toggle";
import { HelpDialog } from "@renderer/features/help/components/help-dialog";
import { VaultMenu } from "@renderer/features/vault/components/vault-menu";

export const DashboardHeader = () => {
	return (
		<header className="flex items-center justify-between gap-4 border-b pb-2">
			<div className="flex items-center gap-2">
				<img src={icon} alt="" className="size-10" />
				{/* <div> */}
				{/* 	<h1 className="font-bold text-xl tracking-tight">{APP_NAME}</h1> */}
				{/* </div> */}
			</div>

			<div className="flex items-center gap-1">
				<HelpDialog />
				<ThemeToggle />
				<VaultMenu />
			</div>
		</header>
	);
};
