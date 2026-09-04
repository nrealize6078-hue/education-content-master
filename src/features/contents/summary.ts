import { allMajorCategories, type ContentStatus, type EducationContent } from "@/types/content";

export type Summary = {
  total: number;
  byStatus: Record<ContentStatus, number>;
  unclassified: number;
  /** 全体に占める「完成」の割合（％） */
  completionRate: number;
  /** 「完成」の件数 */
  completedCount: number;
  byMajorCategory: Array<{
    name: string;
    count: number;
    completed: number;
    /** その大項目に占める「完成」の割合（％） */
    completionRate: number;
  }>;
  priorityItems: EducationContent[];
  nextActionItems: EducationContent[];
};

export function buildSummary(contents: EducationContent[]): Summary {
  const byStatus: Record<ContentStatus, number> = {
    未着手: 0,
    整理中: 0,
    制作中: 0,
    要修正: 0,
    要更新: 0,
    完成: 0,
    保留: 0,
  };
  for (const content of contents) {
    byStatus[content.status] = (byStatus[content.status] ?? 0) + 1;
  }

  const unclassified = contents.filter(
    (c) => c.majorCategory === "分類待ち" || !c.majorCategory.trim()
  ).length;

  const completedCount = contents.filter((c) => c.status === "完成").length;
  const completionRate =
    contents.length === 0 ? 0 : Math.round((completedCount / contents.length) * 100);

  const groups = new Map<string, EducationContent[]>();
  for (const content of contents) {
    const keys = allMajorCategories(content);
    for (const key of keys.length > 0 ? keys : ["未設定"]) {
      const list = groups.get(key) ?? [];
      list.push(content);
      groups.set(key, list);
    }
  }
  const byMajorCategory = [...groups.entries()]
    .map(([name, items]) => {
      const completed = items.filter((i) => i.status === "完成").length;
      return {
        name,
        count: items.length,
        completed,
        completionRate: items.length === 0 ? 0 : Math.round((completed / items.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count);

  const priorityRank: Record<string, number> = { 最優先: 2, 高: 1 };
  const priorityItems = contents
    .filter((c) => c.priority === "最優先" || c.priority === "高")
    .sort(
      (a, b) =>
        (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0) ||
        a.progress - b.progress
    )
    .slice(0, 8);

  const nextActionItems = contents
    .filter((c) => c.nextAction.trim().length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  return {
    total: contents.length,
    byStatus,
    unclassified,
    completionRate,
    completedCount,
    byMajorCategory,
    priorityItems,
    nextActionItems,
  };
}
