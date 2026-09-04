import {
  emptyCategoryOrder,
  readCategoryOrder,
  writeCategoryOrder,
  type CategoryOrder,
} from "@/lib/category-order";
import { getSupabase, isSupabaseConfigured, toJapaneseError } from "@/lib/supabase";

/**
 * 分類の並び順のような「みんなで共有する設定」の置き場所。
 *
 * ブラウザ内保存のときは、これまでどおりそのブラウザの中に置く。
 * サーバー保存のときは app_settings テーブルに置くので、
 * 別のPCで開いても同じ並び順になる。
 */

const KEY = "category-order";

export async function loadCategoryOrder(): Promise<CategoryOrder> {
  if (!isSupabaseConfigured()) return readCategoryOrder();
  const supabase = getSupabase();
  if (!supabase) return emptyCategoryOrder();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  if (error) return emptyCategoryOrder();
  const value = data?.value as Partial<CategoryOrder> | undefined;
  if (!value) return emptyCategoryOrder();
  return {
    major: Array.isArray(value.major) ? value.major : [],
    middle: value.middle && typeof value.middle === "object" ? value.middle : {},
    small: value.small && typeof value.small === "object" ? value.small : {},
  };
}

export async function saveCategoryOrder(order: CategoryOrder): Promise<void> {
  if (!isSupabaseConfigured()) {
    writeCategoryOrder(order);
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY, value: order }, { onConflict: "key" });
  if (error) throw new Error(toJapaneseError(error, "並び順を保存できませんでした。"));
}
