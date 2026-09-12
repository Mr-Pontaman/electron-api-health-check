import { Button } from "@renderer/components/ui/button";

type Props = {
	error: Error;
	reset: () => void;
};

export const ErrorPage = ({ error, reset }: Props) => {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
			<h1 className="font-bold text-2xl tracking-tight">
				エラーが発生しました
			</h1>
			<p className="break-all text-muted-foreground text-sm">{error.message}</p>
			<Button variant="outline" onClick={() => reset()}>
				再試行
			</Button>
		</div>
	);
};
