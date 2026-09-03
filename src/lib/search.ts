/**
 * ひらがな・カタカナ・全角半角の違いを吸収した検索用の正規化。
 * 「ライフ」で検索しても「らいふ」がヒットするようにする。
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFKC") // 全角英数・記号 → 半角
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) + 0x60)
    ); // ひらがな → カタカナに統一
}

export function includesKeyword(haystack: string, keyword: string): boolean {
  if (!keyword.trim()) return true;
  return normalizeForSearch(haystack).includes(normalizeForSearch(keyword));
}
