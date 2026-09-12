import { IPC_CHANNELS } from "@shared/ipc-channels";
import type { PingInput, PingRequest, PingResult } from "@shared/types";
import { pingInputSchema } from "@shared/validation";
import { ipcMain } from "electron";
import { getPrisma } from "../db/client";
import { ping } from "../health-check/ping";
import { decryptWithKey } from "../vault/crypto";
import { requireUnlockedKey } from "../vault/master-password";
import { toErrorMessage } from "./error-message";

const toFailure = (statusText: string, error: string): PingResult => ({
	ok: false,
	status: 0,
	statusText,
	responseTimeMs: 0,
	error,
});

/** 保存済みターゲットを復号してリクエストに組み立てる */
const resolveTargetRequest = async (targetId: string): Promise<PingRequest> => {
	const target = await getPrisma().apiTarget.findUnique({
		where: { id: targetId },
	});
	if (!target) {
		throw new Error("対象のターゲットが見つかりません");
	}

	let plainCredential: string | null = null;
	if (target.encryptedValue !== null && target.iv !== null) {
		plainCredential = await decryptWithKey(requireUnlockedKey(), {
			value: target.encryptedValue,
			iv: target.iv,
		});
	}

	return {
		url: target.url,
		method: target.method,
		authType: target.authType,
		credentialKey: target.credentialKey,
		plainCredential,
	};
};

const resolveRequest = async (input: PingInput): Promise<PingRequest> => {
	if (input.kind === "target") {
		return resolveTargetRequest(input.targetId);
	}

	return {
		url: input.url,
		method: input.method,
		authType: input.authType,
		credentialKey: input.credentialKey,
		plainCredential: input.plainCredential,
	};
};

export const registerHealthCheckHandlers = (): void => {
	ipcMain.handle(
		IPC_CHANNELS.PING,
		async (_event, input: unknown): Promise<PingResult> => {
			const parsed = pingInputSchema.safeParse(input);
			if (!parsed.success) {
				return toFailure(
					"INVALID_INPUT",
					parsed.error.issues[0]?.message ?? "入力が不正です",
				);
			}

			try {
				return await ping(await resolveRequest(parsed.data));
			} catch (error) {
				return toFailure("ERROR", toErrorMessage(error));
			}
		},
	);
};
