"use client";

import type { ReactNode } from "react";
import { ContentStoreProvider } from "@/features/contents/content-store";
import { AppShell } from "@/components/app-shell";
import { AuthProvider, useAuth } from "@/features/auth/auth-provider";
import { LoginScreen, NotAllowedScreen } from "@/features/auth/login-screen";
import { LoadingState } from "@/components/ui";

/**
 * サーバー保存（ログイン制）で動いているときは、
 * 許可されたアカウントでログインするまで中身を作らない。
 * ブラウザ内保存で動いているときは、これまでどおりそのまま表示する。
 */
function Gate({ children }: { children: ReactNode }) {
  const { serverMode, loading, email, role, notAllowed } = useAuth();

  if (!serverMode) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="確認しています…" />
      </div>
    );
  }
  if (!email) return <LoginScreen />;
  if (notAllowed) return <NotAllowedScreen />;
  if (role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="確認しています…" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Gate>
        <ContentStoreProvider>
          <AppShell>{children}</AppShell>
        </ContentStoreProvider>
      </Gate>
    </AuthProvider>
  );
}
