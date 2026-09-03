# Supabase移行手順（未実行）

このMVPは**ブラウザのローカルストレージだけ**でデータを保存しています。
Supabaseへはまだ一度も接続しておらず、SQLも実行していません。

移行するかどうかはユーザーの判断です。以下は「やるとしたらこの手順」というメモです。

---

## いまの状態

| 項目 | 状態 |
|---|---|
| データの保存先 | ブラウザのローカルストレージ（`ecm.education-contents.v1`） |
| Supabaseへの接続 | **していない** |
| `supabase/schema.sql` の実行 | **していない**（設計だけ作成済み） |
| `.env` | **作成も上書きもしていない**（`.env.example` のみ用意） |

データはブラウザごとに保存されるため、**別のPCや別のブラウザとは共有されません**。
複数人で同じデータを見たくなった時が、Supabaseへ移行するタイミングです。

---

## 移行するときの手順

### 1. Supabaseプロジェクトを用意する

既存の `realize-quest` プロジェクトを使うか、新規に作るかを決めます。

> 既存プロジェクトを共用する場合は、テーブル名の衝突を避けるため
> 接頭辞を付けた `ecm_education_contents` などに変更することを検討してください。

### 2. テーブルを作る

`supabase/schema.sql` の内容を Supabase の SQL Editor に貼り付けて実行します。

**先に確認してほしいこと**
- 既存テーブルと名前が衝突していないか
- 行レベルセキュリティ（RLS）のポリシーをどうするか
  （schema.sql では RLS を有効化しただけで、ポリシーは意図的に未作成にしています。
  このままだとアプリから読み書きできません）

### 3. 環境変数を設定する

`.env.example` をコピーして `.env.local` を作り、値を入れます。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（anonキー）
```

### 4. ライブラリを入れる

```bash
npm install @supabase/supabase-js
```

### 5. リポジトリ実装を書く

`src/repositories/supabase-content-repository.ts` は現在スタブ（呼ぶとエラーになる）です。
`ContentRepository` インターフェースに沿って、`education_contents` テーブルへの
CRUDを実装します。

列名の対応は以下のとおりです（アプリはキャメルケース、DBはスネークケース）。

| アプリ側 | DB側 |
|---|---|
| `majorCategory` | `major_category` |
| `middleCategory` | `middle_category` |
| `smallCategory` | `small_category` |
| `sourceUrl` | `source_url` |
| `storageLocation` | `storage_location` |
| `materialFormat` | `material_format` |
| `canonicalStatus` | `canonical_status` |
| `missingItems` | `missing_items` |
| `nextAction` | `next_action` |
| `createdAt` / `updatedAt` / `archivedAt` | `created_at` / `updated_at` / `archived_at` |

### 6. 切り替える

`src/features/contents/content-store.tsx` の先頭にある1行だけを差し替えます。

```ts
// 変更前
const repository: ContentRepository = localContentRepository;

// 変更後
const repository: ContentRepository = new SupabaseContentRepository();
```

UI側のコードは変更不要です。

### 7. 既存データを移す

1. アプリの「バックアップ」画面から **JSONバックアップを書き出す**
2. Supabaseへ切り替える
3. 「バックアップ」画面から復元、または JSON を SQL に変換して直接投入

---

## 禁止事項（重要）

以下は**ユーザーの明示的な許可なしに行いません**。

- 本番Supabaseへの接続
- 本番SQLの実行
- `.env` の作成・上書き
- 認証情報の表示
- 本番データの変更・削除
