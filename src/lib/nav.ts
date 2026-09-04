/**
 * 画面と画面のつながり。
 * いま開いている大項目はURLに持たせるので、
 * 詳細画面から戻ったときも同じ大項目へ戻れるし、
 * メニューから直接その大項目へ飛べる。
 */

/** 大項目の一覧を開くURL。null を渡すと「すべての教材」。 */
export function majorHref(major: string | null): string {
  if (major === null) return "/?view=all";
  return `/?major=${encodeURIComponent(major)}`;
}

/** 大項目のカード一覧（ホーム）を開くURL */
export const BOARD_HREF = "/";
