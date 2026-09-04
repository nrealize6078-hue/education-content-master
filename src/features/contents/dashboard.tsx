"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ContentStatus, EducationContent } from "@/types/content";
import { Card, ProgressBar, SectionTitle, StatusBadge } from "@/components/ui";
import { buildSummary } from "./summary";

type StatCard = {
  label: string;
  value: number;
  onClick: () => void;
  tone: string;
  hint: string;
};

export function Dashboard({
  contents,
  onSelectStatus,
  onSelectUnclassified,
  onClearFilters,
}: {
  contents: EducationContent[];
  onSelectStatus: (status: ContentStatus) => void;
  onSelectUnclassified: () => void;
  onClearFilters: () => void;
}) {
  const summary = buildSummary(contents);

  const cards: StatCard[] = [
    {
      label: "全コンテンツ数",
      value: summary.total,
      onClick: onClearFilters,
      tone: "border-[#0e2245] bg-[#0e2245] text-white",
      hint: "すべて表示",
    },
    {
      label: "完成",
      value: summary.byStatus.完成,
      onClick: () => onSelectStatus("完成"),
      tone: "border-emerald-300 bg-emerald-50 text-emerald-900",
      hint: "完成だけ表示",
    },
    {
      label: "制作中",
      value: summary.byStatus.制作中,
      onClick: () => onSelectStatus("制作中"),
      tone: "border-amber-300 bg-amber-50 text-amber-900",
      hint: "制作中だけ表示",
    },
    {
      label: "要修正",
      value: summary.byStatus.要修正,
      onClick: () => onSelectStatus("要修正"),
      tone: "border-red-300 bg-red-50 text-red-900",
      hint: "要修正だけ表示",
    },
    {
      label: "要更新",
      value: summary.byStatus.要更新,
      onClick: () => onSelectStatus("要更新"),
      tone: "border-orange-300 bg-orange-50 text-orange-900",
      hint: "要更新だけ表示",
    },
    {
      label: "分類待ち",
      value: summary.unclassified,
      onClick: onSelectUnclassified,
      tone: "border-slate-300 bg-slate-100 text-slate-800",
      hint: "分類待ちだけ表示",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            title={card.hint}
            className={cn(
              "focus-ring rounded-xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md",
              card.tone
            )}
          >
            <p className="text-[15px] font-bold opacity-90">{card.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{card.value}</p>
            <p className="mt-1 text-xs opacity-75">クリックで絞り込み</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <SectionTitle>全体の進みぐあい</SectionTitle>
          <p className="text-4xl font-bold text-[#0f5c3f] tabular-nums">
            {summary.overallProgress}
            <span className="ml-1 text-2xl">%</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">登録済み{summary.total}件の完成度の平均</p>
          <div className="mt-4">
            <ProgressBar value={summary.overallProgress} />
          </div>
          <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            {(Object.keys(summary.byStatus) as ContentStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between gap-3">
                <dt>
                  <StatusBadge status={status} />
                </dt>
                <dd className="text-lg font-bold tabular-nums text-slate-700">
                  {summary.byStatus[status]}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle>大項目ごとの登録数と完成率</SectionTitle>
          {summary.byMajorCategory.length === 0 ? (
            <p className="py-6 text-center text-slate-500">
              まだコンテンツが登録されていません。
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.byMajorCategory.map((row) => (
                <li key={row.name} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-40 shrink-0 truncate font-bold text-[#0e2245]" title={row.name}>
                    {row.name}
                  </span>
                  <span className="w-24 shrink-0 text-sm text-slate-600 tabular-nums">
                    {row.count}件 / 完成{row.completed}
                  </span>
                  <div className="min-w-[140px] flex-1">
                    <ProgressBar value={row.averageProgress} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>優先対応コンテンツ（最優先・高）</SectionTitle>
          <ItemList
            items={summary.priorityItems}
            empty="優先度が「最優先」「高」のコンテンツはありません。"
            renderMeta={(c) => `優先度：${c.priority}／完成度 ${c.progress}%`}
          />
        </Card>
        <Card className="p-5">
          <SectionTitle>次の作業が入力されているコンテンツ</SectionTitle>
          <ItemList
            items={summary.nextActionItems}
            empty="「次の作業」が入力されたコンテンツはありません。"
            renderMeta={(c) => c.nextAction}
          />
        </Card>
      </div>
    </div>
  );
}

function ItemList({
  items,
  empty,
  renderMeta,
}: {
  items: EducationContent[];
  empty: string;
  renderMeta: (content: EducationContent) => string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-slate-500">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((content) => (
        <li key={content.id} className="py-2.5">
          <Link
            href={`/contents/detail?id=${content.id}`}
            className="focus-ring block rounded-lg px-1 py-1 hover:bg-slate-50"
          >
            <p className="line-clamp-1 font-bold text-[#0e2245]">{content.title}</p>
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{renderMeta(content)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
