"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CONTENT_STATUSES,
  MAJOR_CATEGORIES,
  allMajorCategories,
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
import { useStickyList } from "@/features/contents/use-sticky-list";
import { Dashboard } from "@/features/contents/dashboard";
import {
  MajorCategoryBoard,
  MajorCategoryHeader,
} from "@/features/contents/major-category-board";
import { SaveFileBanner } from "@/features/contents/save-file-banner";
import { SearchFilterBar } from "@/features/contents/search-filter-bar";
import { ContentList } from "@/features/contents/content-list";
import { BulkActionBar } from "@/features/contents/bulk-action-bar";
import { HardDeleteDialog } from "@/features/contents/delete-dialog";

/** 大項目のカード一覧を見せるか、教材の一覧を見せるか */
type View = { mode: "board" } | { mode: "list"; major: string | null };

export default function HomePage() {
  const {
    contents,
    archived,
    loading,
    update,
    duplicate,
    archive,
    hardDelete,
    bulkUpdate,
    bulkArchive,
    bulkHardDelete,
    categoryOrder,
  } = useContentStore();
  const [view, setView] = useState<View>({ mode: "board" });
  const [filters, setFilters] = useState<ContentFilters>(createEmptyFilters());
  const [sort, setSort] = useState<SortOrder>("categoryAsc");
  const [deleteTarget, setDeleteTarget] = useState<EducationContent | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedMajor = view.mode === "list" ? view.major : null;

  /** いま触れる範囲。大項目を選んでいるあいだは、その中だけに限る。 */
  const scoped = useMemo(
    () =>
      selectedMajor === null
        ? contents
        : contents.filter((c) => allMajorCategories(c).includes(selectedMajor)),
    [contents, selectedMajor]
  );

  const base = useMemo(
    () => sortContents(applyFilters(scoped, filters), sort, categoryOrder),
    [scoped, filters, sort, categoryOrder]
  );

  // 変更した行が絞り込みや並び順のせいで消えないようにする
  const resetKey = useMemo(
    () => `${JSON.stringify(filters)}|${sort}|${selectedMajor ?? ""}`,
    [filters, sort, selectedMajor]
  );
  const { items: visible, outOfFilterIds, markSticky } = useStickyList(base, contents, resetKey);

  /** 大項目の選択肢は実際に登録されている値から作る（固定一覧だと分類がすり替わる） */
  const majorOptions = useMemo(() => {
    const fromData = [
      ...new Set([...contents, ...archived].map((c) => c.majorCategory).filter((v) => v.trim())),
    ];
    const list = fromData.length > 0 ? fromData : [...MAJOR_CATEGORIES];
    return list.sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));
  }, [contents, archived]);

  const scopedStatusCounts = useMemo(() => {
    const counts = Object.fromEntries(CONTENT_STATUSES.map((s) => [s, 0])) as Record<
      ContentStatus,
      number
    >;
    for (const content of scoped) counts[content.status] += 1;
    return counts;
  }, [scoped]);

  // 一覧から消えた行の選択は自動的に外す
  useEffect(() => {
    setSelectedIds((prev) => {
      const alive = new Set(visible.map((c) => c.id));
      const next = new Set([...prev].filter((id) => alive.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible]);

  const openMajor = (major: string) => {
    setView({ mode: "list", major });
    setFilters(createEmptyFilters());
    setSort("categoryAsc");
    setSelectedIds(new Set());
    window.scrollTo({ top: 0 });
  };

  const openAll = () => {
    setView({ mode: "list", major: null });
    setFilters(createEmptyFilters());
    setSelectedIds(new Set());
    window.scrollTo({ top: 0 });
  };

  const backToBoard = () => {
    setView({ mode: "board" });
    setFilters(createEmptyFilters());
    setSelectedIds(new Set());
    window.scrollTo({ top: 0 });
  };

  const selectStatus = (status: ContentStatus) => {
    setView({ mode: "list", major: null });
    setFilters({ ...createEmptyFilters(), status: [status] });
  };

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
    <div className={selectedIds.size > 0 ? "space-y-6 pb-[15rem] sm:pb-28" : "space-y-6"}>
      {view.mode === "board" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0e2245] sm:text-3xl">教育コンテンツMASTER</h1>
            <p className="mt-1 text-slate-600">{APP_TAGLINE}</p>
          </div>
          <Link
            href="/contents/new"
            className="focus-ring inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0f5c3f] px-6 py-3 text-lg font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-[#0c4b34]"
          >
            ＋ 新しい教材を登録
          </Link>
        </div>
      ) : null}

      <SaveFileBanner />

      {loading ? (
        <LoadingState />
      ) : contents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-xl font-bold text-slate-700">まだ教材が登録されていません。</p>
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
      ) : view.mode === "board" ? (
        <>
          <Dashboard
            contents={contents}
            onSelectStatus={selectStatus}
            onSelectUnclassified={() => {
              setView({ mode: "list", major: null });
              setFilters({ ...createEmptyFilters(), majorCategory: ["分類待ち"] });
            }}
            onClearFilters={() => setFilters(createEmptyFilters())}
          />
          <MajorCategoryBoard
            contents={contents}
            categoryOrder={categoryOrder}
            onSelect={openMajor}
            onShowAll={openAll}
          />
        </>
      ) : (
        <>
          {selectedMajor === null ? (
            <div className="flex flex-col gap-3 rounded-xl border-2 border-slate-300 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h1 className="text-xl font-bold text-[#0e2245]">
                  すべての教材（{scoped.length}件）
                </h1>
                <p className="mt-0.5 text-[15px] text-slate-600">
                  大項目ごとに絞って探すこともできます。
                </p>
              </div>
              <button
                type="button"
                onClick={backToBoard}
                className="focus-ring inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border-2 border-[#0f5c3f] bg-white px-5 py-2 text-base font-bold whitespace-nowrap text-[#0f5c3f] hover:bg-[#e4f0e9]"
              >
                ← 大項目の一覧に戻る
              </button>
            </div>
          ) : (
            <MajorCategoryHeader
              name={selectedMajor}
              total={scoped.length}
              shown={visible.length}
              statusCounts={scopedStatusCounts}
              onBack={backToBoard}
            />
          )}

          <SearchFilterBar
            filters={filters}
            onChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            contents={scoped}
            resultCount={visible.length}
            hideMajorFilter={selectedMajor !== null}
          />

          <p className="text-sm text-slate-500">
            タイトルの ✎ を押すとその場で書き換えられます。状態と大項目は一覧の欄から直接変更できます。
            左端のチェックを付けると、まとめて変更・削除ができます。
            <br className="hidden sm:block" />
            変更した行は、絞り込み条件から外れても並び順が変わっても、その場に残ります。
          </p>

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
            onArchive={(id) => void archive(id)}
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
        onAddMajor={(majorCategory) => {
          markSticky(ids);
          void (async () => {
            for (const id of ids) {
              const item = contents.find((c) => c.id === id);
              if (!item || item.majorCategory === majorCategory) continue;
              if (item.additionalMajorCategories.includes(majorCategory)) continue;
              await bulkUpdate([id], {
                additionalMajorCategories: [
                  ...item.additionalMajorCategories,
                  majorCategory,
                ],
              });
            }
          })();
        }}
        onArchive={async () => {
          await bulkArchive(ids);
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
