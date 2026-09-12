import { AuthTypeSelect } from "@renderer/components/form/auth-type-select";
import { CollapsibleFormPanel } from "@renderer/components/form/collapsible-form-panel";
import { FormTextField } from "@renderer/components/form/form-text-field";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@renderer/components/ui/select";
import { Separator } from "@renderer/components/ui/separator";
import {
	getCredentialKeyLabel,
	getCredentialKeyPlaceholder,
} from "@renderer/features/api-target/credential-key-labels";
import {
	AUTH_TYPE,
	type AuthType,
	HTTP_METHODS,
	type HttpMethod,
} from "@shared/constants";
import { urlSchema, validateWith } from "@shared/validation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { useState } from "react";
import { PingResultView } from "./ping-result-view";

type FormValues = {
	url: string;
	method: HttpMethod;
	authType: AuthType;
	credentialKey: string;
	plainCredential: string;
};

const defaultValues: FormValues = {
	url: "",
	method: "GET",
	authType: AUTH_TYPE.NONE,
	credentialKey: "",
	plainCredential: "",
};

const methodOptions = Object.values(HTTP_METHODS);

type Props = {
	title?: string;
};

/** 保存せずに 1 回だけリクエストを送る、自由入力の Ping テスト */
export const PingTest = ({ title = "Ping を試す" }: Props) => {
	const [isOpen, setIsOpen] = useState(false);

	const pingMutation = useMutation({
		mutationFn: (value: FormValues) =>
			window.api.ping({
				kind: "adhoc",
				url: value.url,
				method: value.method,
				authType: value.authType,
				credentialKey:
					value.authType === AUTH_TYPE.NONE
						? null
						: value.credentialKey || null,
				plainCredential: value.plainCredential || null,
			}),
	});

	const form = useForm({
		defaultValues,
		onSubmit: ({ value }) => {
			pingMutation.mutate(value);
		},
	});

	return (
		<CollapsibleFormPanel
			icon={<Zap className="size-5 text-amber-500" />}
			title={title}
			description=""
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<p className="text-xs">
				保存せずに即時レスポンスと応答時間を計測します。
			</p>
			<Separator />
			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div className="flex gap-2">
					<form.Field name="method">
						{(field) => (
							<div className="w-28 space-y-2">
								<Label htmlFor={field.name}>Method</Label>
								<Select
									value={field.state.value}
									onValueChange={(value) =>
										field.handleChange(value as HttpMethod)
									}
								>
									<SelectTrigger id={field.name}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{methodOptions.map((method) => (
											<SelectItem key={method} value={method}>
												{method}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					<form.Field
						name="url"
						validators={{ onChange: validateWith(urlSchema) }}
					>
						{(field) => (
							<div className="flex-1">
								<FormTextField
									id={field.name}
									label="URL"
									type="url"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									errors={field.state.meta.errors}
									placeholder="https://api.github.com/users/octocat"
								/>
							</div>
						)}
					</form.Field>
				</div>

				<form.Field name="authType">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>認証タイプ</Label>
							<AuthTypeSelect
								id={field.name}
								value={field.state.value}
								onValueChange={field.handleChange}
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

								<p className="text-muted-foreground text-xs">
									入力した値は保存されません。実行のたびに入力してください。
								</p>
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
								!isDirty || !canSubmit || isSubmitting || pingMutation.isPending
							}
							className="w-full"
						>
							{pingMutation.isPending ? "Ping送信中..." : "Pingテスト実行"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			{pingMutation.data && <PingResultView result={pingMutation.data} />}
		</CollapsibleFormPanel>
	);
};
