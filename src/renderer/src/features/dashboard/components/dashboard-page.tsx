import { Button } from "@renderer/components/ui/button";
import { ApiTargetList } from "@renderer/features/api-target/components/api-target-list";
import { CreateApiTargetForm } from "@renderer/features/api-target/components/create-api-target-form";
import { useApiTargets } from "@renderer/features/api-target/hooks/use-api-targets";
import { PingTest } from "@renderer/features/health-check/components/ping-test";
import { cn } from "@renderer/lib/utils";
import { MoveHorizontal } from "lucide-react";
import { useState } from "react";
import { DashboardHeader } from "./dashboard-header";

export const DashboardPage = () => {
	const [fullWidth, setFullWidth] = useState(true);
	const { data: apiTargets, isPending, error } = useApiTargets();

	return (
		<div
			className={cn(
				fullWidth ? "w-full" : "container",
				"mx-auto space-y-1 px-4 xl:px-14 py-6",
			)}
		>
			<DashboardHeader />
			<div className="flex justify-end max-md:hidden">
				<Button variant={"ghost"} onClick={() => setFullWidth((prev) => !prev)}>
					<MoveHorizontal />
				</Button>
			</div>
			<main className="grid grid-cols-1 items-start gap-6">
				<div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 gap-x-4 sm:gap-x-10 xl:gap-x-14">
					<CreateApiTargetForm />
					<PingTest title="クイック Ping テスト" />
				</div>
				<div className="space-y-6">
					{isPending && (
						<p className="text-muted-foreground text-sm">読み込み中...</p>
					)}
					{error && (
						<p className="text-destructive text-sm">
							ターゲットの読み込みに失敗しました: {error.message}
						</p>
					)}
					{apiTargets && <ApiTargetList apiTargets={apiTargets} />}
				</div>
			</main>
		</div>
	);
};
