import { ShieldAlert } from "lucide-react";

const SECTIONS = [
	{
		id: "1",
		title: "本アプリの概要",
		body: (
			<p>
				本アプリは、ユーザーが指定した API
				エンドポイントのレスポンスやステータスコードを可視化する、端末上で動作するデスクトップアプリケーションです。本アプリは現状有姿（AS
				IS）で提供されます。
			</p>
		),
	},
	{
		id: "2",
		title: "暗号化キーおよびデータの管理",
		body: (
			<>
				<p>
					API
					キーはマスターパスワードから導出した鍵で暗号化して保存されます。マスターパスワードそのものは保存されません。
				</p>
				<ul className="list-disc space-y-1 pl-5">
					<li>マスターパスワードはディスクにも外部にも送信されません。</li>
					<li>
						マスターパスワードを紛失した場合、暗号化された API
						キーの復元は技術的に不可能です。
					</li>
					<li>
						登録した
						URL・ヘッダー名・実行結果は暗号化されずに端末内へ保存されます。
					</li>
				</ul>
			</>
		),
	},
	{
		id: "3",
		title: "免責事項",
		body: (
			<>
				<p>
					本アプリの利用によりユーザーまたは第三者に生じた損害・不利益について、作者は一切の責任を負いません。
				</p>
				<ul className="list-disc space-y-1 pl-5">
					<li>
						Ping 実行（HTTP
						リクエスト）が対象サーバーに与えた負荷や障害、それに伴う過剰請求等。
					</li>
					<li>本アプリの動作不良、データの消失、端末上のトラブル。</li>
					<li>外部 API 側の仕様変更や障害。</li>
				</ul>
			</>
		),
	},
	{
		id: "4",
		title: "禁止事項",
		body: (
			<>
				<p>本アプリを以下の目的で使用してはなりません。</p>
				<ul className="list-disc space-y-1 pl-5">
					<li>
						所有権または正規のアクセス権限を持たない第三者のサーバーへの過度な負荷を与える行為（DoS/DDoS
						目的の使用）。
					</li>
					<li>法令または公序良俗に違反する行為。</li>
					<li>対象サーバーの利用規約に反する形でのリクエスト送信。</li>
				</ul>
			</>
		),
	},
	{
		id: "5",
		title: "本アプリの変更および配布の終了",
		body: (
			<p>
				作者は、事前の通知なく本アプリの内容変更、配布の停止を行うことがあります。これによって生じた損害について、作者は一切の責任を負いません。
			</p>
		),
	},
];

export const TermsContent = () => {
	return (
		<div className="space-y-5 text-muted-foreground text-xs leading-relaxed">
			{SECTIONS.map(({ id, title, body }) => (
				<section key={id} className="space-y-1.5">
					<h3 className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
						{id === "3" && (
							<ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
						)}
						{id}. {title}
					</h3>
					{body}
				</section>
			))}
		</div>
	);
};
