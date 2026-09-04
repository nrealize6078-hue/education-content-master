import type { EducationContent, EducationContentDraft } from "@/types/content";
import type {
  Audience,
  CanonicalStatus,
  ContentPriority,
  ContentStatus,
  MaterialFormat,
} from "@/types/content";
import { getSupabase, toJapaneseError } from "@/lib/supabase";
import type { ContentRepository } from "./content-repository";

const TABLE = "education_contents";

/** データベースの列名（スネークケース）とアプリ側の項目名の対応 */
type Row = {
  id: string;
  title: string;
  summary: string;
  major_category: string;
  additional_major_categories: string[] | null;
  middle_category: string;
  small_category: string;
  audience: string[] | null;
  tags: string[] | null;
  source_url: string;
  storage_location: string;
  material_format: string;
  status: string;
  progress: number;
  priority: string;
  owner: string;
  canonical_status: string;
  missing_items: string;
  next_action: string;
  notes: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

function toContent(row: Row): EducationContent {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    majorCategory: row.major_category ?? "",
    additionalMajorCategories: row.additional_major_categories ?? [],
    middleCategory: row.middle_category ?? "",
    smallCategory: row.small_category ?? "",
    audience: (row.audience ?? []) as Audience[],
    tags: row.tags ?? [],
    sourceUrl: row.source_url ?? "",
    storageLocation: row.storage_location ?? "",
    materialFormat: (row.material_format ?? "未確認") as MaterialFormat,
    status: (row.status ?? "未着手") as ContentStatus,
    progress: row.progress ?? 0,
    priority: (row.priority ?? "未設定") as ContentPriority,
    owner: row.owner ?? "",
    canonicalStatus: (row.canonical_status ?? "未確認") as CanonicalStatus,
    missingItems: row.missing_items ?? "",
    nextAction: row.next_action ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

/** 指定された項目だけを列名に置き換える（部分更新に使う） */
function toRow(draft: Partial<EducationContentDraft>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined) row[key] = value;
  };
  put("title", draft.title);
  put("summary", draft.summary);
  put("major_category", draft.majorCategory);
  put("additional_major_categories", draft.additionalMajorCategories);
  put("middle_category", draft.middleCategory);
  put("small_category", draft.smallCategory);
  put("audience", draft.audience);
  put("tags", draft.tags);
  put("source_url", draft.sourceUrl);
  put("storage_location", draft.storageLocation);
  put("material_format", draft.materialFormat);
  put("status", draft.status);
  put("progress", draft.progress);
  put("priority", draft.priority);
  put("owner", draft.owner);
  put("canonical_status", draft.canonicalStatus);
  put("missing_items", draft.missingItems);
  put("next_action", draft.nextAction);
  put("notes", draft.notes);
  return row;
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("サーバーへの接続が設定されていません。");
  return supabase;
}

function fail(error: unknown, fallback: string): never {
  throw new Error(toJapaneseError(error, fallback));
}

/** 件数が多いときに分割して送る（1回のリクエストが大きすぎると失敗するため） */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Supabase（サーバー保存）版。
 * 誰が読み書きできるかはサーバー側のRLSで決まるので、ここでは判定しない。
 */
export class SupabaseContentRepository implements ContentRepository {
  private async fetchAll(): Promise<EducationContent[]> {
    const rows: Row[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await client()
        .from(TABLE)
        .select("*")
        .order("updated_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) fail(error, "データを読み込めませんでした。");
      const page = (data ?? []) as Row[];
      rows.push(...page);
      if (page.length < pageSize) break;
    }
    return rows.map(toContent);
  }

  async list(options?: { includeArchived?: boolean }): Promise<EducationContent[]> {
    const items = await this.fetchAll();
    if (options?.includeArchived) return items;
    return items.filter((item) => !item.archivedAt);
  }

  async get(id: string): Promise<EducationContent | null> {
    const { data, error } = await client().from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "データを読み込めませんでした。");
    return data ? toContent(data as Row) : null;
  }

  async create(draft: EducationContentDraft): Promise<EducationContent> {
    const { data, error } = await client().from(TABLE).insert(toRow(draft)).select().single();
    if (error) fail(error, "登録できませんでした。");
    return toContent(data as Row);
  }

  async update(id: string, draft: Partial<EducationContentDraft>): Promise<EducationContent> {
    const { data, error } = await client()
      .from(TABLE)
      .update(toRow(draft))
      .eq("id", id)
      .select()
      .single();
    if (error) fail(error, "変更を保存できませんでした。");
    return toContent(data as Row);
  }

  async duplicate(id: string): Promise<EducationContent> {
    const source = await this.get(id);
    if (!source) throw new Error("複製元のコンテンツが見つかりません。");
    const { id: _id, createdAt, updatedAt, archivedAt, ...draft } = source;
    void _id;
    void createdAt;
    void updatedAt;
    void archivedAt;
    return this.create({ ...draft, title: `${source.title}（コピー）` });
  }

  async archive(id: string): Promise<void> {
    const { error } = await client()
      .from(TABLE)
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) fail(error, "アーカイブできませんでした。");
  }

  async restore(id: string): Promise<void> {
    const { error } = await client().from(TABLE).update({ archived_at: null }).eq("id", id);
    if (error) fail(error, "アーカイブから戻せませんでした。");
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await client().from(TABLE).delete().eq("id", id);
    if (error) fail(error, "削除できませんでした。");
  }

  async exportAll(): Promise<EducationContent[]> {
    return this.fetchAll();
  }

  async replaceAll(items: EducationContent[]): Promise<void> {
    // 既存を消してから入れ直す。途中で失敗すると欠けるため、
    // 復元前にバックアップを取るよう画面側で案内している。
    const { error } = await client().from(TABLE).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) fail(error, "既存データを消せませんでした。");
    await this.bulkCreate(items);
  }

  async bulkCreate(drafts: EducationContentDraft[]): Promise<EducationContent[]> {
    const created: EducationContent[] = [];
    for (const part of chunk(drafts, 200)) {
      const { data, error } = await client()
        .from(TABLE)
        .insert(part.map((d) => toRow(d)))
        .select();
      if (error) fail(error, "まとめて登録できませんでした。");
      created.push(...((data ?? []) as Row[]).map(toContent));
    }
    return created;
  }

  async bulkUpdate(ids: string[], patch: Partial<EducationContentDraft>): Promise<void> {
    if (ids.length === 0) return;
    for (const part of chunk(ids, 200)) {
      const { error } = await client().from(TABLE).update(toRow(patch)).in("id", part);
      if (error) fail(error, "まとめて変更できませんでした。");
    }
  }

  async bulkArchive(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const timestamp = new Date().toISOString();
    for (const part of chunk(ids, 200)) {
      const { error } = await client()
        .from(TABLE)
        .update({ archived_at: timestamp })
        .in("id", part);
      if (error) fail(error, "まとめてアーカイブできませんでした。");
    }
  }

  async bulkHardDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    for (const part of chunk(ids, 200)) {
      const { error } = await client().from(TABLE).delete().in("id", part);
      if (error) fail(error, "まとめて削除できませんでした。");
    }
  }
}

export const supabaseContentRepository = new SupabaseContentRepository();
