import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";

type Props = {
	id: string;
	label: string;
	value: string;
	onBlur: () => void;
	onChange: (value: string) => void;
	type?: "text" | "url" | "password";
	placeholder?: string;
	autoComplete?: string;
	errors?: readonly (string | undefined)[];
};

/**
 * Label + Input + バリデーションエラー表示をまとめたテキスト入力フィールド。
 * TanStack Form の field から値・ハンドラ・エラーを受け取って表示する。
 */
export const FormTextField = ({
	id,
	label,
	value,
	onBlur,
	onChange,
	type = "text",
	placeholder,
	autoComplete,
	errors,
}: Props) => {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type={type}
				value={value}
				onBlur={onBlur}
				autoComplete={autoComplete}
				className="placeholder:text-muted-foreground/40"
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
			/>
			{errors && errors.filter(Boolean).length > 0 && (
				<p className="text-destructive text-sm">
					{errors.filter(Boolean).join(", ")}
				</p>
			)}
		</div>
	);
};
