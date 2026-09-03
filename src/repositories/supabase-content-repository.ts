import type { EducationContent } from "@/types/content";
import type { ContentRepository } from "./content-repository";

/**
 * Supabase移行用のスタブ実装。
 *
 * 現時点では未接続・未使用。本番Supabaseへの接続・書き込みは行わない。
 * 接続を有効化する手順は docs/supabase-migration.md を参照。
 *
 * 有効化する場合は、ここで @supabase/supabase-js をインポートし、
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を使って
 * クライアントを生成し、`education_contents` テーブル（supabase/schema.sql）
 * に対して CRUD を実装する。ユーザーの明示的な許可なしに有効化しないこと。
 */
export class SupabaseContentRepository implements ContentRepository {
  constructor() {
    throw new Error(
      "SupabaseContentRepository はまだ有効化されていません。" +
        "docs/supabase-migration.md の手順に従い、ユーザーの許可を得てから接続してください。"
    );
  }

  list(): Promise<EducationContent[]> {
    throw new Error("not implemented");
  }
  get(): Promise<EducationContent | null> {
    throw new Error("not implemented");
  }
  create(): Promise<EducationContent> {
    throw new Error("not implemented");
  }
  update(): Promise<EducationContent> {
    throw new Error("not implemented");
  }
  duplicate(): Promise<EducationContent> {
    throw new Error("not implemented");
  }
  archive(): Promise<void> {
    throw new Error("not implemented");
  }
  restore(): Promise<void> {
    throw new Error("not implemented");
  }
  hardDelete(): Promise<void> {
    throw new Error("not implemented");
  }
  exportAll(): Promise<EducationContent[]> {
    throw new Error("not implemented");
  }
  replaceAll(): Promise<void> {
    throw new Error("not implemented");
  }
  bulkCreate(): Promise<EducationContent[]> {
    throw new Error("not implemented");
  }
}
