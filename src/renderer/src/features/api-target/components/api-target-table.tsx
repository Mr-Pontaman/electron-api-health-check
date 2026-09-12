import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@renderer/components/ui/table";
import type { ApiTargetDto } from "@shared/types";
import { ApiTargetTableRow } from "./api-target-table-row";

type Props = {
	apiTargets: ApiTargetDto[];
};

export const ApiTargetTable = ({ apiTargets }: Props) => {
	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="w-28">Status</TableHead>
						<TableHead>Target</TableHead>
						<TableHead className="w-20">Method</TableHead>
						<TableHead className="w-24">Response</TableHead>
						<TableHead className="w-28 text-right">Ping</TableHead>
						<TableHead className="w-12 text-right">
							<span className="sr-only">操作</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{apiTargets.map((api) => (
						<ApiTargetTableRow key={api.id} api={api} />
					))}
				</TableBody>
			</Table>
		</div>
	);
};
