-- =====================================================================
-- 教育コンテンツMASTER — Supabase スキーマ設計（未実行）
--
-- ⚠ このSQLはまだ実行していません。
--   本番Supabaseへの適用は、ユーザーが内容を確認し、許可を出してから行います。
--   適用手順は docs/supabase-migration.md を参照してください。
-- =====================================================================

create table if not exists public.education_contents (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  summary text not null default '',

  -- 分類は「大項目 ＞ 中項目 ＞ 小項目」の3階層。
  -- 中項目・小項目は未設定を許容する（勝手に補完しない）。
  major_category text not null default '分類待ち',
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

-- 値の揺れを防ぐための制約（アプリ側の選択肢と一致させること）
alter table public.education_contents
  drop constraint if exists education_contents_status_check;
alter table public.education_contents
  add constraint education_contents_status_check
  check (status in ('未着手', '整理中', '制作中', '要修正', '完成', '保留'));

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
create or replace function public.set_updated_at()
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
  for each row execute function public.set_updated_at();

-- 行レベルセキュリティ。
-- 誰がアクセスできるかは運用方針が決まってから設定するため、
-- 既定では有効化のみ行い、ポリシーは意図的に未作成にしてある。
alter table public.education_contents enable row level security;

-- 例）ログイン済みユーザーに全権限を与える場合（適用は要判断）
-- create policy "authenticated_full_access"
--   on public.education_contents
--   for all
--   to authenticated
--   using (true)
--   with check (true);
