import { IPC_CHANNELS } from "@shared/ipc-channels";
import type { IpcResult, VaultStatus } from "@shared/types";
import { masterPasswordSchema } from "@shared/validation";
import { ipcMain } from "electron";
import { resetVault } from "../vault/backup";
import {
	changeMasterPassword,
	isMasterPasswordInitialized,
	isUnlocked,
	lock,
	setupMasterPassword,
	unlock,
} from "../vault/master-password";
import { toErrorMessage } from "./error-message";

const getVaultStatus = async (): Promise<VaultStatus> => ({
	initialized: await isMasterPasswordInitialized(),
	unlocked: isUnlocked(),
});

/** マスターパスワードを受け取るハンドラの共通部分（検証 → 実行 → 結果） */
const handleWithMasterPassword = async (
	value: unknown,
	action: (masterPassword: string) => Promise<void>,
): Promise<IpcResult<null>> => {
	const parsed = masterPasswordSchema.safeParse(value);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "入力が不正です",
		};
	}

	try {
		await action(parsed.data);
		return { ok: true, data: null };
	} catch (error) {
		return { ok: false, error: toErrorMessage(error) };
	}
};

export const registerVaultHandlers = (): void => {
	ipcMain.handle(IPC_CHANNELS.GET_VAULT_STATUS, () => getVaultStatus());

	ipcMain.handle(IPC_CHANNELS.SETUP_VAULT, (_event, masterPassword: unknown) =>
		handleWithMasterPassword(masterPassword, setupMasterPassword),
	);

	ipcMain.handle(
		IPC_CHANNELS.UNLOCK_VAULT,
		async (_event, masterPassword: unknown): Promise<IpcResult<null>> => {
			const parsed = masterPasswordSchema.safeParse(masterPassword);
			if (!parsed.success) {
				return {
					ok: false,
					error: parsed.error.issues[0]?.message ?? "入力が不正です",
				};
			}

			try {
				const unlocked = await unlock(parsed.data);
				return unlocked
					? { ok: true, data: null }
					: { ok: false, error: "マスターパスワードが正しくありません" };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);

	ipcMain.handle(IPC_CHANNELS.LOCK_VAULT, async () => {
		lock();
		return getVaultStatus();
	});

	ipcMain.handle(IPC_CHANNELS.RESET_VAULT, (_event, masterPassword: unknown) =>
		handleWithMasterPassword(masterPassword, resetVault),
	);

	ipcMain.handle(
		IPC_CHANNELS.CHANGE_MASTER_PASSWORD,
		async (
			_event,
			currentPassword: unknown,
			newPassword: unknown,
		): Promise<IpcResult<null>> => {
			const parsedNew = masterPasswordSchema.safeParse(newPassword);
			if (!parsedNew.success) {
				return {
					ok: false,
					error: parsedNew.error.issues[0]?.message ?? "入力が不正です",
				};
			}
			if (typeof currentPassword !== "string" || !currentPassword) {
				return {
					ok: false,
					error: "現在のマスターパスワードを入力してください",
				};
			}

			try {
				await changeMasterPassword(currentPassword, parsedNew.data);
				return { ok: true, data: null };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);
};
