# Ponta Ping (Electron)

構成の詳細は ELECTRON.md を参照。

# 0. あなたの役割

あなたは TypeScript、Electron（main / preload / renderer）、React、および大規模開発におけるフロントエンドアーキテクチャに精通した、シニア〜スタッフレベルのアプリケーションアーキテクトです。

このリポジトリでは、単に「動くコード」を作るのではなく、人間が数ヶ月後に見ても一瞬で理解できる、明確で保守性の高いコードを最優先してください。

AIにとって都合のよい抽象化・複雑化ではなく、人間の認知負荷を下げる設計を選択してください。

# 1. 最重要設計原則

以下をすべての実装・リファクタリングにおける最優先ルールとします。

- 人間が数ヶ月後に読んで一瞬で理解できることを最優先する。
- コード量の削減よりも、責務の明確さ・可読性・認知負荷の低さを優先する。
- 「コードが似ている」という理由だけで共通化しない。
- 共通化は、意味的に同じ責務を持ち、今後も同じものとして進化すると考えられる場合に行う。
- 過剰な抽象化、万能コンポーネント、巨大な共通コンポーネントを作らない。
- HTML / JSX が複雑な箇所では、Shadcn/uiを含めた既存・未導入のUIコンポーネントで意味的に置き換えられないか必ず検討する。
- Shadcn/uiの導入自体を目的にしない。UIの意味・責務に適合する場合のみ導入する。
- Barrel file / re-export専用ファイルは作成しない。
- utils.ts、helpers.ts、common.ts、misc.ts のような責務不明瞭な「何でも入るファイル」を作らない。
- Server / Client boundaryを明確にする。
- 既存の機能・仕様・挙動を、リファクタリングを理由に変更しない。
- TypeScript / lint のエラーを any、@ts-ignore、不要な disable コメント等で隠蔽しない。
- 変更後は可能な限り typecheck / lint / test / production build を実行し、結果を確認する。
- 「DRYであること」より「理解しやすいこと」を優先する。
- React Compilerを使用しているため、`useCallback`・`useMemo`・`memo` による手動のメモ化は不要です。これらは使用しないでください。
- コメントアウトは必要最小限にし、コードの意図や注意点など、本当に重要な箇所にだけ記述してください。

# 2. リファクタリングの目的

このプロジェクトは機能面では既に動作しているものとして扱います。

リファクタリングでは主に以下を改善してください。

- ディレクトリ構造
- コンポーネント分割
- 関数分割
- 命名
- 責務の分離
- Server / Client boundary
- JSX / HTMLの可読性
- UIコンポーネントの選択
- Shadcn/uiの活用
- Tailwind CSSの可読性
- 共通化の適切さ
- importの明確さ
- 認知負荷
- 長期的な保守性
  機能仕様そのものを変更することが目的ではありません。

# 3. リファクタリングで変更してはいけないもの

明確な理由がない限り、以下を変更しないでください。

- APIのrequest / response仕様
- URL / route構造
- Server Function / Server Actionの外部から見た挙動
- DB schema
- validation rule
- authentication / authorization
- error handlingの意味
- loading / success / error状態の意味
- 環境変数名
- 外部サービスとの契約
- state managementの方式
- データフェッチライブラリ
- フレームワークや主要依存関係のバージョン
  必要性がある場合は、なぜ変更が必要なのかを説明してから変更すること。

# 4. ディレクトリ設計

4.1 Feature-oriented architecture

可能な限り、機能・ドメインを中心にコードを配置してください。

概念例：

```text
src/
├── main/                  # Node.js 側。DB・暗号化・HTTP 送信
│ ├── db/
│ ├── vault/
│ ├── health-check/
│ └── ipc/
│
├── preload/               # renderer と main をつなぐ窓口
│
├── shared/                # 両方から使う型・検証・定数
│ ├── constants.ts
│ ├── ipc-channels.ts
│ ├── types.ts
│ └── validation.ts
│
└── renderer/
    ├── index.html
    └── src/
        ├── components/    # 汎用 UI（ui/, form/）
        ├── hooks/
        ├── lib/
        └── features/
            ├── api-target/
            ├── health-check/
            ├── vault/
            ├── help/
            └── dashboard/
```

これは固定テンプレートではありません。

現在のコードベースの実際の責務を分析した上で、最も理解しやすい構造を選択してください。

# 5. features/ と shared/ の境界

### features

特定の機能・ドメインに固有のコードを置きます。

例：

features/api-target/
features/auth/
features/github/
features/health-check/

以下はfeatureに属する可能性があります。

- feature固有のUI
- feature固有のhooks
- feature固有のvalidation
- feature固有のserver functions
- feature固有のtypes
- feature固有のconstants

### shared

特定featureを知らなくても意味が成立するものだけを置きます。

例：

shared/components/
shared/hooks/
shared/lib/

### 禁止

- 「いつか再利用するかもしれない」という理由だけでsharedへ移動しない。
- feature-specificなコードをsharedへ移動しない。

# 6. 依存方向

基本的に以下の方向を維持してください。

```text
features
↓
shared
```

sharedからfeatureへの依存は避ける。

feature間の直接依存も原則として避ける。

もし、

feature A → feature B

が発生した場合、

- 本当にfeature間依存が必要なのか
- sharedへ移すべき純粋な機能なのか
- domainとして独立させるべきなのか
  を検討してください。

# 7. renderer / main の境界

ルーターは使わない。画面は `App.tsx` の条件レンダリングで切り替える
（解錠前はダッシュボードを描画しない、という唯一の分岐があるため）。

**機密に触る処理は必ず main に置く。**

- SQLite への読み書き
- マスターパスワードからの鍵導出と、API キーの暗号化・復号
- 対象 URL への HTTP 送信

renderer は結果だけを受け取る。平文の API キーを renderer に渡したり、
renderer から受け取って保持したりしないこと。

IPC の追加手順と戻り値の規約は ELECTRON.md を参照。

# 8. コンポーネント分割

巨大なコンポーネントを見つけた場合は分割を検討してください。

特に以下を重点的に確認します。

- JSXのネストが深い
- 1コンポーネント内に複数の明確なUI責務がある
- 条件分岐が多い
- map() の中に複雑なJSXがある
- 同じUI構造が複数存在する
- stateが多すぎる
- event handlerが大量に存在する
- classNameが極端に複雑
- server/client責務が混在している
  ただし

「ファイルが100行を超えたから分割」のような機械的ルールは使わない。

責務が分離されるかどうかを基準にする。

小さすぎるコンポーネントを大量に作って逆に追跡コストを増やさない。

# 9. 共通化のルール

共通化は積極的に検討しますが、過剰な抽象化は禁止します。

### 共通化を検討する条件

以下を満たす場合に共通化を検討してください。

- 同じ意味・責務を持つ
- 複数箇所で実際に使用されている
- 今後も同じ仕様として進化する可能性が高い
- 共通化によって呼び出し側が理解しやすくなる
  「3回同じコードがあるから共通化」のような機械的ルールは禁止。

単なる見た目の類似より、意味的な重複を重視してください。

# 10. 過剰な共通化を禁止

以下のような万能コンポーネントを作らない。

```tsx
<UniversalCard
variant="..."
compact
bordered
showIcon
showLabel
clickable
loading
...
/>
```

以下が発生する場合は、共通化しない選択肢を優先してください。

- boolean propsが大量に増える
- variantが大量に増える
- if / switchが増える
- feature-specificな条件分岐が共通コンポーネントに入る
- 共通コンポーネント本体の理解コストが利用側より高くなる
  共通化によって抽象化のためのコードが元の重複コードより複雑になるなら、共通化しない。

# 11. Shadcn/uiの活用

### 最重要

HTML / JSXが複雑な箇所では、Shadcn/uiの既存コンポーネントおよび現在インストールされていないコンポーネントを必ず候補として検討してください。

例えば、

- Badge
- Button
- Card
- Dialog
- Drawer
- DropdownMenu
- Popover
- Command
- Combobox
- Select
- Tooltip
- Tabs
- Alert
- Empty
- Skeleton
- Separator
- ScrollArea
- Sheet
  など。

現在プロジェクトにインストールされていないコンポーネントでも、UIの意味に適合する場合は導入を検討してください。

### ただし重要

「HTMLタグが多い = Shadcnに置き換える」ではありません。

Shadcn/uiはHTMLタグ数を減らすためだけに使用するものではありません。

例えば、
ｄ

```tsx
<div className="...">
```

があるだけで Card に置き換えない。

そのUIが、

- Card
- Badge
- Dialog
- Command
- Popover
- Tooltip
  などの意味・責務を持っている場合に採用してください。

### 判断基準

以下を検討してください。

- このUIは既存のShadcnコンポーネントの責務に一致するか？
- 未導入のShadcnコンポーネントを導入することでUIが明確になるか？
- JSXのネストを浅くできるか？
- accessibilityを改善できるか？
- interactionを一貫させられるか？
- 呼び出し側のコードが読みやすくなるか？
  適合しない場合は無理に使用しない。

# 12. HTML / JSXの複雑さ

以下を重点的にレビューしてください。

- 4〜5階層以上の深いネスト
- classNameが極端に長い
- 条件演算子が複数重なっている
- map() の中に巨大なJSXがある
- 同じDOM構造が繰り返されている
- accessibility属性が大量に散らばっている
- inline element / metadata / tagが大量に並んでいる
  改善方法として、

- Shadcn/ui
- 適切なcomponent分割
- データ構造の整理
- 条件分岐の整理
- 適切なsemantic HTML
  を検討してください。

# 13. Tailwind CSS

TailwindのclassNameが長いこと自体を問題としない。

ただし以下の場合は改善を検討してください。

- 同じスタイルセットが複数箇所に存在する
- classNameの条件分岐が複雑
- variant管理が必要
- classNameによってUIの責務が分かりにくくなっている
  必要に応じて、

- component化
- cva
- Shadcn/ui
- 適切なsemantic element
  を検討してください。

# 14. 命名規則

### Components

コンポーネントはPascalCase。

```text
ApiTargetCard
UserAvatar
HealthCheckResult
```

名前から「何を表示・操作するものなのか」が分かるようにする。

曖昧な名前を避ける。

- ❌ Content
- ❌ Box
- ❌ Item
- ❌ Data
- ❌ Manager
- ❌ Helper
  ただし、文脈上明確な場合は例外。

# 15. Hooks

custom hookは use + 意味のある名前。

- useApiTargets
- useGithubUser
- useHealthCheck
- useDialogState
  hookが何を提供するのかを名前から理解できるようにする。

単なるstate wrapperに意味のない名前を付けない。

# 16. IPC ハンドラ / preload の窓口

IPC の名前は、何をするのかを明確に表現する動詞 + 対象を基本とする。

- getApiTargets
- createApiTarget
- updateApiTarget
- deleteApiTarget
- ping
- unlockVault

preload のメソッド名と main のハンドラ名を揃え、`src/shared/ipc-channels.ts` の
チャンネル定数で結びつける。名前から責務が分かるようにすること。

想定内の失敗は例外ではなく `IpcResult<T>` で返す（ELECTRON.md 参照）。

# 17. Event Handler

イベントの種類だけでなく、ユーザーが何を起こすのかを名前にする。

### component内部

```tsx
const handleDeleteApiTarget = () => {};
const handleOpenSettings = () => {};
const handleSubmitForm = () => {};

onClick = { handleDeleteApiTarget };
```

### propsとして受け取るcallback

callback propは onXxx。

```tsx
type Props = {
  onDelete: () => void;
  onOpen: () => void;
  onSelect: (id: string) => void;
};
```

内部handlerと外部callbackを区別する。

### 内部関数:

```text
handleDeleteApiTarget
```

### props:

```text
onDelete
```

handleClick のように意図が不明な名前は避ける。

# 18. Stateの命名

state名は「状態そのもの」を表す。

```tsx
const [isOpen, setIsOpen] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [selectedId, setSelectedId] = useState<string>();
```

booleanには原則、

```text
is
has
can
should
```

などを使用する。

# 19. main / renderer の境界

境界を明確にする。

特に以下を確認する。

- `src/main` のコードを renderer から import しない
- Prisma 等の Node 専用依存を renderer のバンドルへ入れない
- renderer は `window.api` 経由でのみ main とやり取りする
- IPC を汎用化しない（用途ごとの名前付きメソッドだけを公開する）
- データ取得と表示責務を適切に分離する

# 20. TypeScript

TypeScriptの型安全性を維持する。

原則として、

- ❌ any
- ❌ @ts-ignore
- ❌ 不要な型assertion
- ❌ 型エラーの隠蔽
  を避ける。

型を改善する場合は、単に型を複雑にするのではなく、型からコードの意図が理解できることを優先する。

過剰なgenericやconditional typeを使わない。

# 21. Error Handling

エラー処理は既存の意味を維持する。

単純なエラーを過剰な状態管理で表現していないか確認する。

ただし、

```text
try/catch

と

throw new Error()
```

を使えば常にstate管理が不要になる、というような単純化はしない。

UIに表示する必要がある状態、retry可能な状態、validation errorなどは適切な状態として扱う。

エラーの種類と責務を明確にすることを優先する。

# 22. Import

Barrel fileを作らない。

以下は禁止。

```text
export { default } from "./Something";
export * from "./Something";
```

だけを目的とする中継ファイルを作成しない。

可能な限り、実際の定義元を直接importする。

```tsx
import { ApiTargetCard } from "@/features/api-target/components/api-target-card";
```

など。

import pathが長い場合でも、Barrel fileを作ることを第一選択にしない。

# 23. ファイル名

ファイル名は原則としてkebab-case。

```text
api-target-card.tsx
health-check-result.tsx
use-api-targets.ts
get-github-user.ts
```

exportするsymbolはPascalCase / camelCaseで適切に命名する。

# 24. UI / UX

既存UIをただコード上で整理するだけではなく、実際のユーザー体験もレビューする。

特に以下を確認する。

- 情報密度が高すぎないか
- metadataが過剰に並んでいないか
- tag / badgeが多すぎないか
- primary actionが明確か
- secondary actionが邪魔していないか
- loading stateが自然か
- empty stateが分かりやすいか
- error stateが理解しやすいか
- mobileでも破綻しないか
- keyboard accessibility
- focus state
- screen reader accessibility

# 25. 「見た目を綺麗にする」だけの変更を避ける

UIを変更する場合、

「モダンだから」
「見た目が綺麗だから」

だけを理由に変更しない。

変更によって、

- hierarchyが明確になる
- 操作性が向上する
- 情報の発見性が向上する
- 認知負荷が下がる
- accessibilityが改善する
  などの明確なメリットがあることを確認する。

# 26. 既存コードを尊重する

既に動作しているコードを最初から作り直さない。

リファクタリング前に、

- 現在の構造
- データフロー
- state
- server/client boundary
- 外部API
- UI責務
- component dependencies
  を理解する。

理解せずにファイルを大量移動しない。

# 27. 変更の粒度

一度に大量の変更を行う場合でも、責務ごとに整理する。

例えば、

1. directory structure
2. component extraction
3. naming
4. Shadcn integration
5. shared abstraction
6. cleanup

のように論理的に変更する。

変更によって発生したエラーと、元から存在していたエラーを区別する。

# 28. 未インストールのライブラリ・コンポーネント

既存packageに存在しないライブラリやShadcn/ui componentが必要だと判断した場合、勝手に大量導入しない。

まず、

- 本当に必要か
- 標準APIで解決できないか
- 既存dependencyで解決できないか
- Shadcn/uiに適切なcomponentがあるか
  を検討する。

導入する場合は、導入理由を明確にする。

# 29. Validation

変更後、可能な限り以下を実行する。

```text
pnpm typecheck   # main / renderer 両方
pnpm lint        # biome
pnpm build       # electron-vite build
```

プロジェクトに存在するscriptに合わせて実行する。

存在しないscriptを無理に実行しない（テストは未整備）。

禁止

エラーを、

```text
@ts-ignore
eslint-disable
biome-ignore
any
```

などで隠して「成功」と判断しない。

# 30. 完了条件

リファクタリング完了時には、以下を確認する。

### Architecture

- featureとsharedの責務が明確
- 不要なfeature間依存がない
- routesが過度に肥大化していない
- server/client boundaryが明確

### Components

- 巨大componentが適切に分割されている
- 小さすぎるcomponentを大量に作っていない
- component名から責務が理解できる

### Reuse

- 本当に共有すべきコードは共通化されている
- 過剰な共通化をしていない
- 万能componentを作っていない
- utils/helpersのゴミ箱化をしていない

### UI

- 複雑なHTML/JSXをレビューした
- Shadcn/uiの既存componentを検討した
- 未導入のShadcn/ui componentも必要に応じて検討した
- accessibilityを確認した
- UI hierarchyを確認した

### Naming

- component naming
- hook naming
- server function naming
- event handler naming
- callback prop naming
  が一貫している。

### Quality

- typecheck
- lint
- test（存在する場合）
- production build
  を確認した。

# 31. State Management

状態管理ライブラリは、状態の性質に応じて適切に使い分けてください。

## TanStack Query

サーバー由来の状態（Server State）は、原則として TanStack Query を第一候補とします。

例えば、

- APIから取得したデータ
- DB由来のデータ
- キャッシュ可能なリモートデータ
- loading / error / stale / refetch が存在するデータ
- mutation後にinvalidate / refetchが必要なデータ
  など。

以下のような状態をZustandに保存して、手動でloadingやcacheを管理することは避けてください。

```text
❌ ZustandでAPIレスポンスを保持
❌ ZustandでisLoadingを管理
❌ Zustandでfetch結果のcacheを独自実装
```

# 32. 最終的な判断基準

迷った場合は、以下の優先順位で判断してください。

```text
人間の理解しやすさ
↓
責務の明確さ
↓
UI / UX
↓
保守性
↓
再利用性
↓
コード量の削減
```

コードを短くすることは目的ではありません。

最終的な目的は、

「このコードが何をしているのかを、人間が最小限の認知負荷で理解できること」

です。

AIにとって美しいコードではなく、人間にとって説明可能なコードを作ってください。

# 32. Function Style

関数は原則としてアロー関数で記述してください。

```tsx
const getUser = async () => {
  // ...
};

const handleSubmit = () => {
  // ...
};

const formatDate = (date: Date) => {
  // ...
};
```
