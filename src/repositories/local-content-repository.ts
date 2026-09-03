import type { EducationContent, EducationContentDraft } from "@/types/content";
import { generateId } from "@/lib/id";
import type { ContentRepository } from "./content-repository";

const STORAGE_KEY = "ecm.education-contents.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): EducationContent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EducationContent[];
  } catch {
    return [];
  }
}

function writeAll(items: EducationContent[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // 同一タブ内の他コンポーネントへも変更を伝える（storageイベントは他タブのみ発火するため）
  window.dispatchEvent(new CustomEvent("ecm:contents-changed"));
}

function now(): string {
  return new Date().toISOString();
}

/**
 * MVP用のローカルストレージ実装。
 * Repository インターフェースに従うので、UI 側は保存方式を意識しない。
 */
export class LocalContentRepository implements ContentRepository {
  async list(options?: { includeArchived?: boolean }): Promise<EducationContent[]> {
    const items = readAll();
    if (options?.includeArchived) return items;
    return items.filter((item) => !item.archivedAt);
  }

  async get(id: string): Promise<EducationContent | null> {
    const items = readAll();
    return items.find((item) => item.id === id) ?? null;
  }

  async create(draft: EducationContentDraft): Promise<EducationContent> {
    const items = readAll();
    const timestamp = now();
    const created: EducationContent = {
      ...draft,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    };
    writeAll([created, ...items]);
    return created;
  }

  async update(id: string, draft: Partial<EducationContentDraft>): Promise<EducationContent> {
    const items = readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("指定されたコンテンツが見つかりません。");
    }
    const current = items[index]!;
    const updated: EducationContent = {
      ...current,
      ...draft,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: now(),
      archivedAt: current.archivedAt,
    };
    const next = [...items];
    next[index] = updated;
    writeAll(next);
    return updated;
  }

  async duplicate(id: string): Promise<EducationContent> {
    const source = await this.get(id);
    if (!source) throw new Error("複製元のコンテンツが見つかりません。");
    const items = readAll();
    const timestamp = now();
    const copy: EducationContent = {
      ...source,
      id: generateId(),
      title: `${source.title}（コピー）`,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    };
    writeAll([copy, ...items]);
    return copy;
  }

  async archive(id: string): Promise<void> {
    const items = readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const next = [...items];
    next[index] = { ...next[index]!, archivedAt: now(), updatedAt: now() };
    writeAll(next);
  }

  async restore(id: string): Promise<void> {
    const items = readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const next = [...items];
    next[index] = { ...next[index]!, archivedAt: null, updatedAt: now() };
    writeAll(next);
  }

  async hardDelete(id: string): Promise<void> {
    const items = readAll();
    writeAll(items.filter((item) => item.id !== id));
  }

  async exportAll(): Promise<EducationContent[]> {
    return readAll();
  }

  async replaceAll(items: EducationContent[]): Promise<void> {
    writeAll(items);
  }

  async bulkCreate(drafts: EducationContentDraft[]): Promise<EducationContent[]> {
    const items = readAll();
    const timestamp = now();
    const created = drafts.map((draft) => ({
      ...draft,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    }));
    writeAll([...created, ...items]);
    return created;
  }
}

export const localContentRepository = new LocalContentRepository();
