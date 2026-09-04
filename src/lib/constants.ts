import type { ContentStatus } from "@/types/content";

/** 状態ごとの色（指示書 15章に準拠）。 */
export const STATUS_STYLES: Record<
  ContentStatus,
  { dot: string; badge: string; label: string }
> = {
  未着手: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-700 border-slate-300", label: "未着手" },
  整理中: { dot: "bg-sky-500", badge: "bg-sky-100 text-sky-700 border-sky-300", label: "整理中" },
  制作中: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800 border-amber-300", label: "制作中" },
  要修正: { dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-300", label: "要修正" },
  要更新: {
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    label: "要更新",
  },
  完成: { dot: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "完成" },
  保留: { dot: "bg-slate-300", badge: "bg-slate-50 text-slate-500 border-slate-200", label: "保留" },
};

export const APP_NAME = "教育コンテンツMASTER";
export const APP_TAGLINE = "REALIZE OSの知識・教材・資料を、ひとつに。";
