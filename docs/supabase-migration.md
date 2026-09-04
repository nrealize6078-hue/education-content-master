# 他のPCからも使えるようにする手順（Supabase／ログイン制）

この手順を行うと、**許可したアカウントだけ**がログインして、
どのPC・スマホからでも同じデータを見られるようになります。

設定しないあいだは、これまでどおりブラウザ内保存で動きます。
途中でやめても、いまのデータが消えることはありません。

所要時間の目安：**30分ほど**。費用は無料枠の範囲で足ります。

---

## 全体の流れ

1. Supabaseでプロジェクトを作る
2. 表（テーブル）を作る ← SQLを貼り付けて実行するだけ
3. 使う人のアカウントを作る
4. 使う人を許可一覧に載せる
5. 接続先をGitHubに登録する
6. いまのデータをサーバーへ移す

---

## 1. Supabaseでプロジェクトを作る

1. https://supabase.com/dashboard を開き、GitHubアカウントなどでサインイン
2. **New project** を押す
3. 次のとおり入力する
   - **Name**：`education-content-master`
   - **Database Password**：自動生成のものをコピーして、**社内の安全な場所に保管**
     （※このパスワードはアプリでは使いませんが、後で必要になることがあります）
   - **Region**：`Northeast Asia (Tokyo)`
4. **Create new project** を押し、準備が終わるまで2〜3分待つ

---

## 2. 表（テーブル）を作る

1. 左メニューの **SQL Editor** を開く
2. **New query** を押す
3. このリポジトリの [`supabase/schema.sql`](../supabase/schema.sql) の中身を**すべて**コピーして貼り付ける
4. **Run** を押す
5. `Success. No rows returned` と出れば完了

> このSQLは、同じものを何度実行しても壊れないように書いてあります。
> あとで作り直したくなったら、もう一度実行して構いません。

---

## 3. 使う人のアカウントを作る

**まず、勝手に登録できないようにします。**

1. 左メニューの **Authentication** ＞ **Sign In / Providers**
2. **Email** を開き、**Allow new users to sign up** を **オフ**にして保存

**次に、使う人を1人ずつ登録します。**

1. **Authentication** ＞ **Users** ＞ **Add user** ＞ **Create new user**
2. メールアドレスと、最初のパスワードを入れる
3. **Auto Confirm User** を**オン**にする（確認メールを省けます）
4. **Create user** を押す
5. 本人にメールアドレスと最初のパスワードを伝える

> パスワードは、本人がログイン画面の「パスワードを忘れた」から変更できます。

---

## 4. 使う人を許可一覧に載せる

アカウントを作っただけでは、まだ中身は見えません。
**allowed_users** に載っている人だけが使えます。

1. **SQL Editor** で次を実行する（アドレスは実際のものに書き換える）

```sql
insert into public.allowed_users (email, role, note) values
  ('n.realize6078@gmail.com', 'editor', '管理者'),
  ('example@realizeclub.net', 'editor', '営業部'),
  ('viewer@realizeclub.net',  'viewer', '閲覧のみ')
on conflict (email) do update set role = excluded.role;
```

- `editor` … 追加・変更・削除ができる
- `viewer` … 見るだけ（変更しようとするとサーバー側で拒否されます）

**使えなくしたいとき**は、その行を消します。

```sql
delete from public.allowed_users where email = 'example@realizeclub.net';
```

> 一覧は **Table Editor** ＞ `allowed_users` からも編集できます。

---

## 5. 接続先を登録する

**値の場所**：Supabase ＞ 左下の **Project Settings** ＞ **API**

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys** の **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> `service_role` のキーは**絶対に使わないでください**。あれを公開すると、
> 誰でも全データを読み書きできてしまいます。

### 公開サイト（GitHub Pages）に登録する

1. https://github.com/nrealize6078-hue/education-content-master を開く
2. **Settings** ＞ **Secrets and variables** ＞ **Actions** ＞ **Variables** タブ
3. **New repository variable** で2つ登録する
   - Name `NEXT_PUBLIC_SUPABASE_URL` / Value：上のProject URL
   - Name `NEXT_PUBLIC_SUPABASE_ANON_KEY` / Value：上のanon public
4. **Actions** タブ ＞ **Deploy to GitHub Pages** ＞ **Run workflow** で再公開

再公開が終わると、サイトを開いたときにログイン画面が出るようになります。

### 手元で試す場合

このフォルダに `.env.local` を作り、次のように書きます（値は実際のもの）。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## 6. いまのデータをサーバーへ移す

1. ログインする
2. 上のメニューの **バックアップ** を開く
3. 「このブラウザに残っているデータをサーバーへ移す」の
   **「◯件をサーバーへ移す」** を押す

> すでにサーバーにある教材は消えません。二重に登録されないよう、
> **1台のPCからだけ**実行してください。

移し終えたら、他のPCでも同じアドレスを開いてログインすれば、同じデータが見えます。

---

## よくあるつまずき

| 症状 | 原因と対処 |
|---|---|
| ログイン画面が出ない | 手順5の登録がまだか、再公開していない |
| 「メールアドレスかパスワードが違います」 | Supabase ＞ Authentication ＞ Users にそのアドレスがあるか確認 |
| 「このアカウントは許可されていません」 | 手順4の `allowed_users` への追加がまだ |
| 変更しようとすると権限エラー | そのアカウントが `viewer` になっている |
| 一覧が空のまま | 手順6のデータ移行がまだ |

---

## 元に戻したいとき

GitHubの **Variables** に登録した2つを削除して再公開すれば、
ブラウザ内保存の状態に戻ります。Supabase側のデータはそのまま残ります。

---

## 補足：公開範囲について

- サイトのURLを知っていれば**ページ自体は誰でも開けます**が、
  ログインしない限り中身は何も見えません。
- 検索エンジンには載らない設定にしてあります。
- 「ページの存在ごと隠したい」場合は、公開先をGitHub Pages以外に
  移す必要があります（別途ご相談ください）。
