"use client";

import { Button, Modal } from "@/components/ui";
import type { EducationContent } from "@/types/content";

/**
 * 完全削除の確認。誤クリックだけでは削除されないよう、
 * 赤色の危険操作として明示し、資料タイトルを必ず見せる。
 */
export function HardDeleteDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: EducationContent | null;
  onCancel: () => void;
  onConfirm: (content: EducationContent) => void;
}) {
  return (
    <Modal open={Boolean(target)} onClose={onCancel} title="完全に削除しますか？">
      {target ? (
        <div className="space-y-5">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-lg font-bold break-words text-red-800">
            「{target.title}」を完全に削除しますか？
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
            <Button onClick={onCancel} className="sm:min-w-[140px]">
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={() => onConfirm(target)}
              className="sm:min-w-[160px]"
            >
              完全に削除
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
