"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { STATUS_STYLES } from "@/lib/constants";
import type { ContentStatus } from "@/types/content";

/** 状態バッジ。色だけに頼らず必ず文字も出す。 */
export function StatusBadge({ status }: { status: ContentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold whitespace-nowrap",
        style.badge
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const safe = Math.min(100, Math.max(0, Math.round(value || 0)));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="完成度"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            safe >= 100 ? "bg-emerald-600" : safe >= 50 ? "bg-[#0f5c3f]" : "bg-amber-500"
          )}
          style={{ width: `${safe}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-slate-700">
        {safe}%
      </span>
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  const base =
    "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-bold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-45";
  const sizes = {
    md: "px-5 py-2.5 text-base min-h-[44px]",
    sm: "px-3.5 py-2 text-sm min-h-[38px]",
  };
  const variants = {
    primary: "bg-[#0f5c3f] text-white hover:bg-[#0c4b34] shadow-sm",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-[#0e2245]">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <p className="text-lg font-bold text-slate-700">{title}</p>
      {description ? <p className="mt-2 text-slate-500">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "読み込み中です…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-14 text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#0f5c3f]" />
      {label}
    </div>
  );
}

/** モーダル。Escapeで閉じ、背景クリックでも閉じる。 */
export function Modal({
  open,
  onClose,
  title,
  children,
  widthClassName = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl",
          widthClassName
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-[#0e2245]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="focus-ring rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            閉じる
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ToastArea({
  toasts,
  onDismiss,
}: {
  toasts: Array<{ id: string; message: string; tone: "success" | "error" }>;
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,460px)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-base font-bold shadow-lg",
            toast.tone === "success" ? "bg-[#0f5c3f] text-white" : "bg-red-600 text-white"
          )}
        >
          <span className="min-w-0 break-words">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="通知を閉じる"
            className="focus-ring shrink-0 rounded px-2 text-white/90 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
