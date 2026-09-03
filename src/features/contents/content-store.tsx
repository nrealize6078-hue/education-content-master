"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { localContentRepository } from "@/repositories/local-content-repository";
import type { ContentRepository } from "@/repositories/content-repository";
import type { EducationContent, EducationContentDraft } from "@/types/content";

/**
 * MVPで使うリポジトリはここ1か所で決まる。
 * Supabaseへ移行する際は、この定数を差し替えるだけでUI側の変更は不要。
 */
const repository: ContentRepository = localContentRepository;

type Toast = { id: string; message: string; tone: "success" | "error" };

type ContentStoreValue = {
  contents: EducationContent[];
  archived: EducationContent[];
  loading: boolean;
  reload: () => Promise<void>;
  create: (draft: EducationContentDraft) => Promise<EducationContent>;
  update: (id: string, draft: Partial<EducationContentDraft>) => Promise<EducationContent>;
  duplicate: (id: string) => Promise<EducationContent>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  hardDelete: (id: string) => Promise<void>;
  bulkCreate: (drafts: EducationContentDraft[]) => Promise<EducationContent[]>;
  exportAll: () => Promise<EducationContent[]>;
  replaceAll: (items: EducationContent[]) => Promise<void>;
  toasts: Toast[];
  notify: (message: string, tone?: "success" | "error") => void;
  dismissToast: (id: string) => void;
};

const ContentStoreContext = createContext<ContentStoreValue | null>(null);

export function ContentStoreProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const reload = useCallback(async () => {
    const items = await repository.list({ includeArchived: true });
    setAll(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const handler = () => void reload();
    window.addEventListener("ecm:contents-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("ecm:contents-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [reload]);

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ContentStoreValue>(() => {
    const wrap = async <T,>(fn: () => Promise<T>, successMessage?: string): Promise<T> => {
      try {
        const result = await fn();
        await reload();
        if (successMessage) notify(successMessage, "success");
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "処理に失敗しました。";
        notify(message, "error");
        throw error;
      }
    };

    return {
      contents: all.filter((c) => !c.archivedAt),
      archived: all.filter((c) => c.archivedAt),
      loading,
      reload,
      create: (draft) => wrap(() => repository.create(draft), "登録しました。"),
      update: (id, draft) => wrap(() => repository.update(id, draft), "変更を保存しました。"),
      duplicate: (id) => wrap(() => repository.duplicate(id), "複製しました。"),
      archive: (id) => wrap(() => repository.archive(id), "アーカイブしました。"),
      restore: (id) => wrap(() => repository.restore(id), "アーカイブから戻しました。"),
      hardDelete: (id) => wrap(() => repository.hardDelete(id), "完全に削除しました。"),
      bulkCreate: (drafts) =>
        wrap(() => repository.bulkCreate(drafts), `${drafts.length}件を登録しました。`),
      exportAll: () => repository.exportAll(),
      replaceAll: (items) => wrap(() => repository.replaceAll(items), "バックアップから復元しました。"),
      toasts,
      notify,
      dismissToast,
    };
  }, [all, loading, reload, toasts, notify, dismissToast]);

  return <ContentStoreContext.Provider value={value}>{children}</ContentStoreContext.Provider>;
}

export function useContentStore(): ContentStoreValue {
  const context = useContext(ContentStoreContext);
  if (!context) {
    throw new Error("useContentStore は ContentStoreProvider の内側で使用してください。");
  }
  return context;
}
