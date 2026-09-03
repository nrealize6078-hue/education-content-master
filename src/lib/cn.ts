/** Tailwindクラスを結合する小さなヘルパー（外部ライブラリ不要）。 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
