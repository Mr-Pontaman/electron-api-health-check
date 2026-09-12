import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@renderer/components/ui/dialog";
import { RestoreVaultPanel } from "./restore-vault-panel";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * すでにデータがある状態でバックアップから復元する（全置換）。
 * 何もない初回起動時はセットアップ画面に埋め込んだ RestoreVaultPanel を使う。
 */
export const RestoreVaultDialog = ({ open, onOpenChange }: Props) => (
	<Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>バックアップから復元</DialogTitle>
				<DialogDescription>
					書き出しておいたバックアップファイルを読み込みます。
				</DialogDescription>
			</DialogHeader>

			<RestoreVaultPanel
				overwrite
				onCancel={() => onOpenChange(false)}
				onRestored={() => onOpenChange(false)}
			/>
		</DialogContent>
	</Dialog>
);
