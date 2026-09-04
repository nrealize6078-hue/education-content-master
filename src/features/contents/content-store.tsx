"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { localContentRepository } from "@/repositories/local-content-repository";
import type { ContentRepository } from "@/repositories/content-repository";
import type { EducationContent, EducationContentDraft } from "@/types/content";
import { getStatus, loadFromFile, saveToFile, type SaveFileStatus } from "@/lib/file-store";

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
  bulkUpdate: (ids: string[], patch: Partial<EducationContentDraft>) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkHardDelete: (ids: string[]) => Promise<void>;
  exportAll: () => Promise<EducationContent[]>;
  replaceAll: (items: EducationContent[]) => Promise<void>;
  toasts: Toast[];
  notify: (message: string, tone?: "success" | "error") => void;
  dismissToast: (id: string) => void;
  /** 保存ファイルの設定状況 */
  fileStatus: SaveFileStatus;
  refreshFileStatus: () => Promise<void>;
  /** 保存ファイルの中身を画面へ取り込む */
  loadFromSaveFile: () => Promise<number>;
  /** いまのデータを保存ファイルへ書き出す */
  saveToSaveFile: () => Promise<boolean>;
};

const ContentStoreContext = createContext<ContentStoreValue | null>(null);

export function ContentStoreProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fileStatus, setFileStatus] = useState<SaveFileStatus>({ state: "none" });

  const reload = useCallback(async () => {
    const items = await repository.list({ includeArchived: true });
    setAll(items);
    setLoading(false);
  }, []);

  const refreshFileStatus = useCallback(async () => {
    setFileStatus(await getStatus());
  }, []);

  useEffect(() => {
    void refreshFileStatus();
  }, [refreshFileStatus]);

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

  // 起動時、ブラウザ内が空でも保存ファイルにデータがあれば自動で読み戻す
  const restoredRef = useRef(false);
  useEffect(() => {
    if (loading || restoredRef.current) return;
    if (all.length > 0) {
      restoredRef.current = true;
      return;
    }
    if (fileStatus.state !== "ready") return;
    restoredRef.current = true;
    void (async () => {
      const items = await loadFromFile();
      if (items && items.length > 0) {
        await repository.replaceAll(items);
        await reload();
      }
    })();
  }, [all.length, loading, fileStatus, reload]);

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
        // ブラウザ内だけに残さず、保存ファイルへも書き出す
        const saved = await saveToFile(await repository.exportAll());
        if (successMessage) notify(successMessage, "success");
        if (!saved) void refreshFileStatus();
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
      bulkUpdate: (ids, patch) =>
        wrap(() => repository.bulkUpdate(ids, patch), `${ids.length}件を変更しました。`),
      bulkArchive: (ids) =>
        wrap(() => repository.bulkArchive(ids), `${ids.length}件をアーカイブしました。`),
      bulkHardDelete: (ids) =>
        wrap(() => repository.bulkHardDelete(ids), `${ids.length}件を完全に削除しました。`),
      exportAll: () => repository.exportAll(),
      replaceAll: (items) => wrap(() => repository.replaceAll(items), "バックアップから復元しました。"),
      toasts,
      notify,
      dismissToast,
      fileStatus,
      refreshFileStatus,
      loadFromSaveFile: async () => {
        const items = await loadFromFile();
        if (!items) {
          notify("保存ファイルを読み込めませんでした。もう一度ファイルを選び直してください。", "error");
          await refreshFileStatus();
          return 0;
        }
        await repository.replaceAll(items);
        await reload();
        notify(`保存ファイルから${items.length}件を読み込みました。`);
        return items.length;
      },
      saveToSaveFile: async () => {
        const ok = await saveToFile(await repository.exportAll());
        if (ok) notify("保存ファイルへ書き出しました。");
        else notify("保存ファイルへ書き出せませんでした。設定を確認してください。", "error");
        await refreshFileStatus();
        return ok;
      },
    };
  }, [all, loading, reload, toasts, notify, dismissToast, fileStatus, refreshFileStatus]);

  return <ContentStoreContext.Provider value={value}>{children}</ContentStoreContext.Provider>;
}

export function useContentStore(): ContentStoreValue {
  const context = useContext(ContentStoreContext);
  if (!context) {
    throw new Error("useContentStore は ContentStoreProvider の内側で使用してください。");
  }
  return context;
}
