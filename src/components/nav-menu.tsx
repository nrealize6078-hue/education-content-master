"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { allMajorCategories } from "@/types/content";
import { labelOf, makeComparator } from "@/lib/category-order";
import { BOARD_HREF, majorHref } from "@/lib/nav";
import { useContentStore } from "@/features/contents/content-store";

const PAGES = [
  { href: "/", label: "ホーム（大項目から探す）" },
  { href: "/contents/new", label: "＋ 新しい教材を登録" },
  { href: "/manual", label: "使い方（操作マニュアル）" },
  { href: "/categories", label: "分類の管理" },
  { href: "/import", label: "CSV取り込み" },
  { href: "/backup", label: "バックアップ" },
  { href: "/archive", label: "アーカイブ" },
];

/**
 * どの画面からでも開けるメニュー。
 * 詳細画面から目的の大項目へ、ホームを経由せず一度で移動できるようにする。
 */
export function NavMenu() {
  const { contents, categoryOrder } = useContentStore();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 画面が変わったら閉じる
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 大項目ごとの件数（横断して入れている分も数える）
  const counts = new Map<string, number>();
  for (const content of contents) {
    const keys = allMajorCategories(content);
    for (const key of keys.length > 0 ? keys : [labelOf(content.majorCategory)]) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  // 1件も無い大項目（作っただけの棚）も出す
  for (const name of categoryOrder.major) {
    if (!counts.has(name)) counts.set(name, 0);
  }
  const compare = makeComparator(categoryOrder.major);
  const majors = [...counts.entries()].sort((a, b) => compare(a[0], b[0]));

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="メニューを開く（他の大項目へ移動できます）"
        className="focus-ring inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-base font-bold whitespace-nowrap text-white hover:bg-white/10"
      >
        <span aria-hidden className="text-lg leading-none">
          ☰
        </span>
        メニュー
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="メニュー"
            className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
              <h2 className="text-lg font-bold text-[#0e2245]">メニュー</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-bold text-slate-700 hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <nav className="px-3 py-3">
              <p className="px-2 pb-1 text-sm font-bold text-slate-500">画面</p>
              <ul>
                {PAGES.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="focus-ring block rounded-lg px-3 py-3 text-[15px] font-bold text-slate-800 hover:bg-slate-100"
                    >
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-slate-200 px-3 py-3">
              <p className="px-2 pb-1 text-sm font-bold text-slate-500">大項目へ移動</p>
              <ul>
                <li>
                  <Link
                    href={majorHref(null)}
                    className="focus-ring flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-[15px] font-bold text-slate-800 hover:bg-slate-100"
                  >
                    <span>すべての教材</span>
                    <span className="shrink-0 text-sm tabular-nums text-slate-500">
                      {contents.length}件
                    </span>
                  </Link>
                </li>
                {majors.map(([name, count]) => (
                  <li key={name}>
                    <Link
                      href={majorHref(name)}
                      className="focus-ring flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-[15px] text-slate-800 hover:bg-slate-100"
                    >
                      <span className="min-w-0 break-words">{name}</span>
                      <span className="shrink-0 text-sm tabular-nums text-slate-500">
                        {count}件
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {majors.length === 0 ? (
                <p className="px-3 py-3 text-[15px] text-slate-500">
                  まだ大項目がありません。
                </p>
              ) : null}
            </div>

            <div className="mt-auto border-t border-slate-200 px-3 py-3">
              <Link
                href={BOARD_HREF}
                className="focus-ring block rounded-lg bg-[#0f5c3f] px-4 py-3 text-center text-base font-bold text-white hover:bg-[#0c4b34]"
              >
                大項目の一覧へ
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
