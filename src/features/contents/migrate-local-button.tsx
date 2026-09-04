"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { localContentRepository } from "@/repositories/local-content-repository";
import { useContentStore } from "./content-store";
import type { EducationContent } from "@/types/content";

/**
 * サーバー保存へ切り替えたあと、そのブラウザに残っている分をまとめて移す。
 * 元のブラウザ内のデータは消さない（移し終えてから利用者が判断できるように）。
 */
export function MigrateLocalButton() {
  const { bulkCreate, notify, reload } = useContentStore();
  const [local, setLocal] = useState<EducationContent[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void localContentRepository.exportAll().then(setLocal);
  }, []);

  if (local.length === 0) {
    return (
      <p className="text-[15px] text-slate-500">
        {done
          ? "移し終えました。"
          : "このブラウザに残っているデータはありません。"}
      </p>
    );
  }

  const run = async () => {
    setBusy(true);
    try {
      const drafts = local.map((item) => {
        const { id, createdAt, updatedAt, archivedAt, ...draft } = item;
        void id;
        void createdAt;
        void updatedAt;
        void archivedAt;
        return draft;
      });
      await bulkCreate(drafts);
      await reload();
      setDone(true);
      setLocal([]);
      notify(`${drafts.length}件をサーバーへ移しました。`);
    } catch {
      // エラーの内容はストア側が画面に出す
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => setConfirming(true)} disabled={busy}>
          {busy ? "移しています…" : `${local.length}件をサーバーへ移す`}
        </Button>
        <span className="text-sm text-slate-500">
          このブラウザには{local.length}件残っています。
        </span>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="サーバーへ移しますか？"
      >
        <div className="space-y-5">
          <p className="rounded-lg border border-[#0f5c3f] bg-[#e4f0e9] px-4 py-3 text-lg font-bold text-[#0f5c3f]">
            このブラウザの{local.length}件を、サーバーへ追加します。
          </p>
          <div className="space-y-2 text-[15px] leading-7 text-slate-700">
            <p>
              すでにサーバーにある教材は消えません。同じ資料がサーバーにもある場合は、
              <strong>二重に登録されます</strong>のでご注意ください。
            </p>
            <p className="text-slate-500">
              このブラウザに残っているデータは、移したあともそのまま残ります。
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <Button onClick={() => setConfirming(false)} className="sm:min-w-[140px]">
              キャンセル
            </Button>
            <Button variant="primary" className="sm:min-w-[200px]" onClick={run} disabled={busy}>
              サーバーへ移す
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
