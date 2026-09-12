import { Button } from "@renderer/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@renderer/components/ui/dialog";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@renderer/components/ui/tabs";
import { APP_NAME } from "@shared/constants";
import { HelpCircle } from "lucide-react";
import { FaqList } from "./faq-list";
import { TermsContent } from "./terms-content";

export const HelpDialog = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" className="h-9 w-9">
					<HelpCircle className="h-4 w-4" />
					<span className="sr-only">ヘルプ</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="sr-only">ヘルプ</DialogTitle>
					<DialogDescription className="sr-only">
						{APP_NAME} の使い方と取り扱いについて
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="faq">
					<TabsList className="w-full">
						<TabsTrigger value="faq">FAQ</TabsTrigger>
						<TabsTrigger value="terms">利用規約</TabsTrigger>
					</TabsList>

					<TabsContent value="faq">
						<FaqList />
					</TabsContent>

					<TabsContent value="terms">
						<TermsContent />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
