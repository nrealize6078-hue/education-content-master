"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { useContentStore } from "@/features/contents/content-store";
import { ToastArea } from "./ui";

const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/import", label: "CSV取り込み" },
  { href: "/backup", label: "バックアップ" },
  { href: "/archive", label: "アーカイブ" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toasts, dismissToast, archived } = useContentStore();

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
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-[1400px] px-4 pb-10 text-sm text-slate-500 sm:px-6">
        データはこのブラウザ内（ローカルストレージ）に保存されています。別のPCとは共有されません。
      </footer>

      <ToastArea toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
