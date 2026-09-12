import type { AuthType, HttpMethod } from "./constants";

/**
 * IPC 越しに返す結果
 */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * レンダラーへ渡す API ターゲット。
 */
export type ApiTargetDto = {
	id: string;
	name: string;
	url: string;
	method: HttpMethod;
	authType: AuthType;
	/** ヘッダー名、または QUERY のときはクエリパラメータ名 */
	credentialKey: string | null;
	hasCredential: boolean;
	createdAt: string;
	updatedAt: string;
};

export type CreateApiTargetInput = {
	name: string;
	url: string;
	method: HttpMethod;
	authType: AuthType;
	credentialKey: string | null;
	/** 平文の API キー。main が受け取って暗号化し、保存後は破棄する */
	plainCredential: string | null;
};

export type UpdateApiTargetInput = CreateApiTargetInput & {
	id: string;
};

/**
 * 送信するリクエストの中身。main の中だけで組み立てる。
 */
export type PingRequest = {
	url: string;
	method: HttpMethod;
	authType: AuthType;
	credentialKey: string | null;
	plainCredential: string | null;
};

/**
 * レンダラーから受け取る Ping の指示。
 */
export type PingInput =
	| { kind: "target"; targetId: string }
	| {
			kind: "adhoc";
			url: string;
			method: HttpMethod;
			authType: AuthType;
			credentialKey: string | null;
			plainCredential: string | null;
	  };

export type PingResult = {
	ok: boolean;
	status: number;
	statusText: string;
	responseTimeMs: number;
	contentType?: string;
	body?: string;
	error?: string;
};

export type VaultStatus = {
	/** マスターパスワードが設定済みか */
	initialized: boolean;
	/** 現在のセッションで解錠済みか */
	unlocked: boolean;
};

/** preload が contextBridge で公開する API の形。実装は src/preload/index.ts */
export type PontaPingApi = {
	getVaultStatus: () => Promise<VaultStatus>;
	setupVault: (masterPassword: string) => Promise<IpcResult<null>>;
	unlockVault: (masterPassword: string) => Promise<IpcResult<null>>;
	lockVault: () => Promise<VaultStatus>;
	changeMasterPassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<IpcResult<null>>;

	getApiTargets: () => Promise<ApiTargetDto[]>;
	createApiTarget: (
		input: CreateApiTargetInput,
	) => Promise<IpcResult<ApiTargetDto>>;
	updateApiTarget: (
		input: UpdateApiTargetInput,
	) => Promise<IpcResult<ApiTargetDto>>;
	deleteApiTarget: (id: string) => Promise<IpcResult<null>>;

	ping: (input: PingInput) => Promise<PingResult>;
};
