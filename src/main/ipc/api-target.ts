import { AUTH_TYPE } from "@shared/constants";
import { IPC_CHANNELS } from "@shared/ipc-channels";
import type { ApiTargetDto, IpcResult } from "@shared/types";
import {
	createApiTargetSchema,
	updateApiTargetSchema,
} from "@shared/validation";
import { ipcMain } from "electron";
import type { ApiTarget } from "../../../prisma/generated/prisma/client";
import { getPrisma } from "../db/client";
import { encryptWithKey } from "../vault/crypto";
import { requireUnlockedKey } from "../vault/master-password";
import { toErrorMessage } from "./error-message";

/**
 * 暗号文（encryptedValue / iv）は main から出さない。
 * レンダラーには「資格情報が登録済みか」だけを渡す。
 */
const toDto = (target: ApiTarget): ApiTargetDto => ({
	id: target.id,
	name: target.name,
	url: target.url,
	method: target.method,
	authType: target.authType,
	credentialKey: target.credentialKey,
	hasCredential: target.encryptedValue !== null && target.iv !== null,
	createdAt: target.createdAt.toISOString(),
	updatedAt: target.updatedAt.toISOString(),
});

export const registerApiTargetHandlers = (): void => {
	ipcMain.handle(
		IPC_CHANNELS.GET_API_TARGETS,
		async (): Promise<ApiTargetDto[]> => {
			const targets = await getPrisma().apiTarget.findMany({
				orderBy: { createdAt: "asc" },
			});
			return targets.map(toDto);
		},
	);

	ipcMain.handle(
		IPC_CHANNELS.CREATE_API_TARGET,
		async (_event, input: unknown): Promise<IpcResult<ApiTargetDto>> => {
			const parsed = createApiTargetSchema.safeParse(input);
			if (!parsed.success) {
				return {
					ok: false,
					error: parsed.error.issues[0]?.message ?? "入力が不正です",
				};
			}

			try {
				const { plainCredential, ...values } = parsed.data;
				const encrypted =
					values.authType !== AUTH_TYPE.NONE && plainCredential
						? await encryptWithKey(requireUnlockedKey(), plainCredential)
						: null;

				const created = await getPrisma().apiTarget.create({
					data: {
						...values,
						encryptedValue: encrypted?.value ?? null,
						iv: encrypted?.iv ?? null,
					},
				});

				return { ok: true, data: toDto(created) };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);

	ipcMain.handle(
		IPC_CHANNELS.UPDATE_API_TARGET,
		async (_event, input: unknown): Promise<IpcResult<ApiTargetDto>> => {
			const parsed = updateApiTargetSchema.safeParse(input);
			if (!parsed.success) {
				return {
					ok: false,
					error: parsed.error.issues[0]?.message ?? "入力が不正です",
				};
			}

			const { id, plainCredential, ...values } = parsed.data;

			try {
				const existing = await getPrisma().apiTarget.findUnique({
					where: { id },
				});
				if (!existing) {
					return { ok: false, error: "対象のターゲットが見つかりません" };
				}

				// 認証なしに変更したら資格情報は捨てる。
				// 新しい値が入力されたときだけ暗号化し直し、未入力なら既存を維持する。
				let credentialUpdate: {
					encryptedValue: string | null;
					iv: string | null;
				} | null = null;

				if (values.authType === AUTH_TYPE.NONE) {
					credentialUpdate = { encryptedValue: null, iv: null };
				} else if (plainCredential) {
					const encrypted = await encryptWithKey(
						requireUnlockedKey(),
						plainCredential,
					);
					credentialUpdate = {
						encryptedValue: encrypted.value,
						iv: encrypted.iv,
					};
				}

				const updated = await getPrisma().apiTarget.update({
					where: { id },
					data: {
						...values,
						...(credentialUpdate ?? {}),
					},
				});

				return { ok: true, data: toDto(updated) };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);

	ipcMain.handle(
		IPC_CHANNELS.DELETE_API_TARGET,
		async (_event, id: unknown): Promise<IpcResult<null>> => {
			if (typeof id !== "string" || !id) {
				return { ok: false, error: "IDが不正です" };
			}

			try {
				const result = await getPrisma().apiTarget.deleteMany({
					where: { id },
				});
				if (result.count === 0) {
					return { ok: false, error: "対象のターゲットが見つかりません" };
				}
				return { ok: true, data: null };
			} catch (error) {
				return { ok: false, error: toErrorMessage(error) };
			}
		},
	);
};
