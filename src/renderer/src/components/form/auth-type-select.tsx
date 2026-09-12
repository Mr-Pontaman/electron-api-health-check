import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@renderer/components/ui/select";
import { AUTH_TYPE_OPTIONS, type AuthType } from "@shared/constants";

type Props = {
	id: string;
	value: AuthType;
	onValueChange: (value: AuthType) => void;
};

/**
 * 認証タイプ選択の Select。
 * 選択肢は AUTH_TYPE_OPTIONS で一元管理されている。
 */
export const AuthTypeSelect = ({ id, value, onValueChange }: Props) => {
	return (
		<Select
			value={value}
			onValueChange={(val) => onValueChange(val as AuthType)}
		>
			<SelectTrigger id={id}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{AUTH_TYPE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
