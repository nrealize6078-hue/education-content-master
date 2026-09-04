import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase（サーバー保存）への接続。
 *
 * 接続先が設定されていないときは null を返し、アプリは従来どおり
 * ブラウザ内保存で動く。設定してあるときだけログイン制に切り替わる。
 *
 * ここで使う anon キーは公開してよい値で、これ単体では何も読めない。
 * 誰が読み書きできるかは Supabase 側の行レベルセキュリティ（RLS）と
 * allowed_users の一覧で決まる。
 */

/**
 * 接続先URLの表記ゆれを吸収する。
 * Supabaseの画面には用途別に `/rest/v1/` などが付いたURLも表示されるため、
 * それを貼られても動くように、末尾の余分な部分を取り除いておく。
 */
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  return trimmed
    .replace(/\/(rest|auth|storage|realtime|functions)\/v\d+\/?$/i, "")
    .replace(/\/+$/, "");
}

const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export function isSupabaseConfigured(): boolean {
  return url.trim() !== "" && anonKey.trim() !== "";
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") return null;
  client ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** 画面に出すための、分かりやすい日本語のエラー文にする */
export function toJapaneseError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const table: [RegExp, string][] = [
    [/Invalid login credentials/i, "メールアドレスかパスワードが違います。"],
    [/Email not confirmed/i, "メールアドレスの確認が済んでいません。届いたメールから確認してください。"],
    [/User already registered/i, "このメールアドレスはすでに登録されています。"],
    [/Password should be at least/i, "パスワードが短すぎます。6文字以上にしてください。"],
    [/rate limit|too many requests/i, "回数の上限に達しました。しばらく待ってからお試しください。"],
    [/row-level security|violates row-level/i, "このアカウントには権限がありません。管理者に許可を依頼してください。"],
    [/JWT|not authenticated|session/i, "ログインの有効期限が切れました。もう一度ログインしてください。"],
    [/Failed to fetch|NetworkError/i, "サーバーにつながりませんでした。通信環境をご確認ください。"],
  ];
  for (const [pattern, text] of table) {
    if (pattern.test(message)) return text;
  }
  return message ? `${fallback}（${message}）` : fallback;
}
