import { IPC_CHANNELS } from "@shared/ipc-channels";
import type { PontaPingApi } from "@shared/types";
import { contextBridge, ipcRenderer } from "electron";

/**
 * レンダラーへ公開する唯一の窓口。
 * 汎用の invoke(channel, ...) は公開せず、用途ごとのメソッドだけを並べる。
 */
const api: PontaPingApi = {
	getVaultStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_VAULT_STATUS),

	setupVault: (masterPassword) =>
		ipcRenderer.invoke(IPC_CHANNELS.SETUP_VAULT, masterPassword),

	unlockVault: (masterPassword) =>
		ipcRenderer.invoke(IPC_CHANNELS.UNLOCK_VAULT, masterPassword),

	lockVault: () => ipcRenderer.invoke(IPC_CHANNELS.LOCK_VAULT),

	changeMasterPassword: (currentPassword, newPassword) =>
		ipcRenderer.invoke(
			IPC_CHANNELS.CHANGE_MASTER_PASSWORD,
			currentPassword,
			newPassword,
		),

	resetVault: (masterPassword) =>
		ipcRenderer.invoke(IPC_CHANNELS.RESET_VAULT, masterPassword),

	exportVault: () => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_VAULT),

	selectVaultBackup: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_VAULT_BACKUP),

	restoreVault: (masterPassword) =>
		ipcRenderer.invoke(IPC_CHANNELS.RESTORE_VAULT, masterPassword),

	getApiTargets: () => ipcRenderer.invoke(IPC_CHANNELS.GET_API_TARGETS),

	createApiTarget: (input) =>
		ipcRenderer.invoke(IPC_CHANNELS.CREATE_API_TARGET, input),

	updateApiTarget: (input) =>
		ipcRenderer.invoke(IPC_CHANNELS.UPDATE_API_TARGET, input),

	deleteApiTarget: (id) =>
		ipcRenderer.invoke(IPC_CHANNELS.DELETE_API_TARGET, id),

	ping: (input) => ipcRenderer.invoke(IPC_CHANNELS.PING, input),
};

contextBridge.exposeInMainWorld("api", api);
