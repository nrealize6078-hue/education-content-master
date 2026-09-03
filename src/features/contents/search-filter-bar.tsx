"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AUDIENCES,
  CANONICAL_STATUSES,
  CONTENT_PRIORITIES,
  CONTENT_STATUSES,
  MAJOR_CATEGORIES,
  MATERIAL_FORMATS,
  SORT_LABELS,
  type ContentFilters,
  type EducationContent,
  type SortOrder,
} from "@/types/content";
import { Button } from "@/components/ui";
import { countActiveFilters } from "./filter-utils";

type FilterKey = keyof Omit<ContentFilters, "keyword">;

const FILTER_LABELS: Record<FilterKey, string> = {
  majorCategory: "大項目",
  middleCategory: "中項目",
  status: "状態",
  audience: "対象者",
  materialFormat: "教材形式",
  priority: "優先度",
  canonicalStatus: "正本区分",
  owner: "担当者",
};

export function SearchFilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
  contents,
  resultCount,
}: {
  filters: ContentFilters;
  onChange: (next: ContentFilters) => void;
  sort: SortOrder;
  onSortChange: (next: SortOrder) => void;
  contents: EducationContent[];
  resultCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = countActiveFilters(filters);

  // 中項目・担当者は登録済みデータから選択肢を作る（実データのみ／勝手に候補を作らない）
  const middleOptions = useMemo(
    () =>
      [...new Set(contents.map((c) => c.middleCategory).filter((v) => v.trim()))].sort((a, b) =>
        a.localeCompare(b, "ja")
      ),
    [contents]
  );
  // CSVで取り込んだ独自の大項目名（例：「1｜REALIZE CLUB全体」）も選べるようにする
  const majorOptions = useMemo(() => {
    const fromData = contents.map((c) => c.majorCategory).filter((v) => v.trim());
    const extra = [...new Set(fromData)]
      .filter((v) => !(MAJOR_CATEGORIES as readonly string[]).includes(v))
      .sort((a, b) => a.localeCompare(b, "ja"));
    return [...MAJOR_CATEGORIES, ...extra];
  }, [contents]);
  const ownerOptions = useMemo(
    () =>
      [...new Set(contents.map((c) => c.owner).filter((v) => v.trim()))].sort((a, b) =>
        a.localeCompare(b, "ja")
      ),
    [contents]
  );

  const toggle = (key: FilterKey, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next } as ContentFilters);
  };

  const clearAll = () => {
    onChange({
      keyword: "",
      majorCategory: [],
      middleCategory: [],
      status: [],
      audience: [],
      materialFormat: [],
      priority: [],
      canonicalStatus: [],
      owner: [],
    });
  };

  const groups: Array<{ key: FilterKey; options: readonly string[] }> = [
    { key: "majorCategory", options: majorOptions },
    { key: "middleCategory", options: middleOptions },
    { key: "status", options: CONTENT_STATUSES },
    { key: "audience", options: AUDIENCES },
    { key: "materialFormat", options: MATERIAL_FORMATS },
    { key: "priority", options: CONTENT_PRIORITIES },
    { key: "canonicalStatus", options: CANONICAL_STATUSES },
    { key: "owner", options: ownerOptions },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <label htmlFor="keyword" className="mb-2 block text-base font-bold text-[#0e2245]">
        キーワードで探す
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl text-slate-400"
            aria-hidden
          >
            🔍
          </span>
          <input
            id="keyword"
            type="search"
            value={filters.keyword}
            onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
            placeholder="タイトル・概要・タグ・担当者などを横断検索"
            className="focus-ring w-full rounded-lg border-2 border-slate-300 bg-white py-3.5 pr-4 pl-12 text-lg placeholder:text-slate-400"
          />
        </div>
        <Button
          variant={expanded ? "primary" : "secondary"}
          onClick={() => setExpanded((v) => !v)}
          className="sm:min-w-[160px]"
          aria-expanded={expanded}
        >
          絞り込み
          {activeCount > 0 ? (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-sm">{activeCount}</span>
          ) : null}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-base font-bold text-slate-700">{resultCount}件</span>
        <span className="text-sm text-slate-500">を表示中</span>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-bold text-slate-600">
            並び順
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            className="focus-ring min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px]"
          >
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-sm font-bold text-slate-600">適用中の条件：</span>
          {filters.keyword.trim() ? (
            <Chip label={`検索：${filters.keyword}`} onRemove={() => onChange({ ...filters, keyword: "" })} />
          ) : null}
          {(Object.keys(FILTER_LABELS) as FilterKey[]).flatMap((key) =>
            (filters[key] as string[]).map((value) => (
              <Chip
                key={`${key}-${value}`}
                label={`${FILTER_LABELS[key]}：${value}`}
                onRemove={() => toggle(key, value)}
              />
            ))
          )}
          <button
            type="button"
            onClick={clearAll}
            className="focus-ring ml-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            条件をすべて解除
          </button>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2 xl:grid-cols-4">
          {groups.map(({ key, options }) => (
            <fieldset key={key} className="min-w-0">
              <legend className="mb-2 text-sm font-bold text-slate-600">
                {FILTER_LABELS[key]}
              </legend>
              {options.length === 0 ? (
                <p className="text-sm text-slate-400">登録データがまだありません</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {options.map((option) => {
                    const selected = (filters[key] as string[]).includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggle(key, option)}
                        aria-pressed={selected}
                        className={cn(
                          "focus-ring max-w-full truncate rounded-lg border px-3 py-2 text-sm font-bold transition",
                          selected
                            ? "border-[#0f5c3f] bg-[#0f5c3f] text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                        title={option}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#0f5c3f]/30 bg-[#e4f0e9] py-1 pr-1.5 pl-3 text-sm font-bold text-[#0f5c3f]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} を解除`}
        className="focus-ring rounded-full px-1.5 text-[#0f5c3f]/70 hover:bg-white hover:text-[#0f5c3f]"
      >
        ×
      </button>
    </span>
  );
}
