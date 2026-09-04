"use client";

import { useState } from "react";
import { APP_TAGLINE } from "@/lib/constants";
import { useAuth } from "./auth-provider";

/** ログインしていない人に見せる画面。ここから先へは進めない。 */
export function LoginScreen() {
  const { signIn, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入れてください。");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインできませんでした。");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("先にメールアドレスを入れてください。");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setInfo("パスワード再設定のメールを送りました。メールをご確認ください。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "再設定メールを送れませんでした。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#0e2245]">教育コンテンツMASTER</h1>
          <p className="mt-1 text-slate-600">{APP_TAGLINE}</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-1 text-lg font-bold text-[#0e2245]">ログイン</h2>
          <p className="mb-5 text-[15px] text-slate-600">
            許可されたアカウントのみご利用いただけます。
          </p>

          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[15px] font-bold text-red-800"
            >
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="mb-4 rounded-lg border border-[#0f5c3f] bg-[#e4f0e9] px-4 py-3 text-[15px] font-bold text-[#0f5c3f]">
              {info}
            </p>
          ) : null}

          <label htmlFor="email" className="mb-1 block text-base font-bold text-[#0e2245]">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mb-4 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg"
          />

          <label htmlFor="password" className="mb-1 block text-base font-bold text-[#0e2245]">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring mb-5 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg"
          />

          <button
            type="submit"
            disabled={busy}
            className="focus-ring w-full rounded-lg bg-[#0f5c3f] px-6 py-3.5 text-lg font-bold text-white hover:bg-[#0c4b34] disabled:opacity-60"
          >
            {busy ? "確認しています…" : "ログイン"}
          </button>

          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="focus-ring mt-3 w-full rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-[15px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            パスワードを忘れた
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          アカウントが必要な場合は、管理者にご連絡ください。
        </p>
      </div>
    </div>
  );
}

/** ログインはできたが、許可一覧に載っていない人に見せる画面。 */
export function NotAllowedScreen() {
  const { email, signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border-2 border-amber-300 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#0e2245]">このアカウントは許可されていません</h1>
        <p className="mt-3 text-[15px] leading-7 text-slate-700">
          {email} でログインしましたが、
          <br />
          利用が許可されているアカウントの一覧に入っていません。
        </p>
        <p className="mt-2 text-sm text-slate-500">
          利用が必要な場合は、管理者にこのメールアドレスの追加を依頼してください。
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="focus-ring mt-6 w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-bold text-slate-800 hover:bg-slate-50"
        >
          別のアカウントでログインする
        </button>
      </div>
    </div>
  );
}
