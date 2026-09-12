import { IPC_CHANNELS } from "@shared/ipc-channels";
import type { IpcResult, VaultBackupSummary } from "@shared/types";
import { masterPasswordSchema } from "@shared/validation";
import { ipcMain } from "electron";
import {
	exportVaultToFile,
	restoreVaultFromPending,
	selectVaultBackup,
} from "../vault/backup";
import { toErrorMessage } from "./error-message";

export const registerBackupHandlers = (): void => {
	ipcMain.handle(
		IPC_CHANNELS.EXPORT_VAULT,
		async (): Promise<IpcResult<{ filePath: string } | null>> => {
			try {
				return { ok: true, data: await exportVaultToFile() };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);

	ipcMain.handle(
		IPC_CHANNELS.SELECT_VAULT_BACKUP,
		async (): Promise<IpcResult<VaultBackupSummary | null>> => {
			try {
				return { ok: true, data: await selectVaultBackup() };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);

	ipcMain.handle(
		IPC_CHANNELS.RESTORE_VAULT,
		async (_event, masterPassword: unknown): Promise<IpcResult<null>> => {
			const parsed = masterPasswordSchema.safeParse(masterPassword);
			if (!parsed.success) {
				return {
					ok: false,
					error: parsed.error.issues[0]?.message ?? "入力が不正です",
				};
			}

			try {
				await restoreVaultFromPending(parsed.data);
				return { ok: true, data: null };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);
};
