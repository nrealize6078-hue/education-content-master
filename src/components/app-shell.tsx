"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { useContentStore } from "@/features/contents/content-store";
import { useAuth } from "@/features/auth/auth-provider";
import { ToastArea } from "./ui";

const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/categories", label: "分類の管理" },
  { href: "/import", label: "CSV取り込み" },
  { href: "/backup", label: "バックアップ" },
  { href: "/archive", label: "アーカイブ" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toasts, dismissToast, archived } = useContentStore();
  const { serverMode, email, role, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#0e2245] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="focus-ring flex items-baseline gap-3 rounded-lg">
            <span className="text-xl font-bold tracking-wide">{APP_NAME}</span>
            <span className="hidden text-sm text-white/70 lg:inline">{APP_TAGLINE}</span>
          </Link>
          <nav className="-mx-1 flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring rounded-lg px-3.5 py-2 text-[15px] font-bold whitespace-nowrap transition",
                    active ? "bg-white text-[#0e2245]" : "text-white/85 hover:bg-white/10"
                  )}
                >
                  {item.label}
                  {item.href === "/archive" && archived.length > 0 ? (
                    <span className="ml-1.5 rounded-full bg-slate-500/70 px-2 py-0.5 text-xs text-white">
                      {archived.length}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {serverMode && email ? (
            <div className="flex flex-wrap items-center gap-2 pb-2 text-sm">
              <span className="rounded-lg bg-white/10 px-2.5 py-1 font-bold text-white/90">
                {email}
                {role === "viewer" ? "（閲覧のみ）" : ""}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="focus-ring rounded-lg border border-white/30 px-3 py-1 font-bold text-white hover:bg-white/10"
              >
                ログアウト
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-[1400px] px-4 pb-10 text-sm text-slate-500 sm:px-6">
        データはこのブラウザ内に保存されます。「バックアップ」で保存先ファイルを決めておくと、変更のたびに自動でファイルへ書き出され、消えなくなります。
      </footer>

      <ToastArea toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
