"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  createEmptyFilters,
  type ContentFilters,
  type ContentStatus,
  type EducationContent,
  type SortOrder,
} from "@/types/content";
import { APP_TAGLINE } from "@/lib/constants";
import { LoadingState } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import { applyFilters, sortContents } from "@/features/contents/filter-utils";
import { Dashboard } from "@/features/contents/dashboard";
import { SearchFilterBar } from "@/features/contents/search-filter-bar";
import { ContentList } from "@/features/contents/content-list";
import { HardDeleteDialog } from "@/features/contents/delete-dialog";

export default function HomePage() {
  const { contents, loading, duplicate, archive, hardDelete } = useContentStore();
  const [filters, setFilters] = useState<ContentFilters>(createEmptyFilters());
  const [sort, setSort] = useState<SortOrder>("updatedDesc");
  const [deleteTarget, setDeleteTarget] = useState<EducationContent | null>(null);

  const visible = useMemo(
    () => sortContents(applyFilters(contents, filters), sort),
    [contents, filters, sort]
  );

  const selectStatus = (status: ContentStatus) =>
    setFilters({ ...createEmptyFilters(), status: [status] });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0e2245] sm:text-3xl">教育コンテンツMASTER</h1>
          <p className="mt-1 text-slate-600">{APP_TAGLINE}</p>
        </div>
        <Link
          href="/contents/new"
          className="focus-ring inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0f5c3f] px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-[#0c4b34]"
        >
          ＋ 新しい教材を登録
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Dashboard
            contents={contents}
            onSelectStatus={selectStatus}
            onSelectUnclassified={() =>
              setFilters({ ...createEmptyFilters(), majorCategory: ["分類待ち"] })
            }
            onClearFilters={() => setFilters(createEmptyFilters())}
          />

          <SearchFilterBar
            filters={filters}
            onChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            contents={contents}
            resultCount={visible.length}
          />

          {contents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="text-xl font-bold text-slate-700">
                まだ教材が登録されていません。
              </p>
              <p className="mt-2 text-slate-500">
                「＋ 新しい教材を登録」から1件ずつ登録するか、
                <br className="hidden sm:block" />
                「CSV取り込み」からまとめて登録できます。
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/contents/new"
                  className="focus-ring inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#0f5c3f] px-6 py-3 text-base font-bold text-white hover:bg-[#0c4b34]"
                >
                  ＋ 新しい教材を登録
                </Link>
                <Link
                  href="/import"
                  className="focus-ring inline-flex min-h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-bold text-slate-800 hover:bg-slate-50"
                >
                  CSVでまとめて登録
                </Link>
              </div>
            </div>
          ) : (
            <ContentList
              contents={visible}
              onDuplicate={(id) => void duplicate(id)}
              onArchive={(id) => void archive(id)}
              onHardDelete={setDeleteTarget}
            />
          )}
        </>
      )}

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
