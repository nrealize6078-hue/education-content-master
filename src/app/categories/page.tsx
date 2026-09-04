"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, LoadingState } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import {
  buildCategoryTree,
  labelOf,
  middleKey,
  moveWithin,
  renameInOrder,
  smallKey,
  UNSET,
  valueOf,
  type CategoryOrder,
} from "@/lib/category-order";
import { allMajorCategories, type EducationContent } from "@/types/content";

type Level = "major" | "middle" | "small";
type Target = { level: Level; major: string; middle?: string; name: string };

function sameKey(a: Target | null, b: Target): boolean {
  return (
    a !== null &&
    a.level === b.level &&
    a.major === b.major &&
    (a.middle ?? "") === (b.middle ?? "") &&
    a.name === b.name
  );
}

export default function CategoriesPage() {
  const { contents, archived, loading, bulkUpdate, categoryOrder, setCategoryOrder, notify } =
    useContentStore();

  const [editing, setEditing] = useState<Target | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [openMajors, setOpenMajors] = useState<Set<string>>(new Set());

  /** アーカイブ分も名前の変更対象にする（片方だけ古い名前で残らないように） */
  const all = useMemo(() => [...contents, ...archived], [contents, archived]);
  const tree = useMemo(() => buildCategoryTree(all, categoryOrder), [all, categoryOrder]);

  const startEdit = (target: Target) => {
    setEditing(target);
    setDraft(target.name === UNSET ? "" : target.name);
  };

  /** 名前を変える。その分類を使っている教材すべてを書き換える。 */
  const commitRename = async (target: Target) => {
    const next = draft.trim();
    setEditing(null);
    if (next === "" || next === target.name) return;

    const matches = (c: EducationContent): boolean => {
      if (!allMajorCategories(c).includes(target.major)) return false;
      if (target.level === "major") return true;
      if (labelOf(c.middleCategory) !== (target.level === "middle" ? target.name : target.middle))
        return false;
      if (target.level === "middle") return true;
      return labelOf(c.smallCategory) === target.name;
    };

    const targets = all.filter(matches);
    const ids = targets.map((c) => c.id);
    if (ids.length === 0) return;

    setBusy(true);
    try {
      if (target.level === "major") {
        // 主の大項目として使っている分と、横断分とで書き換え先が違うので分けて行う
        const asPrimary = targets.filter((c) => c.majorCategory.trim() === valueOf(target.name));
        const asExtra = targets.filter((c) => c.majorCategory.trim() !== valueOf(target.name));
        if (asPrimary.length > 0) {
          await bulkUpdate(
            asPrimary.map((c) => c.id),
            { majorCategory: valueOf(next) }
          );
        }
        for (const content of asExtra) {
          await bulkUpdate([content.id], {
            additionalMajorCategories: content.additionalMajorCategories.map((v) =>
              v.trim() === valueOf(target.name) ? valueOf(next) : v
            ),
          });
        }
      } else {
        const field = target.level === "middle" ? "middleCategory" : "smallCategory";
        await bulkUpdate(ids, { [field]: valueOf(next) });
      }
      await setCategoryOrder(
        renameInOrder(
          categoryOrder,
          target.level,
          { major: target.major, middle: target.middle },
          target.name,
          next
        )
      );
      notify(`「${target.name}」を「${next}」に変えました（${ids.length}件）。`);
    } finally {
      setBusy(false);
    }
  };

  /** 並び順をひとつ動かす */
  const move = async (target: Target, delta: number) => {
    let next: CategoryOrder;
    if (target.level === "major") {
      next = {
        ...categoryOrder,
        major: moveWithin(
          categoryOrder.major,
          tree.map((m) => m.name),
          target.name,
          delta
        ),
      };
    } else if (target.level === "middle") {
      const key = middleKey(target.major);
      const visible = tree.find((m) => m.name === target.major)?.middles.map((m) => m.name) ?? [];
      next = {
        ...categoryOrder,
        middle: {
          ...categoryOrder.middle,
          [key]: moveWithin(categoryOrder.middle[key] ?? [], visible, target.name, delta),
        },
      };
    } else {
      const key = smallKey(target.major, target.middle ?? "");
      const visible =
        tree
          .find((m) => m.name === target.major)
          ?.middles.find((m) => m.name === target.middle)
          ?.smalls.map((s) => s.name) ?? [];
      next = {
        ...categoryOrder,
        small: {
          ...categoryOrder.small,
          [key]: moveWithin(categoryOrder.small[key] ?? [], visible, target.name, delta),
        },
      };
    }
    await setCategoryOrder(next);
  };

  const resetOrder = async () => {
    await setCategoryOrder({ major: [], middle: {}, small: {} });
    notify("並び順を名前順に戻しました。");
  };

  const toggleMajor = (name: string) =>
    setOpenMajors((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const expandAll = () => setOpenMajors(new Set(tree.map((m) => m.name)));
  const collapseAll = () => setOpenMajors(new Set());

  return (
    <div className="space-y-5">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <span>分類の管理</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-[#0e2245]">分類の管理</h1>
        <p className="mt-1 text-slate-600">
          大項目・中項目・小項目の名前を変えたり、並ぶ順番を入れ替えたりできます。
          <br className="hidden sm:block" />
          名前を変えると、その分類を使っている教材すべてが同時に書き換わります。
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : tree.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-lg font-bold text-slate-700">まだ分類がありません。</p>
          <p className="mt-2 text-slate-500">教材を登録すると、ここに分類が出てきます。</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Button onClick={expandAll}>すべて開く</Button>
            <Button onClick={collapseAll}>すべて閉じる</Button>
            <Button onClick={resetOrder} className="ml-auto">
              並び順を名前順に戻す
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            ▲▼ で順番を入れ替え、✎ で名前を変えられます。並び順は「大項目順」で並べたときに使われます。
          </p>

          <ul className="space-y-3">
            {tree.map((major, majorIndex) => {
              const majorTarget: Target = {
                level: "major",
                major: major.name,
                name: major.name,
              };
              const open = openMajors.has(major.name);
              return (
                <li
                  key={major.name}
                  className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-[#f3f7f4] px-3 py-3 sm:px-4">
                    <MoveButtons
                      disabled={busy}
                      canUp={majorIndex > 0}
                      canDown={majorIndex < tree.length - 1}
                      onUp={() => void move(majorTarget, -1)}
                      onDown={() => void move(majorTarget, 1)}
                    />

                    {sameKey(editing, majorTarget) ? (
                      <RenameField
                        value={draft}
                        onChange={setDraft}
                        onCommit={() => void commitRename(majorTarget)}
                        onCancel={() => setEditing(null)}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleMajor(major.name)}
                          className="focus-ring min-w-0 flex-1 rounded text-left"
                          aria-expanded={open}
                        >
                          <span className="text-lg font-bold break-words text-[#0e2245]">
                            {open ? "▼" : "▶"} {major.name}
                          </span>
                          <span className="ml-2 text-[15px] text-slate-600">
                            {major.count}件 ／ 中項目 {major.middles.length}
                          </span>
                        </button>
                        <EditButton
                          disabled={busy || major.name === UNSET}
                          onClick={() => startEdit(majorTarget)}
                        />
                      </>
                    )}
                  </div>

                  {open ? (
                    <ul className="divide-y divide-slate-100">
                      {major.middles.map((middle, middleIndex) => {
                        const middleTarget: Target = {
                          level: "middle",
                          major: major.name,
                          name: middle.name,
                        };
                        return (
                          <li key={middle.name} className="px-3 py-2 sm:px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-300">└</span>
                              <MoveButtons
                                disabled={busy}
                                canUp={middleIndex > 0}
                                canDown={middleIndex < major.middles.length - 1}
                                onUp={() => void move(middleTarget, -1)}
                                onDown={() => void move(middleTarget, 1)}
                              />
                              {sameKey(editing, middleTarget) ? (
                                <RenameField
                                  value={draft}
                                  onChange={setDraft}
                                  onCommit={() => void commitRename(middleTarget)}
                                  onCancel={() => setEditing(null)}
                                />
                              ) : (
                                <>
                                  <span className="min-w-0 flex-1 font-bold break-words text-slate-800">
                                    {middle.name}
                                    <span className="ml-2 text-sm font-normal text-slate-500">
                                      {middle.count}件
                                    </span>
                                  </span>
                                  <EditButton
                                    disabled={busy || middle.name === UNSET}
                                    onClick={() => startEdit(middleTarget)}
                                  />
                                </>
                              )}
                            </div>

                            {middle.smalls.length > 0 &&
                            !(middle.smalls.length === 1 && middle.smalls[0]!.name === UNSET) ? (
                              <ul className="mt-1 mb-1 space-y-1 pl-6">
                                {middle.smalls.map((small, smallIndex) => {
                                  const smallTarget: Target = {
                                    level: "small",
                                    major: major.name,
                                    middle: middle.name,
                                    name: small.name,
                                  };
                                  return (
                                    <li
                                      key={small.name}
                                      className="flex flex-wrap items-center gap-2"
                                    >
                                      <span className="text-slate-300">└</span>
                                      <MoveButtons
                                        disabled={busy}
                                        canUp={smallIndex > 0}
                                        canDown={smallIndex < middle.smalls.length - 1}
                                        onUp={() => void move(smallTarget, -1)}
                                        onDown={() => void move(smallTarget, 1)}
                                      />
                                      {sameKey(editing, smallTarget) ? (
                                        <RenameField
                                          value={draft}
                                          onChange={setDraft}
                                          onCommit={() => void commitRename(smallTarget)}
                                          onCancel={() => setEditing(null)}
                                        />
                                      ) : (
                                        <>
                                          <span className="min-w-0 flex-1 break-words text-slate-700">
                                            {small.name}
                                            <span className="ml-2 text-sm text-slate-500">
                                              {small.count}件
                                            </span>
                                          </span>
                                          <EditButton
                                            disabled={busy || small.name === UNSET}
                                            onClick={() => startEdit(smallTarget)}
                                          />
                                        </>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function MoveButtons({
  canUp,
  canDown,
  onUp,
  onDown,
  disabled,
}: {
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  disabled: boolean;
}) {
  const base =
    "focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-base font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35";
  return (
    <span className="flex shrink-0 gap-1">
      <button
        type="button"
        className={base}
        onClick={onUp}
        disabled={disabled || !canUp}
        aria-label="ひとつ上へ移動"
        title="ひとつ上へ移動"
      >
        ▲
      </button>
      <button
        type="button"
        className={base}
        onClick={onDown}
        disabled={disabled || !canDown}
        aria-label="ひとつ下へ移動"
        title="ひとつ下へ移動"
      >
        ▼
      </button>
    </span>
  );
}

function EditButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="名前を変える"
      title={disabled ? "「（未設定）」は名前を変えられません" : "名前を変える"}
      className="focus-ring inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold whitespace-nowrap text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
    >
      ✎ 名前
    </button>
  );
}

function RenameField({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit();
          }
          if (e.key === "Escape") onCancel();
        }}
        aria-label="新しい名前"
        className="focus-ring min-w-[12rem] flex-1 rounded-lg border-2 border-[#0f5c3f] bg-white px-3 py-2 text-[15px] font-bold text-[#0e2245]"
      />
      <button
        type="button"
        onClick={onCommit}
        className="focus-ring inline-flex h-9 shrink-0 items-center rounded-lg bg-[#0f5c3f] px-4 text-sm font-bold whitespace-nowrap text-white hover:bg-[#0c4b34]"
      >
        変更する
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="focus-ring inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold whitespace-nowrap text-slate-700 hover:bg-slate-100"
      >
        取消
      </button>
    </span>
  );
}
