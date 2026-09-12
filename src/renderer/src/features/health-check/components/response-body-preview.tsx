import { formatResponseBody } from "@renderer/lib/format-response-body";
import { GripHorizontal } from "lucide-react";

type Props = {
	body: string;
	/** リサイズ可能な表示にする場合の現在の高さ（px） */
	height?: number;
	/** リサイズ可能な表示にする場合の高さ変更ハンドラ */
	onResizeHeight?: (height: number) => void;
};

/**
 * Ping レスポンスボディの表示。
 * 任意で下部のグリップをドラッグして高さを調整できる。
 */
export const ResponseBodyPreview = ({
	body,
	height,
	onResizeHeight,
}: Props) => {
	const resizable = height !== undefined && onResizeHeight !== undefined;

	return (
		<div className="space-y-1.5 border-t pt-2">
			<p className="font-medium font-sans text-[11px] text-muted-foreground">
				Response Body:
			</p>
			<pre
				style={resizable ? { height: `${height}px` } : undefined}
				className="max-h-64 overflow-auto rounded-md bg-zinc-950 p-3 text-[13px] text-zinc-100 leading-relaxed"
			>
				<code>{formatResponseBody(body)}</code>
			</pre>

			{resizable && onResizeHeight && (
				<div className="group relative">
					<button
						type="button"
						onMouseDown={(e) => {
							e.preventDefault();
							const startY = e.clientY;
							const startHeight = height;

							const onMouseMove = (moveEvent: MouseEvent) => {
								onResizeHeight(startHeight + (moveEvent.clientY - startY));
							};

							const onMouseUp = () => {
								window.removeEventListener("mousemove", onMouseMove);
								window.removeEventListener("mouseup", onMouseUp);
							};

							window.addEventListener("mousemove", onMouseMove);
							window.addEventListener("mouseup", onMouseUp);
						}}
						className="mt-1 flex h-4 w-full cursor-ns-resize select-none items-center justify-center rounded-b-lg bg-muted/60 transition-colors hover:bg-muted-foreground/30"
						title="上下にドラッグして高さを調整"
					>
						<GripHorizontal className="size-5 text-muted-foreground" />
					</button>
				</div>
			)}
		</div>
	);
};
