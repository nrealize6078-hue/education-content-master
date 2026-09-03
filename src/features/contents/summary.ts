import type { ContentStatus, EducationContent } from "@/types/content";

export type Summary = {
  total: number;
  byStatus: Record<ContentStatus, number>;
  unclassified: number;
  overallProgress: number;
  byMajorCategory: Array<{
    name: string;
    count: number;
    completed: number;
    averageProgress: number;
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
    完成: 0,
    保留: 0,
  };
  for (const content of contents) {
    byStatus[content.status] = (byStatus[content.status] ?? 0) + 1;
  }

  const unclassified = contents.filter(
    (c) => c.majorCategory === "分類待ち" || !c.majorCategory.trim()
  ).length;

  const overallProgress =
    contents.length === 0
      ? 0
      : Math.round(contents.reduce((sum, c) => sum + (c.progress || 0), 0) / contents.length);

  const groups = new Map<string, EducationContent[]>();
  for (const content of contents) {
    const key = content.majorCategory || "未設定";
    const list = groups.get(key) ?? [];
    list.push(content);
    groups.set(key, list);
  }
  const byMajorCategory = [...groups.entries()]
    .map(([name, items]) => ({
      name,
      count: items.length,
      completed: items.filter((i) => i.status === "完成").length,
      averageProgress: Math.round(
        items.reduce((sum, i) => sum + (i.progress || 0), 0) / items.length
      ),
    }))
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
    overallProgress,
    byMajorCategory,
    priorityItems,
    nextActionItems,
  };
}
