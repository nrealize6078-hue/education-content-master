"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import type { EducationContent } from "@/types/content";
import { EmptyState, ProgressBar, StatusBadge } from "@/components/ui";
import { ActionMenu, CategoryPath, OpenSourceButton } from "./content-actions";

type Props = {
  contents: EducationContent[];
  onDuplicate: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onHardDelete: (content: EducationContent) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ContentList({
  contents,
  onDuplicate,
  onArchive,
  onRestore,
  onHardDelete,
  emptyTitle = "条件に一致するコンテンツがありません。",
  emptyDescription = "検索語または絞り込み条件を変更してください。",
}: Props) {
  const router = useRouter();

  if (contents.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const openDetail = (id: string) => router.push(`/contents/detail?id=${id}`);

  return (
    <>
      {/* PC：表形式（ヘッダー固定・横スクロールはこの中だけ） */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="max-h-[calc(100vh-320px)] overflow-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#0e2245] text-white">
              <tr>
                <Th className="w-[26%]">タイトル</Th>
                <Th className="w-[19%]">大項目 ＞ 中項目 ＞ 小項目</Th>
                <Th className="w-[8%]">教材形式</Th>
                <Th className="w-[9%]">状態</Th>
                <Th className="w-[11%]">完成度</Th>
                <Th className="w-[8%]">最終更新日</Th>
                <Th className="w-[19%] text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr
                  key={content.id}
                  onClick={() => openDetail(content.id)}
                  className="cursor-pointer border-t border-slate-200 align-middle transition hover:bg-[#f3f7f4]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/contents/detail?id=${content.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="focus-ring line-clamp-2 rounded font-bold text-[#0e2245] underline-offset-2 hover:underline"
                      title={content.title}
                    >
                      {content.title}
                    </Link>
                    {content.owner ? (
                      <p className="mt-0.5 text-sm text-slate-500">担当：{content.owner}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <CategoryPath content={content} />
                  </td>
                  <td className="px-4 py-3 text-[15px] text-slate-700">{content.materialFormat}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={content.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={content.progress} />
                  </td>
                  <td className="px-4 py-3 text-[15px] whitespace-nowrap text-slate-600">
                    {formatDate(content.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <OpenSourceButton content={content} />
                      <Link
                        href={`/contents/edit?id=${content.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="focus-ring inline-flex min-h-[38px] items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold whitespace-nowrap text-slate-800 hover:bg-slate-50"
                      >
                        編集
                      </Link>
                      <ActionMenu
                        content={content}
                        onDuplicate={() => onDuplicate(content.id)}
                        onArchive={onArchive ? () => onArchive(content.id) : undefined}
                        onRestore={onRestore ? () => onRestore(content.id) : undefined}
                        onHardDelete={() => onHardDelete(content)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* スマホ・タブレット：カード形式（横長の表は出さない） */}
      <div className="grid gap-3 lg:hidden">
        {contents.map((content) => (
          <article
            key={content.id}
            onClick={() => openDetail(content.id)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/contents/detail?id=${content.id}`}
                onClick={(e) => e.stopPropagation()}
                className="focus-ring min-w-0 flex-1 rounded text-[17px] leading-snug font-bold break-words text-[#0e2245]"
              >
                {content.title}
              </Link>
              <ActionMenu
                content={content}
                onDuplicate={() => onDuplicate(content.id)}
                onArchive={onArchive ? () => onArchive(content.id) : undefined}
                onRestore={onRestore ? () => onRestore(content.id) : undefined}
                onHardDelete={() => onHardDelete(content)}
              />
            </div>

            <div className="mt-2">
              <CategoryPath content={content} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={content.status} />
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-700">
                {content.materialFormat}
              </span>
              <span className="text-sm text-slate-500">更新 {formatDate(content.updatedAt)}</span>
            </div>

            <div className="mt-3">
              <ProgressBar value={content.progress} />
            </div>

            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <OpenSourceButton content={content} className="flex-1" />
              <Link
                href={`/contents/edit?id=${content.id}`}
                onClick={(e) => e.stopPropagation()}
                className="focus-ring inline-flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800"
              >
                編集
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[15px] font-bold whitespace-nowrap ${className ?? ""}`}>
      {children}
    </th>
  );
}
