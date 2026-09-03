"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  createEmptyFilters,
  type ContentFilters,
  type EducationContent,
  type SortOrder,
} from "@/types/content";
import { LoadingState } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import { applyFilters, sortContents } from "@/features/contents/filter-utils";
import { SearchFilterBar } from "@/features/contents/search-filter-bar";
import { ContentList } from "@/features/contents/content-list";
import { HardDeleteDialog } from "@/features/contents/delete-dialog";

export default function ArchivePage() {
  const { archived, loading, duplicate, restore, hardDelete } = useContentStore();
  const [filters, setFilters] = useState<ContentFilters>(createEmptyFilters());
  const [sort, setSort] = useState<SortOrder>("updatedDesc");
  const [deleteTarget, setDeleteTarget] = useState<EducationContent | null>(null);

  const visible = useMemo(
    () => sortContents(applyFilters(archived, filters), sort),
    [archived, filters, sort]
  );

  return (
    <div className="space-y-5">
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
            onDuplicate={(id) => void duplicate(id)}
            onRestore={(id) => void restore(id)}
            onHardDelete={setDeleteTarget}
          />
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
