"use client";

import { useState } from "react";
import { CONTENT_STATUSES, type ContentStatus } from "@/types/content";
import { Button, Modal } from "@/components/ui";

type Props = {
  selectedCount: number;
  majorOptions: string[];
  onClearSelection: () => void;
  onChangeStatus: (status: ContentStatus) => void;
  onChangeMajor: (major: string) => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onHardDelete: () => void;
};

/** 選択中の行に対してまとめて操作するバー。画面下部に固定して常に見えるようにする。 */
export function BulkActionBar({
  selectedCount,
  majorOptions,
  onClearSelection,
  onChangeStatus,
  onChangeMajor,
  onArchive,
  onRestore,
  onHardDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#0f5c3f] bg-white/97 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
          <span className="rounded-lg bg-[#0f5c3f] px-3 py-2 text-base font-bold whitespace-nowrap text-white">
            {selectedCount}件を選択中
          </span>

          <label className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-sm font-bold whitespace-nowrap text-slate-700">状態を</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = "";
                if (v) onChangeStatus(v as ContentStatus);
              }}
              className="focus-ring min-h-[40px] w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] sm:w-auto"
            >
              <option value="">まとめて変更…</option>
              {CONTENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <span className="text-sm font-bold whitespace-nowrap text-slate-700">大項目を</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = "";
                if (v) onChangeMajor(v);
              }}
              className="focus-ring min-h-[40px] w-full max-w-[240px] min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px]"
            >
              <option value="">まとめて変更…</option>
              {majorOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            {onArchive ? (
              <Button size="sm" onClick={onArchive}>
                アーカイブ
              </Button>
            ) : null}
            {onRestore ? (
              <Button size="sm" onClick={onRestore}>
                アーカイブから戻す
              </Button>
            ) : null}
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              完全に削除
            </Button>
            <Button size="sm" onClick={onClearSelection}>
              選択を解除
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="まとめて完全に削除しますか？"
      >
        <div className="space-y-5">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-lg font-bold text-red-800">
            選択中の{selectedCount}件を完全に削除しますか？
          </p>
          <div className="space-y-2 text-[15px] leading-7 text-slate-700">
            <p className="font-bold text-red-700">この操作は元に戻せません。</p>
            <p>
              元のPDFや動画そのものは削除されませんが、
              <br className="hidden sm:block" />
              教育コンテンツMASTERに登録した管理情報は削除されます。
            </p>
            <p className="text-slate-500">
              あとから戻したい場合は、削除ではなく「アーカイブ」をご利用ください。
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <Button onClick={() => setConfirmDelete(false)} className="sm:min-w-[140px]">
              キャンセル
            </Button>
            <Button
              variant="danger"
              className="sm:min-w-[200px]"
              onClick={() => {
                setConfirmDelete(false);
                onHardDelete();
              }}
            >
              {selectedCount}件を完全に削除
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
