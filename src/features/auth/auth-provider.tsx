"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, isSupabaseConfigured, toJapaneseError } from "@/lib/supabase";

export type AccessRole = "editor" | "viewer";

type AuthValue = {
  /** サーバー保存（ログイン制）で動いているか */
  serverMode: boolean;
  /** 起動直後の判定中 */
  loading: boolean;
  email: string | null;
  /** 許可一覧に載っているか。null は未判定。 */
  role: AccessRole | null;
  /** ログイン済みだが許可一覧に載っていない */
  notAllowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const serverMode = isSupabaseConfigured();
  const [loading, setLoading] = useState(serverMode);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AccessRole | null>(null);
  const [checked, setChecked] = useState(false);

  /** 許可一覧に載っているかをサーバーに聞く */
  const loadRole = useCallback(async (address: string | null) => {
    const supabase = getSupabase();
    if (!supabase || !address) {
      setRole(null);
      setChecked(true);
      return;
    }
    const { data } = await supabase
      .from("allowed_users")
      .select("role")
      .ilike("email", address)
      .maybeSingle();
    setRole((data?.role as AccessRole) ?? null);
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!serverMode) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const address = data.session?.user.email ?? null;
      setEmail(address);
      await loadRole(address);
      if (alive) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const address = session?.user.email ?? null;
      setEmail(address);
      setChecked(false);
      void loadRole(address);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [serverMode, loadRole]);

  const value = useMemo<AuthValue>(
    () => ({
      serverMode,
      loading,
      email,
      role,
      notAllowed: serverMode && email !== null && checked && role === null,
      signIn: async (address, password) => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("サーバーへの接続が設定されていません。");
        const { error } = await supabase.auth.signInWithPassword({
          email: address.trim(),
          password,
        });
        if (error) throw new Error(toJapaneseError(error, "ログインできませんでした。"));
      },
      signOut: async () => {
        const supabase = getSupabase();
        if (!supabase) return;
        await supabase.auth.signOut();
        setEmail(null);
        setRole(null);
      },
      sendPasswordReset: async (address) => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("サーバーへの接続が設定されていません。");
        const { error } = await supabase.auth.resetPasswordForEmail(address.trim(), {
          redirectTo: window.location.origin + window.location.pathname,
        });
        if (error) throw new Error(toJapaneseError(error, "再設定メールを送れませんでした。"));
      },
    }),
    [serverMode, loading, email, role, checked]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth は AuthProvider の内側で使用してください。");
  return context;
}
