"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { STATUS_STYLES } from "@/lib/constants";
import { CONTENT_STATUSES, type ContentStatus, type EducationContent } from "@/types/content";
import { EmptyState, ProgressBar } from "@/components/ui";
import { ActionMenu, CategoryPath, CrossMajorTags, OpenSourceButton } from "./content-actions";

type Props = {
  contents: EducationContent[];
  majorOptions: string[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onInlineUpdate: (id: string, patch: Partial<EducationContent>) => void;
  /** 絞り込み条件から外れたが、変更直後なので表示し続けている行 */
  outOfFilterIds?: Set<string>;
  onDuplicate: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onHardDelete: (content: EducationContent) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ContentList({
  contents,
  majorOptions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onInlineUpdate,
  outOfFilterIds,
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
  const allSelected = contents.every((c) => selectedIds.has(c.id));

  return (
    <>
      {/* PC：表形式（ヘッダー固定・横スクロールはこの中だけ） */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="max-h-[calc(100vh-320px)] overflow-auto">
          <table className="w-full min-w-[1180px] table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#0e2245] text-white">
              <tr>
                <th className="w-[3%] px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="表示中のすべてを選択"
                    title="表示中のすべてを選択／解除"
                    className="h-5 w-5 cursor-pointer accent-[#0f5c3f]"
                  />
                </th>
                <Th className="w-[22%]">タイトル</Th>
                <Th className="w-[17%]">大項目 ＞ 中項目 ＞ 小項目</Th>
                <Th className="w-[6%]">形式</Th>
                <Th className="w-[9%]">状態</Th>
                <Th className="w-[7%]">完成度</Th>
                <Th className="w-[9%]">更新日</Th>
                <Th className="w-[27%] text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr
                  key={content.id}
                  className={cn(
                    "border-t border-slate-200 align-middle transition",
                    selectedIds.has(content.id)
                      ? "bg-[#e4f0e9]"
                      : outOfFilterIds?.has(content.id)
                        ? "bg-amber-50"
                        : "hover:bg-[#f3f7f4]"
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(content.id)}
                      onChange={() => onToggleSelect(content.id)}
                      aria-label={`${content.title} を選択`}
                      className="h-5 w-5 cursor-pointer accent-[#0f5c3f]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <EditableTitle
                      content={content}
                      onSave={(title) => onInlineUpdate(content.id, { title })}
                      onOpen={() => openDetail(content.id)}
                    />
                    {content.owner ? (
                      <p className="mt-0.5 text-sm text-slate-500">担当：{content.owner}</p>
                    ) : null}
                    {outOfFilterIds?.has(content.id) ? <OutOfFilterNote /> : null}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={content.majorCategory}
                      onChange={(e) => onInlineUpdate(content.id, { majorCategory: e.target.value })}
                      aria-label="大項目"
                      title={content.majorCategory}
                      className="focus-ring mb-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-bold text-[#0e2245]"
                    >
                      {majorOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <CrossMajorTags content={content} className="mb-1" />
                    <CategoryPath content={content} hideMajor />
                  </td>
                  <td className="px-3 py-3 text-[15px] break-words text-slate-700">{content.materialFormat}</td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={content.status}
                      onChange={(status) => onInlineUpdate(content.id, { status })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={content.progress} />
                  </td>
                  <td className="px-3 py-3 text-[15px] whitespace-nowrap text-slate-600">
                    {formatDate(content.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <OpenSourceButton content={content} />
                      <Link
                        href={`/contents/edit?id=${content.id}`}
                        className="focus-ring inline-flex min-h-[38px] items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold whitespace-nowrap text-slate-800 hover:bg-slate-50"
                      >
                        編集
                      </Link>
                      <button
                        type="button"
                        onClick={() => onHardDelete(content)}
                        title="このコンテンツを完全に削除します"
                        className="focus-ring inline-flex min-h-[38px] items-center rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold whitespace-nowrap text-red-700 hover:bg-red-50"
                      >
                        削除
                      </button>
                      <ActionMenu
                        content={content}
                        onDuplicate={() => onDuplicate(content.id)}
                        onArchive={onArchive ? () => onArchive(content.id) : undefined}
                        onRestore={onRestore ? () => onRestore(content.id) : undefined}
                        onHardDelete={() => onHardDelete(content)}
                        hideHardDelete
                        compact
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:hidden">
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="h-5 w-5 accent-[#0f5c3f]"
          />
          <span className="font-bold text-slate-700">表示中のすべてを選択</span>
        </label>

        {contents.map((content) => (
          <article
            key={content.id}
            className={cn(
              "rounded-xl border p-4 shadow-sm transition",
              selectedIds.has(content.id)
                ? "border-[#0f5c3f] bg-[#e4f0e9]"
                : outOfFilterIds?.has(content.id)
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white"
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(content.id)}
                onChange={() => onToggleSelect(content.id)}
                aria-label={`${content.title} を選択`}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0f5c3f]"
              />
              <div className="min-w-0 flex-1">
                <EditableTitle
                  content={content}
                  onSave={(title) => onInlineUpdate(content.id, { title })}
                  onOpen={() => openDetail(content.id)}
                  large
                />
                {outOfFilterIds?.has(content.id) ? <OutOfFilterNote /> : null}
              </div>
              <ActionMenu
                content={content}
                onDuplicate={() => onDuplicate(content.id)}
                onArchive={onArchive ? () => onArchive(content.id) : undefined}
                onRestore={onRestore ? () => onRestore(content.id) : undefined}
                onHardDelete={() => onHardDelete(content)}
              />
            </div>

            <div className="mt-3 min-w-0 space-y-2">
              <select
                value={content.majorCategory}
                onChange={(e) => onInlineUpdate(content.id, { majorCategory: e.target.value })}
                aria-label="大項目"
                title={content.majorCategory}
                className="focus-ring w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] font-bold text-[#0e2245]"
              >
                {majorOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <CrossMajorTags content={content} className="mt-1" />
              <CategoryPath content={content} hideMajor />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusSelect
                value={content.status}
                onChange={(status) => onInlineUpdate(content.id, { status })}
              />
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-700">
                {content.materialFormat}
              </span>
              <span className="text-sm text-slate-500">更新 {formatDate(content.updatedAt)}</span>
            </div>

            <div className="mt-3">
              <ProgressBar value={content.progress} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <OpenSourceButton content={content} className="min-w-0 flex-1" />
              <Link
                href={`/contents/edit?id=${content.id}`}
                className="focus-ring inline-flex min-h-[38px] min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800"
              >
                編集
              </Link>
              <button
                type="button"
                onClick={() => onHardDelete(content)}
                className="focus-ring inline-flex min-h-[38px] items-center justify-center rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-bold text-red-700"
              >
                削除
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/** 絞り込みから外れた行に添える説明。理由が分からないまま消えるのを防ぐ。 */
function OutOfFilterNote() {
  return (
    <p className="mt-1 inline-flex items-start rounded-md bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900">
      いまの絞り込み条件からは外れましたが、変更したばかりなので表示しています
    </p>
  );
}

/** 状態をその場で変えられる選択欄。色は状態に合わせる。 */
function StatusSelect({
  value,
  onChange,
}: {
  value: ContentStatus;
  onChange: (v: ContentStatus) => void;
}) {
  const style = STATUS_STYLES[value];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ContentStatus)}
      aria-label="状態"
      className={cn(
        "focus-ring min-h-[38px] cursor-pointer rounded-full border px-3 py-1.5 text-sm font-bold",
        style.badge
      )}
    >
      {CONTENT_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-slate-800">
          {s}
        </option>
      ))}
    </select>
  );
}

/** タイトルをクリックするとその場で書き換えられる。Enterで保存・Escで取り消し。 */
function EditableTitle({
  content,
  onSave,
  onOpen,
  large,
}: {
  content: EducationContent;
  onSave: (title: string) => void;
  onOpen: () => void;
  large?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(content.title), [content.title]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = value.trim();
    setEditing(false);
    if (!next) {
      setValue(content.title); // 空にはできない
      return;
    }
    if (next !== content.title) onSave(next);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setValue(content.title);
            setEditing(false);
          }
        }}
        className="focus-ring w-full rounded-lg border-2 border-[#0f5c3f] bg-white px-2 py-1.5 text-[15px] font-bold text-[#0e2245]"
      />
    );
  }

  return (
    <div className="flex items-start gap-1.5">
      <button
        type="button"
        onClick={onOpen}
        title="クリックで詳細を開きます"
        className={cn(
          "focus-ring min-w-0 flex-1 rounded text-left font-bold break-words text-[#0e2245] underline-offset-2 hover:underline",
          large ? "text-[17px] leading-snug" : "line-clamp-2"
        )}
      >
        {content.title}
      </button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="タイトルをその場で書き換える"
        title="タイトルをその場で書き換える"
        className="focus-ring shrink-0 rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        ✎
      </button>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[15px] font-bold whitespace-nowrap ${className ?? ""}`}>
      {children}
    </th>
  );
}
