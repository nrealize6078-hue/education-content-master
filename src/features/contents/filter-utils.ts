import type { ContentFilters, EducationContent, SortOrder } from "@/types/content";
import { includesKeyword } from "@/lib/search";

function matchesArrayFilter(value: string, selected: string[]): boolean {
  return selected.length === 0 || selected.includes(value);
}

function matchesMultiFilter(values: string[], selected: string[]): boolean {
  return selected.length === 0 || values.some((v) => selected.includes(v));
}

export function contentMatchesKeyword(content: EducationContent, keyword: string): boolean {
  if (!keyword.trim()) return true;
  const haystacks = [
    content.title,
    content.summary,
    content.majorCategory,
    content.middleCategory,
    content.smallCategory,
    content.tags.join(" "),
    content.audience.join(" "),
    content.materialFormat,
    content.owner,
    content.missingItems,
    content.nextAction,
    content.notes,
  ];
  return haystacks.some((field) => includesKeyword(field ?? "", keyword));
}

export function applyFilters(
  contents: EducationContent[],
  filters: ContentFilters
): EducationContent[] {
  return contents.filter((content) => {
    if (!contentMatchesKeyword(content, filters.keyword)) return false;
    if (!matchesArrayFilter(content.majorCategory, filters.majorCategory)) return false;
    if (!matchesArrayFilter(content.middleCategory, filters.middleCategory)) return false;
    if (!matchesArrayFilter(content.status, filters.status)) return false;
    if (!matchesArrayFilter(content.materialFormat, filters.materialFormat)) return false;
    if (!matchesArrayFilter(content.priority, filters.priority)) return false;
    if (!matchesArrayFilter(content.canonicalStatus, filters.canonicalStatus)) return false;
    if (!matchesArrayFilter(content.owner, filters.owner)) return false;
    if (!matchesMultiFilter(content.audience, filters.audience)) return false;
    return true;
  });
}

/** 「1｜」「10｜」のような番号付きの名前を数字として正しく並べる */
function compareJa(a: string, b: string): number {
  return a.localeCompare(b, "ja", { numeric: true, sensitivity: "base" });
}

/** 未設定・空欄は末尾へ回す */
function categoryKey(value: string): string {
  const v = value.trim();
  return v && v !== "未設定" ? v : "￿";
}

const PRIORITY_RANK: Record<string, number> = {
  最優先: 4,
  高: 3,
  中: 2,
  低: 1,
  未設定: 0,
};

export function sortContents(contents: EducationContent[], order: SortOrder): EducationContent[] {
  const items = [...contents];
  switch (order) {
    case "categoryAsc":
      return items.sort(
        (a, b) =>
          compareJa(categoryKey(a.majorCategory), categoryKey(b.majorCategory)) ||
          compareJa(categoryKey(a.middleCategory), categoryKey(b.middleCategory)) ||
          compareJa(categoryKey(a.smallCategory), categoryKey(b.smallCategory)) ||
          compareJa(a.title, b.title)
      );
    case "updatedDesc":
      return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "updatedAsc":
      return items.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    case "titleAsc":
      return items.sort((a, b) => a.title.localeCompare(b.title, "ja"));
    case "progressDesc":
      return items.sort((a, b) => b.progress - a.progress);
    case "progressAsc":
      return items.sort((a, b) => a.progress - b.progress);
    case "priorityDesc":
      return items.sort(
        (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
      );
    case "createdDesc":
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return items;
  }
}

export function countActiveFilters(filters: ContentFilters): number {
  return (
    filters.majorCategory.length +
    filters.middleCategory.length +
    filters.status.length +
    filters.audience.length +
    filters.materialFormat.length +
    filters.priority.length +
    filters.canonicalStatus.length +
    filters.owner.length +
    (filters.keyword.trim() ? 1 : 0)
  );
}
