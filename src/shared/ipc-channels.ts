export const IPC_CHANNELS = {
	GET_VAULT_STATUS: "vault:get-status",
	SETUP_VAULT: "vault:setup",
	UNLOCK_VAULT: "vault:unlock",
	LOCK_VAULT: "vault:lock",
	CHANGE_MASTER_PASSWORD: "vault:change-master-password",

	GET_API_TARGETS: "api-target:get-all",
	CREATE_API_TARGET: "api-target:create",
	UPDATE_API_TARGET: "api-target:update",
	DELETE_API_TARGET: "api-target:delete",

	PING: "health-check:ping",
} as const;
