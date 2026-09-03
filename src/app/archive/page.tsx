"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MAJOR_CATEGORIES,
  createEmptyFilters,
  type ContentFilters,
  type EducationContent,
  type SortOrder,
} from "@/types/content";
import { LoadingState } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import { applyFilters, sortContents } from "@/features/contents/filter-utils";
import { useStickyList } from "@/features/contents/use-sticky-list";
import { SearchFilterBar } from "@/features/contents/search-filter-bar";
import { ContentList } from "@/features/contents/content-list";
import { BulkActionBar } from "@/features/contents/bulk-action-bar";
import { HardDeleteDialog } from "@/features/contents/delete-dialog";

export default function ArchivePage() {
  const {
    contents,
    archived,
    loading,
    update,
    duplicate,
    restore,
    hardDelete,
    bulkUpdate,
    bulkHardDelete,
  } = useContentStore();
  const [filters, setFilters] = useState<ContentFilters>(createEmptyFilters());
  const [sort, setSort] = useState<SortOrder>("updatedDesc");
  const [deleteTarget, setDeleteTarget] = useState<EducationContent | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const base = useMemo(
    () => sortContents(applyFilters(archived, filters), sort),
    [archived, filters, sort]
  );

  const resetKey = useMemo(() => `${JSON.stringify(filters)}|${sort}`, [filters, sort]);
  const { items: visible, outOfFilterIds, markSticky } = useStickyList(base, archived, resetKey);

  const majorOptions = useMemo(() => {
    const fromData = [...new Set([...contents, ...archived].map((c) => c.majorCategory).filter((v) => v.trim()))];
    const base = fromData.length > 0 ? fromData : [...MAJOR_CATEGORIES];
    return base.sort((a, b) => a.localeCompare(b, "ja"));
  }, [contents, archived]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const alive = new Set(visible.map((c) => c.id));
      const next = new Set([...prev].filter((id) => alive.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      visible.every((c) => prev.has(c.id)) ? new Set() : new Set(visible.map((c) => c.id))
    );

  const ids = [...selectedIds];

  return (
    <div className={selectedIds.size > 0 ? "space-y-5 pb-[15rem] sm:pb-28" : "space-y-5"}>
      <nav className="text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <span>アーカイブ</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-[#0e2245]">アーカイブ</h1>
        <p className="mt-1 text-slate-600">
          通常の一覧から外したコンテンツです。「アーカイブから戻す」でいつでも復元できます。
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : archived.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-xl font-bold text-slate-700">アーカイブされたコンテンツはありません。</p>
          <p className="mt-2 text-slate-500">
            一覧の「その他 ▾ ＞ アーカイブ」で、使わなくなった教材をここへ移せます。
          </p>
        </div>
      ) : (
        <>
          <SearchFilterBar
            filters={filters}
            onChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            contents={archived}
            resultCount={visible.length}
          />
          <ContentList
            contents={visible}
            majorOptions={majorOptions}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onInlineUpdate={(id, patch) => {
              markSticky([id]);
              void update(id, patch);
            }}
            outOfFilterIds={outOfFilterIds}
            onDuplicate={(id) => void duplicate(id)}
            onRestore={(id) => void restore(id)}
            onHardDelete={setDeleteTarget}
          />
        </>
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        majorOptions={majorOptions}
        onClearSelection={() => setSelectedIds(new Set())}
        onChangeStatus={(status) => {
          markSticky(ids);
          void bulkUpdate(ids, { status });
        }}
        onChangeMajor={(majorCategory) => {
          markSticky(ids);
          void bulkUpdate(ids, { majorCategory });
        }}
        onRestore={async () => {
          for (const id of ids) await restore(id);
          setSelectedIds(new Set());
        }}
        onHardDelete={async () => {
          await bulkHardDelete(ids);
          setSelectedIds(new Set());
        }}
      />

      <HardDeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(content) => {
          setDeleteTarget(null);
          void hardDelete(content.id);
        }}
      />
    </div>
  );
}
