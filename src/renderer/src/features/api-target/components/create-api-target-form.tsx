import { AuthTypeSelect } from "@renderer/components/form/auth-type-select";
import { CollapsibleFormPanel } from "@renderer/components/form/collapsible-form-panel";
import { FormTextField } from "@renderer/components/form/form-text-field";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/label";
import { AUTH_TYPE, type AuthType } from "@shared/constants";
import { nameSchema, urlSchema, validateWith } from "@shared/validation";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	getCredentialKeyLabel,
	getCredentialKeyPlaceholder,
	getDefaultCredentialKey,
} from "../credential-key-labels";
import { apiTargetsQueryKey } from "../query-keys";

type FormValues = {
	name: string;
	url: string;
	authType: AuthType;
	credentialKey: string;
	plainCredential: string;
};

const defaultValues: FormValues = {
	name: "",
	url: "",
	authType: AUTH_TYPE.NONE,
	credentialKey: getDefaultCredentialKey(AUTH_TYPE.NONE),
	plainCredential: "",
};

export const CreateApiTargetForm = () => {
	const [isOpen, setIsOpen] = useState(false);
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (value: FormValues) => {
			const result = await window.api.createApiTarget({
				name: value.name,
				url: value.url,
				method: "GET",
				authType: value.authType,
				credentialKey:
					value.authType === AUTH_TYPE.NONE
						? null
						: value.credentialKey || null,
				plainCredential: value.plainCredential || null,
			});

			if (!result.ok) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			toast.success("ターゲットの登録が完了しました");
			form.reset();
			setIsOpen(false);
			await queryClient.invalidateQueries({ queryKey: apiTargetsQueryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || "保存に失敗しました");
		},
	});

	const form = useForm({
		defaultValues,
		onSubmit: ({ value }) => {
			createMutation.mutate(value);
		},
	});

	return (
		<CollapsibleFormPanel
			icon={<PlusCircle className="size-5 text-primary" />}
			title="API 監視ターゲットの追加"
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				<form.Field
					name="name"
					validators={{ onChange: validateWith(nameSchema) }}
				>
					{(field) => (
						<FormTextField
							id={field.name}
							label="APIサービス名"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							errors={field.state.meta.errors}
							placeholder="例: JSON Placeholder"
						/>
					)}
				</form.Field>

				<form.Field
					name="url"
					validators={{ onChange: validateWith(urlSchema) }}
				>
					{(field) => (
						<FormTextField
							id={field.name}
							label="URL"
							type="url"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							autoComplete="off"
							errors={field.state.meta.errors}
							placeholder="https://jsonplaceholder.typicode.com/todos/1"
						/>
					)}
				</form.Field>

				<form.Field name="authType">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>認証タイプ</Label>
							<AuthTypeSelect
								id={field.name}
								value={field.state.value}
								onValueChange={(authType: AuthType) => {
									field.handleChange(authType);
									// 認証タイプを変えたらキー名の既定値も合わせる
									form.setFieldValue(
										"credentialKey",
										getDefaultCredentialKey(authType),
									);
								}}
							/>
						</div>
					)}
				</form.Field>

				<form.Subscribe selector={(state) => [state.values.authType]}>
					{([authType]) => {
						if (authType === AUTH_TYPE.NONE) return null;

						return (
							<div className="space-y-4 rounded-lg border border-dashed bg-muted/30 p-4">
								{(authType === AUTH_TYPE.CUSTOM ||
									authType === AUTH_TYPE.API_KEY ||
									authType === AUTH_TYPE.QUERY) && (
									<form.Field name="credentialKey">
										{(field) => (
											<FormTextField
												id={field.name}
												label={getCredentialKeyLabel(authType)}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={field.handleChange}
												autoComplete="off"
												placeholder={getCredentialKeyPlaceholder(authType)}
											/>
										)}
									</form.Field>
								)}

								<form.Field name="plainCredential">
									{(field) => (
										<FormTextField
											id={field.name}
											label="APIキー / トークン"
											type="password"
											autoComplete="off"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={field.handleChange}
											errors={field.state.meta.errors}
											placeholder="sk-..."
										/>
									)}
								</form.Field>

								<div className="flex gap-2 border-t pt-3 text-muted-foreground text-xs">
									<Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
									<div className="space-y-1">
										<p>
											APIキーはマスターパスワードから導出した鍵で暗号化して保存されます。マスターパスワードと平文のAPIキーが保存されることはありません。
										</p>
										{authType === AUTH_TYPE.QUERY && (
											<p>
												URLにはAPIキーを含めないでください。実行時に
												<span className="font-mono">
													?{getCredentialKeyPlaceholder(authType)}=…
												</span>
												として付与されます。
											</p>
										)}
									</div>
								</div>
							</div>
						);
					}}
				</form.Subscribe>

				<form.Subscribe
					selector={(state) => [
						state.canSubmit,
						state.isSubmitting,
						state.isDirty,
					]}
				>
					{([canSubmit, isSubmitting, isDirty]) => (
						<Button
							type="submit"
							disabled={
								!isDirty ||
								!canSubmit ||
								isSubmitting ||
								createMutation.isPending
							}
							className="w-full"
						>
							{createMutation.isPending
								? "暗号化して保存中..."
								: "ターゲットを登録"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</CollapsibleFormPanel>
	);
};
