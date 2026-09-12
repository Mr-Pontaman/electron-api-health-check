# Electron 構成メモ

## 3 つのプロセス

- **renderer** (`src/renderer/src`) — ブラウザと同じ制約で動く React。Node には触れない。
  preload が公開した `window.api` 経由でのみ main とやり取りする。
- **preload** (`src/preload`) — 画面と Node の間に立つ窓口。
  `contextBridge.exposeInMainWorld("api", ...)` で用途ごとのメソッドだけを公開する。
  汎用の `invoke(channel, ...)` は公開しないこと。
- **main** (`src/main`) — Node.js 側。SQLite・暗号化・HTTP 送信はすべてここ。
  「機密に触るのは main だけ」を崩さない。

Next.js で言うなら renderer = コンポーネント、preload = 通信レイヤー、main = API routes。

## IPC の戻り値

想定内の失敗（パスワード違い、対象なし等）は例外ではなく
`IpcResult<T>`（`{ ok: false, error: "日本語メッセージ" }`）で返す。
例外にすると Electron がメッセージを包んでしまい、そのまま UI に出せないため。

## ネイティブモジュール

`better-sqlite3` は `@prisma/adapter-better-sqlite3` の依存として入る。
ASAR 内からは読み込めないため `electron-builder.config.ts` の `asarUnpack` に
`**/*.node` を指定している。`prisma/migrations/**` も実行時に読むので同様に展開する。

