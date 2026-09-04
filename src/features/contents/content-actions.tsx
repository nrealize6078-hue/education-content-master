"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { isOpenableUrl } from "@/lib/format";
import type { EducationContent } from "@/types/content";
import { Button } from "@/components/ui";

/** 「大項目 ＞ 中項目 ＞ 小項目」をこの順で表示する。未設定は明示する。 */
/** 横断して入れている大項目を並べる印 */
export function CrossMajorTags({
  content,
  className,
}: {
  content: EducationContent;
  className?: string;
}) {
  const extra = (content.additionalMajorCategories ?? []).filter((v) => v.trim());
  if (extra.length === 0) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      <span className="text-sm text-slate-500">＋</span>
      {extra.map((name) => (
        <span
          key={name}
          title={`この資料は「${name}」にも入っています`}
          className="rounded-md border border-[#0f5c3f]/40 bg-[#e4f0e9] px-1.5 py-0.5 text-sm font-bold text-[#0f5c3f]"
        >
          {name}
        </span>
      ))}
    </span>
  );
}

export function CategoryPath({
  content,
  className,
  hideMajor,
}: {
  content: EducationContent;
  className?: string;
  /** 一覧では大項目を選択欄で出すため、パス表示からは省ける */
  hideMajor?: boolean;
}) {
  const parts = hideMajor
    ? [content.middleCategory, content.smallCategory]
    : [content.majorCategory, content.middleCategory, content.smallCategory];
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1 text-sm", className)}>
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-slate-400">＞</span> : null}
          <span
            className={cn(
              part?.trim() ? "text-slate-700" : "text-slate-400",
              index === 0 && !hideMajor && "font-bold text-[#0e2245]"
            )}
          >
            {part?.trim() || "未設定"}
          </span>
        </span>
      ))}
    </span>
  );
}

/** 元URLを新しいタブで開く。URLが無い／不正なら押せないようにする。 */
export function OpenSourceButton({
  content,
  size = "sm",
  className,
}: {
  content: EducationContent;
  size?: "md" | "sm";
  className?: string;
}) {
  const hasUrl = content.sourceUrl.trim().length > 0;
  const openable = isOpenableUrl(content.sourceUrl);

  if (!hasUrl) {
    return (
      <Button
        size={size}
        disabled
        title="元URLが登録されていません"
        className={className}
      >
        URL未登録
      </Button>
    );
  }

  if (!openable) {
    return (
      <Button
        size={size}
        variant="secondary"
        className={cn("border-amber-400 text-amber-800", className)}
        title="http/https 以外のURLのため、このボタンからは開けません"
        onClick={(e) => {
          e.stopPropagation();
          window.alert(
            "URLの形式が正しくないため開けません。\n\n" +
              `登録値：${content.sourceUrl}\n\n` +
              "http:// または https:// で始まるURLに修正してください。\n" +
              "PC内や社内サーバーのパスは「保存場所」欄をご利用ください。"
          );
        }}
      >
        URL形式エラー
      </Button>
    );
  }

  return (
    <a
      href={content.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "focus-ring inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-[#0f5c3f] px-3.5 py-2 text-sm font-bold whitespace-nowrap text-white transition hover:bg-[#0c4b34]",
        size === "md" && "min-h-[44px] px-5 py-2.5 text-base",
        className
      )}
      title="元資料を新しいタブで開きます"
    >
      資料を開く
      <span aria-hidden>↗</span>
    </a>
  );
}

/** 社内サーバー／PC内のパスはブラウザから開けないため、コピーして案内する。 */
export function StorageLocationBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  if (!value.trim()) {
    return <p className="text-slate-400">未登録</p>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("下の保存場所をコピーしてください", value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
          {value}
        </code>
        <Button size="sm" onClick={copy}>
          {copied ? "コピーしました" : "保存場所をコピー"}
        </Button>
      </div>
      <p className="text-sm text-slate-500">
        エクスプローラーで開くには、コピーした場所を貼り付けてください。
        （ブラウザの安全制限により、PC内・社内サーバーのパスは直接開けません）
      </p>
    </div>
  );
}

type ActionMenuProps = {
  content: EducationContent;
  onDuplicate: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onHardDelete: () => void;
  showDetailLink?: boolean;
  /** 行内に削除ボタンを別途置く場合、メニュー側は隠す */
  hideHardDelete?: boolean;
  /** 表の行では幅を節約するため「⋯」表示にする */
  compact?: boolean;
};

/** 一覧行の「その他の操作」メニュー。 */
export function ActionMenu({
  content,
  onDuplicate,
  onArchive,
  onRestore,
  onHardDelete,
  showDetailLink = true,
  hideHardDelete = false,
  compact = false,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "block w-full px-4 py-3 text-left text-[15px] font-bold text-slate-700 hover:bg-slate-100 focus-ring";

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="その他の操作（複製・アーカイブなど）"
        aria-label="その他の操作"
        className={compact ? "px-2.5" : undefined}
      >
        {compact ? "⋯" : "その他 ▾"}
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {showDetailLink ? (
            <Link href={`/contents/detail?id=${content.id}`} className={item} role="menuitem">
              詳細を見る
            </Link>
          ) : null}
          <Link href={`/contents/edit?id=${content.id}`} className={item} role="menuitem">
            編集
          </Link>
          <button
            type="button"
            className={item}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          >
            複製
          </button>
          {onArchive ? (
            <button
              type="button"
              className={item}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onArchive();
              }}
            >
              アーカイブ
            </button>
          ) : null}
          {onRestore ? (
            <button
              type="button"
              className={item}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onRestore();
              }}
            >
              アーカイブから戻す
            </button>
          ) : null}
          {hideHardDelete ? null : (
            <button
              type="button"
              className="focus-ring block w-full border-t border-slate-200 px-4 py-3 text-left text-[15px] font-bold text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onHardDelete();
              }}
            >
              完全に削除
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
