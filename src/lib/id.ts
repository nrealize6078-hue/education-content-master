/** ブラウザ標準の crypto.randomUUID を使う（外部ライブラリ不要）。 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // 極めて古い環境向けのフォールバック
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
