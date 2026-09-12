/** IPC の応答に載せるための、例外からユーザー向けメッセージへの変換 */
export const toErrorMessage = (
	error: unknown,
	fallback = "予期しないエラーが発生しました",
): string => (error instanceof Error ? error.message : fallback);
