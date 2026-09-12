import { APP_NAME } from "@shared/constants";
import type { ReactNode } from "react";

type Props = {
	title?: string;
	description: ReactNode;
	children: ReactNode;
};

export const VaultScreenLayout = ({
	title = "",
	description,
	children,
}: Props) => {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
			<div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
				<div className="mb-6 space-y-1.5">
					<p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
						{APP_NAME}
					</p>
					<h1 className="font-bold text-xl tracking-tight">{title}</h1>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
				{children}
			</div>
		</div>
	);
};
