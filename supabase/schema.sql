-- =====================================================================
-- 教育コンテンツMASTER — Supabase スキーマ（新規プロジェクト用）
--
-- ⚠ このSQLはまだ実行していません。
--   Supabaseの管理画面（SQL Editor）に貼り付けて実行してください。
--   手順は docs/supabase-migration.md を参照してください。
--
-- 方針：
--   ・ログインしていない人は何も読めない・書けない
--   ・ログインしていても、許可一覧（allowed_users）に載っていない人は
--     何も読めない・書けない
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. 許可するアカウントの一覧
-- ---------------------------------------------------------------------
create table if not exists public.allowed_users (
  email text primary key,
  -- editor = 追加・変更・削除まで / viewer = 見るだけ
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.allowed_users enable row level security;

-- メールアドレスは大文字小文字を区別せずに突き合わせる
create or replace function public.ecm_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.allowed_users
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

create or replace function public.ecm_can_read()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.ecm_current_role() is not null
$$;

create or replace function public.ecm_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.ecm_current_role() = 'editor'
$$;

-- 関数は「ログイン済みの人」だけが呼べるようにする
revoke execute on function public.ecm_current_role() from public, anon;
revoke execute on function public.ecm_can_read() from public, anon;
revoke execute on function public.ecm_can_write() from public, anon;
grant execute on function public.ecm_current_role() to authenticated;
grant execute on function public.ecm_can_read() to authenticated;
grant execute on function public.ecm_can_write() to authenticated;

-- 許可一覧そのものは、許可された人が自分の行だけ見られれば十分。
-- 追加・削除はSupabaseの管理画面から行う（アプリからは変更させない）。
drop policy if exists allowed_users_select_self on public.allowed_users;
create policy allowed_users_select_self
  on public.allowed_users
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));


-- ---------------------------------------------------------------------
-- 2. 教材の本体
-- ---------------------------------------------------------------------
create table if not exists public.education_contents (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  summary text not null default '',

  -- 分類は「大項目 ＞ 中項目 ＞ 小項目」の3階層。
  -- 中項目・小項目は未設定を許容する（勝手に補完しない）。
  major_category text not null default '分類待ち',
  -- 主の大項目に加えて、横断して所属させる大項目
  additional_major_categories text[] not null default '{}',
  middle_category text not null default '',
  small_category text not null default '',

  audience text[] not null default '{}',
  tags text[] not null default '{}',

  source_url text not null default '',
  storage_location text not null default '',

  material_format text not null default '未確認',
  status text not null default '未着手',
  progress integer not null default 0 check (progress between 0 and 100),
  priority text not null default '未設定',
  owner text not null default '',
  canonical_status text not null default '未確認',

  missing_items text not null default '',
  next_action text not null default '',
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- 既に作ってあるテーブルに後から列を足す場合の保険
alter table public.education_contents
  add column if not exists additional_major_categories text[] not null default '{}';

-- 値の揺れを防ぐための制約（アプリ側の選択肢と一致させること）
alter table public.education_contents
  drop constraint if exists education_contents_status_check;
alter table public.education_contents
  add constraint education_contents_status_check
  check (status in ('未着手', '整理中', '制作中', '要修正', '要更新', '完成', '保留'));

alter table public.education_contents
  drop constraint if exists education_contents_priority_check;
alter table public.education_contents
  add constraint education_contents_priority_check
  check (priority in ('最優先', '高', '中', '低', '未設定'));

alter table public.education_contents
  drop constraint if exists education_contents_canonical_check;
alter table public.education_contents
  add constraint education_contents_canonical_check
  check (canonical_status in ('最新版・正本', '参考資料', '旧版', '未確認'));

-- 検索・絞り込み用のインデックス
create index if not exists education_contents_major_idx
  on public.education_contents (major_category);
create index if not exists education_contents_extra_major_idx
  on public.education_contents using gin (additional_major_categories);
create index if not exists education_contents_middle_idx
  on public.education_contents (middle_category);
create index if not exists education_contents_status_idx
  on public.education_contents (status);
create index if not exists education_contents_updated_idx
  on public.education_contents (updated_at desc);
create index if not exists education_contents_archived_idx
  on public.education_contents (archived_at);
create index if not exists education_contents_tags_idx
  on public.education_contents using gin (tags);

-- updated_at を自動更新する
create or replace function public.ecm_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists education_contents_set_updated_at on public.education_contents;
create trigger education_contents_set_updated_at
  before update on public.education_contents
  for each row execute function public.ecm_set_updated_at();

alter table public.education_contents enable row level security;

drop policy if exists education_contents_select on public.education_contents;
create policy education_contents_select
  on public.education_contents
  for select
  to authenticated
  using (public.ecm_can_read());

drop policy if exists education_contents_insert on public.education_contents;
create policy education_contents_insert
  on public.education_contents
  for insert
  to authenticated
  with check (public.ecm_can_write());

drop policy if exists education_contents_update on public.education_contents;
create policy education_contents_update
  on public.education_contents
  for update
  to authenticated
  using (public.ecm_can_write())
  with check (public.ecm_can_write());

drop policy if exists education_contents_delete on public.education_contents;
create policy education_contents_delete
  on public.education_contents
  for delete
  to authenticated
  using (public.ecm_can_write());


-- ---------------------------------------------------------------------
-- 3. アプリの設定（大項目・中項目・小項目の並び順など）
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.ecm_set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select
  on public.app_settings
  for select
  to authenticated
  using (public.ecm_can_read());

drop policy if exists app_settings_write on public.app_settings;
create policy app_settings_write
  on public.app_settings
  for all
  to authenticated
  using (public.ecm_can_write())
  with check (public.ecm_can_write());


-- ---------------------------------------------------------------------
-- 4. 最初の管理者を登録する
--    ↓ のメールアドレスを、実際に使うアドレスに書き換えてから実行してください。
-- ---------------------------------------------------------------------
-- insert into public.allowed_users (email, role, note)
-- values ('n.realize6078@gmail.com', 'editor', '管理者')
-- on conflict (email) do nothing;
