import { Button } from "@renderer/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const THEME_OPTIONS = [
	{ value: "light", label: "ライト" },
	{ value: "dark", label: "ダーク" },
	{ value: "lavender", label: "ラベンダー" },
	{ value: "system", label: "システムに合わせる" },
] as const;

export const ThemeToggle = () => {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-9 w-9">
					<Sun className="h-4 w-4 dark:hidden" />
					<Moon className="hidden h-4 w-4 dark:block" />
					<span className="sr-only">テーマを切り替え</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{THEME_OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onSelect={() => setTheme(option.value)}
					>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
