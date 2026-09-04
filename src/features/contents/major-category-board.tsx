"use client";

import { useMemo } from "react";
import { STATUS_STYLES } from "@/lib/constants";
import type { ContentStatus, EducationContent } from "@/types/content";
import { ProgressBar } from "@/components/ui";

type Group = {
  name: string;
  items: EducationContent[];
  middles: string[];
  completed: number;
  averageProgress: number;
};

function compareJa(a: string, b: string): number {
  return a.localeCompare(b, "ja", { numeric: true, sensitivity: "base" });
}

/**
 * 大項目ごとのカード。押すと、その大項目の中だけを開く。
 * 473件を一度に見せると探せないため、まずここで行き先を選んでもらう。
 */
export function MajorCategoryBoard({
  contents,
  onSelect,
  onShowAll,
}: {
  contents: EducationContent[];
  onSelect: (majorCategory: string) => void;
  onShowAll: () => void;
}) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, EducationContent[]>();
    for (const content of contents) {
      const key = content.majorCategory.trim() || "未設定";
      const list = map.get(key) ?? [];
      list.push(content);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([name, items]) => ({
        name,
        items,
        middles: [...new Set(items.map((i) => i.middleCategory.trim()).filter(Boolean))].sort(
          compareJa
        ),
        completed: items.filter((i) => i.status === "完成").length,
        averageProgress: Math.round(
          items.reduce((sum, i) => sum + (i.progress || 0), 0) / items.length
        ),
      }))
      .sort((a, b) => compareJa(a.name, b.name));
  }, [contents]);

  if (groups.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0e2245]">大項目から探す</h2>
          <p className="mt-0.5 text-[15px] text-slate-600">
            カードを押すと、その大項目の中だけを開きます。
          </p>
        </div>
        <button
          type="button"
          onClick={onShowAll}
          className="focus-ring inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-base font-bold whitespace-nowrap text-slate-800 hover:bg-slate-50"
        >
          すべての教材を一覧で見る（{contents.length}件）
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <li key={group.name}>
            <button
              type="button"
              onClick={() => onSelect(group.name)}
              className="focus-ring flex h-full w-full flex-col rounded-xl border-2 border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f5c3f] hover:shadow-md"
            >
              <span className="text-lg leading-snug font-bold break-words text-[#0e2245]">
                {group.name}
              </span>

              <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-bold tabular-nums text-[#0f5c3f]">
                  {group.items.length}
                </span>
                <span className="text-[15px] font-bold text-slate-600">件</span>
                <span className="text-sm text-slate-500">完成 {group.completed}件</span>
              </span>

              <span className="mt-3 block">
                <ProgressBar value={group.averageProgress} />
              </span>

              <span className="mt-3 flex flex-wrap gap-1.5">
                {group.middles.slice(0, 4).map((middle) => (
                  <span
                    key={middle}
                    className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700"
                  >
                    {middle}
                  </span>
                ))}
                {group.middles.length > 4 ? (
                  <span className="px-1 py-1 text-sm text-slate-500">
                    ほか{group.middles.length - 4}件
                  </span>
                ) : null}
                {group.middles.length === 0 ? (
                  <span className="px-1 py-1 text-sm text-slate-400">中項目は未設定</span>
                ) : null}
              </span>

              <span className="mt-auto pt-3 text-[15px] font-bold text-[#0f5c3f]">
                この中を開く →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 大項目を1つ選んでいるあいだ、画面上部に出す見出し。 */
export function MajorCategoryHeader({
  name,
  total,
  shown,
  statusCounts,
  onBack,
}: {
  name: string;
  total: number;
  shown: number;
  statusCounts: Record<ContentStatus, number>;
  onBack: () => void;
}) {
  return (
    <section className="rounded-xl border-2 border-[#0f5c3f] bg-[#e4f0e9] px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0f5c3f]">いまここだけを表示しています</p>
          <h1 className="mt-0.5 text-2xl font-bold break-words text-[#0e2245]">{name}</h1>
          <p className="mt-1 text-[15px] text-slate-700">
            全{total}件
            {shown !== total ? <>（絞り込み中：{shown}件）</> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="focus-ring inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border-2 border-[#0f5c3f] bg-white px-5 py-2 text-base font-bold whitespace-nowrap text-[#0f5c3f] hover:bg-[#d7e8de]"
        >
          ← 大項目の一覧に戻る
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#0f5c3f]/25 pt-3">
        {(Object.keys(statusCounts) as ContentStatus[])
          .filter((status) => statusCounts[status] > 0)
          .map((status) => (
            <span
              key={status}
              className={`rounded-full border px-3 py-1 text-sm font-bold ${STATUS_STYLES[status].badge}`}
            >
              {status} {statusCounts[status]}
            </span>
          ))}
      </div>
    </section>
  );
}
