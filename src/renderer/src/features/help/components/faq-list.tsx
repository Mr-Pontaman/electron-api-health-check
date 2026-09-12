import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@renderer/components/ui/accordion";

const FAQS = [
	{
		q: "なぜ起動時にマスターパスワードが必要なのですか？",
		a: "API キーはマスターパスワードから導出した鍵で暗号化してデータベースに保存しており、その鍵はアプリを起動している間だけメモリ上に置かれます。解錠しない限り復号できないため、起動のたびに入力が必要です。",
	},
	{
		q: "マスターパスワードを忘れた場合はどうなりますか？",
		a: "マスターパスワードはどこにも保存していないため、再発行も暗号化された API キーの復元もできません。お手数ですが、対象のターゲットを削除して再登録してください。",
	},
	{
		q: "登録した URL や API キーはどこに保存されますか？",
		a: "この端末のアプリ専用フォルダにある SQLite データベースに保存されます。API キーとトークンは AES-GCM で暗号化した状態で保存され、平文のままディスクに書き込まれることはありません。",
	},
	{
		q: "ローカルの開発サーバも監視できますか？",
		a: "はい。localhost や 192.168.x.x のようなプライベートなアドレスも登録できます。開発中のサーバのヘルスチェックにもお使いいただけます。",
	},
];

export const FaqList = () => {
	return (
		<Accordion type="multiple" className="w-full space-y-1">
			{FAQS.map((faq, index) => (
				<AccordionItem key={faq.q} value={`item-${index}`}>
					<AccordionTrigger className="py-3 text-left font-semibold text-sm hover:no-underline">
						{faq.q}
					</AccordionTrigger>
					<AccordionContent className="pb-3 text-muted-foreground text-xs leading-relaxed">
						{faq.a}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
};
