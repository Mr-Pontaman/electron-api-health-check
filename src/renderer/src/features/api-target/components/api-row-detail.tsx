import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@renderer/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@renderer/components/ui/alert-dialog";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { ResponseBodyPreview } from "@renderer/features/health-check/components/response-body-preview";
import { useCodeBlockStore } from "@renderer/hooks/use-code-block-size-store";
import { AUTH_TYPE } from "@shared/constants";
import type { ApiTargetDto, PingResult } from "@shared/types";
import { Pencil, Trash2 } from "lucide-react";
import { EditApiTargetDialog } from "./edit-api-target-dialog";

type Props = {
	api: ApiTargetDto;
	result: PingResult | undefined;
	pingError: Error | null;
	onDelete: () => void;
	isDeleting: boolean;
	isEditDialogOpen: boolean;
	onEditDialogOpenChange: (open: boolean) => void;
};

const DeleteTargetAlertDialog = ({
	targetName,
	isDeleting,
	onDelete,
}: {
	targetName: string;
	isDeleting: boolean;
	onDelete: () => void;
}) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1 border-destructive/20 px-2.5 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
					disabled={isDeleting}
				>
					<Trash2 className="h-3 w-3" />
					{isDeleting ? "削除中..." : "削除"}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>ターゲットの削除</AlertDialogTitle>
					<AlertDialogDescription>
						「{targetName}
						」を本当に削除しますか？この操作は取り消せません。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						onClick={onDelete}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						削除する
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

/**
 * テーブル行を展開したときに表示される詳細パネル。
 * 認証情報の表示、編集・削除アクション、Ping エラー、レスポンスボディのプレビューを担う。
 */
export const ApiRowDetail = ({
	api,
	result,
	pingError,
	onDelete,
	isDeleting,
	isEditDialogOpen,
	onEditDialogOpenChange,
}: Props) => {
	const { height, setHeight } = useCodeBlockStore();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-xs">
					<Badge variant="secondary" className="text-[10px]">
						Auth: {api.authType}
					</Badge>
					{api.credentialKey && (
						<span className="font-mono text-[11px] text-muted-foreground">
							{api.authType === AUTH_TYPE.QUERY ? "Query" : "Header"}: (
							{api.credentialKey})
						</span>
					)}
					{api.authType !== AUTH_TYPE.NONE && (
						<Badge variant="outline" className="text-[10px]">
							{api.hasCredential ? "キー登録済み" : "キー未登録"}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						className="h-7 gap-1 px-2.5 text-xs"
						onClick={() => onEditDialogOpenChange(true)}
					>
						<Pencil className="h-3 w-3" />
						編集
					</Button>

					<DeleteTargetAlertDialog
						targetName={api.name}
						isDeleting={isDeleting}
						onDelete={onDelete}
					/>
				</div>
			</div>

			{pingError && (
				<div className="rounded-md bg-destructive/10 p-2.5 font-medium text-destructive text-xs">
					{pingError.message}
				</div>
			)}

			{result?.body ? (
				<Accordion type="single" collapsible className="w-full">
					<AccordionItem value="body" className="border-0">
						<AccordionTrigger className="justify-start gap-2 py-1 text-muted-foreground text-xs hover:no-underline">
							プレビューを表示 / 非表示
						</AccordionTrigger>
						<AccordionContent>
							<ResponseBodyPreview
								body={result.body}
								height={height}
								onResizeHeight={setHeight}
							/>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			) : !pingError && !result ? (
				<p className="text-muted-foreground text-xs italic">
					「Ping」ボタンを押すと結果が表示されます。
				</p>
			) : null}

			<EditApiTargetDialog
				api={api}
				open={isEditDialogOpen}
				onOpenChange={onEditDialogOpenChange}
			/>
		</div>
	);
};
