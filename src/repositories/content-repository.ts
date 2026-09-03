import type { EducationContent, EducationContentDraft } from "@/types/content";

/**
 * データアクセスの抽象インターフェース。
 * MVPは LocalContentRepository（localStorage）を使う。
 * 将来 Supabase に切り替える際は SupabaseContentRepository を実装して差し替えるだけでよい。
 */
export interface ContentRepository {
  /** アーカイブ済みを含む／含まないコンテンツ一覧を取得する */
  list(options?: { includeArchived?: boolean }): Promise<EducationContent[]>;
  get(id: string): Promise<EducationContent | null>;
  create(draft: EducationContentDraft): Promise<EducationContent>;
  update(id: string, draft: Partial<EducationContentDraft>): Promise<EducationContent>;
  duplicate(id: string): Promise<EducationContent>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  /** 完全削除。元に戻せない。 */
  hardDelete(id: string): Promise<void>;
  /** JSONバックアップとして全件（アーカイブ含む）を取得する */
  exportAll(): Promise<EducationContent[]>;
  /** JSON復元。既存データを丸ごと置き換える。 */
  replaceAll(items: EducationContent[]): Promise<void>;
  /** CSVインポートなどでまとめて追加登録する */
  bulkCreate(drafts: EducationContentDraft[]): Promise<EducationContent[]>;
}
