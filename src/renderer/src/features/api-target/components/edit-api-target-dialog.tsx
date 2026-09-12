import { AuthTypeSelect } from "@renderer/components/form/auth-type-select";
import { Button } from "@renderer/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@renderer/components/ui/dialog";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@renderer/components/ui/select";
import {
	AUTH_TYPE,
	type AuthType,
	HTTP_METHODS,
	type HttpMethod,
} from "@shared/constants";
import type { ApiTargetDto } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	getCredentialKeyLabel,
	getCredentialKeyPlaceholder,
} from "../credential-key-labels";
import { apiTargetsQueryKey } from "../query-keys";

type Props = {
	api: ApiTargetDto;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const methodOptions = Object.values(HTTP_METHODS);

export const EditApiTargetDialog = ({ api, open, onOpenChange }: Props) => {
	const [name, setName] = useState(api.name);
	const [url, setUrl] = useState(api.url);
	const [method, setMethod] = useState<HttpMethod>(api.method);
	const [authType, setAuthType] = useState<AuthType>(api.authType);
	const [credentialKey, setCredentialKey] = useState(api.credentialKey ?? "");
	const [newCredential, setNewCredential] = useState("");
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: async () => {
			const result = await window.api.updateApiTarget({
				id: api.id,
				name,
				url,
				method,
				authType,
				credentialKey:
					authType === AUTH_TYPE.NONE ? null : credentialKey || null,
				// 空欄なら既存の資格情報を維持する
				plainCredential: newCredential.trim() ? newCredential : null,
			});

			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			toast.success("ターゲットを更新しました");
			setNewCredential("");
			onOpenChange(false);
			await queryClient.invalidateQueries({ queryKey: apiTargetsQueryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || "ターゲットの更新に失敗しました");
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (!updateMutation.isPending) {
							updateMutation.mutate();
						}
					}}
				>
					<DialogHeader>
						<DialogTitle>ターゲット情報の編集</DialogTitle>
						<DialogDescription>APIの接続情報を変更できます。</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4 text-xs">
						<div className="space-y-1.5">
							<Label htmlFor="edit-name">APIサービス名</Label>
							<Input
								id="edit-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-url">URL</Label>
							<Input
								id="edit-url"
								type="url"
								value={url}
								onChange={(event) => setUrl(event.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-method">HTTP Method</Label>
							<Select
								value={method}
								onValueChange={(value) => setMethod(value as HttpMethod)}
							>
								<SelectTrigger id="edit-method">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{methodOptions.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-authtype">認証タイプ</Label>
							<AuthTypeSelect
								id="edit-authtype"
								value={authType}
								onValueChange={setAuthType}
							/>
						</div>

						{authType !== AUTH_TYPE.NONE && (
							<>
								<div className="space-y-1.5">
									<Label htmlFor="edit-credential-key">
										{getCredentialKeyLabel(authType)}
									</Label>
									<Input
										id="edit-credential-key"
										value={credentialKey}
										placeholder={getCredentialKeyPlaceholder(authType)}
										onChange={(event) => setCredentialKey(event.target.value)}
									/>
								</div>

								<div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-3">
									<div className="space-y-1">
										<Label htmlFor="edit-new-credential">
											新しい API キー / トークン (変更時のみ入力)
										</Label>
										<Input
											id="edit-new-credential"
											type="password"
											autoComplete="off"
											placeholder="変更しない場合は空欄のまま"
											value={newCredential}
											onChange={(event) => setNewCredential(event.target.value)}
										/>
									</div>
									<p className="text-muted-foreground">
										{api.hasCredential
											? "登録済みのキーは、入力しない限りそのまま維持されます。"
											: "キーはまだ登録されていません。"}
									</p>
								</div>
							</>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							キャンセル
						</Button>
						<Button type="submit" disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "更新中..." : "更新を保存"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
