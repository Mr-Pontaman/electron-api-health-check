# Ponta Ping

API エンドポイントのヘルスチェックツール（Electron デスクトップアプリ）。

登録した URL に Ping を送り、ステータスコード・応答時間・レスポンスボディを確認できます。
API キーはマスターパスワードから導出した鍵で暗号化して端末内に保存します。

## 特徴

- **ローカル完結** — サーバを持たず、データは端末内の SQLite に保存されます。
- **マスターパスワード必須** — 解錠しない限りアプリの機能を使えません。
- **API キーの暗号化** — 平文のキーは保存されません。
- **ローカルサーバも監視可能** — `localhost` やプライベート IP も登録できます。

## 配布物の起動について（Ubuntu 24.04 以降）

Ubuntu 24.04 以降は `kernel.apparmor_restrict_unprivileged_userns = 1` のため
Chromium のサンドボックスが使えません。配布形式ごとに次のようになります。

| 形式        | 起動方法                                                                             |
| ----------- | ------------------------------------------------------------------------------------ |
| `.deb`      | そのまま起動できます（インストール時に setuid の `chrome-sandbox` が配置されるため） |
| `.AppImage` | `./ponta-ping-1.0.0.AppImage --no-sandbox` で起動してください                        |
| snap        | そのまま起動できます（`snapcraft.yaml` の command に `--no-sandbox` を含めています） |

`dist/linux-unpacked/` を直接実行する場合も `--no-sandbox` が必要です。

## データの保存場所

`app.getPath("userData")/api-health-check.db`（SQLite）。

- `api_target` — 監視対象。URL・メソッド・認証方式と、暗号化された API キー。
- `app_setting` — マスターパスワードの検証用ブロブと PBKDF2 の salt。

DB のスキーマは `prisma/schema.prisma` が正で、アプリ起動時に
`prisma/migrations` の SQL を自前で適用します（配布先に Prisma CLI が無いため）。

## セキュリティ上の前提

- マスターパスワードは保存されません。忘れると暗号化された API キーは復旧できません。
- 暗号鍵はアプリ起動中のみ main プロセスのメモリ上に存在します。
- 平文の API キーがレンダラー（画面側）へ渡ることはありません。復号と送信は main で行います。
- URL・メソッド・ヘッダー名・実行結果は暗号化されずに保存されます。
