# 教育コンテンツMASTER

REALIZE OSの知識・教材・資料を、ひとつに。

PDF・動画・スライド・営業台本・マニュアル・Web教材などが、PC／Googleドライブ／Canva／社内サーバーに
点在している状態を解消するための管理ツールです。
検索して現在地と不足を確認し、次の制作作業を決めるための基盤として使います。

---

## 起動方法

```bash
cd C:\Users\realize5\Documents\Claude\education-content-master
npm install     # 初回のみ
npm run dev
```

ブラウザで **http://localhost:4300** を開きます。

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動（ポート4300） |
| `npm run build` | 本番ビルド |
| `npm start` | ビルド済みのものを起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScriptの型チェック |

---

## 画面

| パス | 画面 |
|---|---|
| `/` | ホーム（集計・検索・一覧） |
| `/contents/new` | 新しい教材を登録 |
| `/contents/[id]` | 詳細 |
| `/contents/[id]/edit` | 編集 |
| `/import` | CSV取り込み・CSV書き出し |
| `/backup` | JSONバックアップ・復元 |
| `/archive` | アーカイブ一覧 |

---

## 分類は3階層

```
大項目 ＞ 中項目 ＞ 小項目
```

- **大項目**は選択式（不動産／保険／営業／人生支援／REALIZE CLUB／LMP／LIFE ACADEMY／システム・AI／その他／分類待ち）
- **中項目・小項目**は自由入力。大項目に応じた候補ボタンも出しますが、選ばなくても構いません
- 分からない階層は **「未設定」のまま**にできます。勝手に埋めません

新規登録の必須項目は **タイトル** と **大項目** の2つだけです。

---

## データの保存先

MVPでは **ブラウザのローカルストレージ**（キー：`ecm.education-contents.v1`）に保存しています。

- 画面を再読み込みしてもデータは残ります
- **別のPC・別のブラウザとは共有されません**
- 定期的に `/backup` からJSONを書き出して保管してください

保存処理は `src/repositories/` に分離してあるため、
将来Supabaseへ切り替える際もUI側のコードは変更不要です。
手順は [`docs/supabase-migration.md`](docs/supabase-migration.md) を参照してください。

> Supabaseへは**まだ一度も接続しておらず、SQLも実行していません**。

---

## 削除について

2種類あります。

| 操作 | 内容 |
|---|---|
| **アーカイブ** | 通常の一覧から外すだけ。`/archive` からいつでも戻せます |
| **完全に削除** | 管理情報を消します。確認画面を経由し、元に戻せません |

どちらの操作でも、**リンク先のGoogleドライブ・Canva・YouTube・PC内の元ファイルは削除されません**。
このツールが持っているのは管理情報だけです。

---

## フォルダ構成

```
src/
├─ app/                     画面（App Router）
├─ components/              共通UI（ボタン・バッジ・モーダルなど）
├─ features/contents/       教育コンテンツ機能一式
├─ repositories/            データアクセス層（localStorage / Supabase）
├─ types/                   型定義
└─ lib/                     CSV・検索正規化・日付などの小道具
supabase/schema.sql         Supabase用スキーマ（未実行）
docs/supabase-migration.md  移行手順
```

---

## 技術構成

Next.js 15（App Router）／TypeScript／Tailwind CSS 4／ESLint

外部ライブラリは最小限です。CSVの解析・書き出し、ID生成、検索用の文字正規化は
すべて自前の小さな実装（`src/lib/`）で済ませており、追加の依存はありません。
