import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@renderer/components/ui/collapsible";
import { cn } from "@renderer/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
	icon: ReactNode;
	title: string;
	description?: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
};

export const CollapsibleFormPanel = ({
	icon,
	title,
	description,
	isOpen,
	onOpenChange,
	children,
}: Props) => {
	return (
		<div>
			<Collapsible
				open={isOpen}
				onOpenChange={onOpenChange}
				className="mx-auto w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all"
			>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex w-full cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/50"
					>
						<span className="flex items-center gap-3">
							{icon}
							<span className="space-y-1 text-left">
								<span className="block font-bold text-lg">{title}</span>
								{description && (
									<span className="block text-muted-foreground text-xs">
										{description}
									</span>
								)}
							</span>
						</span>
						<ChevronDown
							className={cn(
								"size-5 shrink-0 text-muted-foreground transition-transform duration-200",
								isOpen && "rotate-180",
							)}
						/>
					</button>
				</CollapsibleTrigger>

				<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
					<div className="space-y-6 border-t px-6 pt-4 pb-6">{children}</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
