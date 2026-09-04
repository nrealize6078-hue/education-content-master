"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AUDIENCES,
  CANONICAL_STATUSES,
  CONTENT_PRIORITIES,
  CONTENT_STATUSES,
  MAJOR_CATEGORIES,
  MATERIAL_FORMATS,
  createEmptyDraft,
  type Audience,
  type EducationContentDraft,
} from "@/types/content";
import { Button, Card } from "@/components/ui";
import { useContentStore } from "./content-store";

type Props = {
  initial?: EducationContentDraft;
  submitLabel: string;
  onSubmit: (draft: EducationContentDraft) => Promise<void>;
  onCancel: () => void;
};

export function ContentForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { contents, archived } = useContentStore();
  const baseline = useMemo(() => initial ?? createEmptyDraft(), [initial]);
  const [draft, setDraft] = useState<EducationContentDraft>(baseline);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<{ title?: string; majorCategory?: string }>({});
  const [saving, setSaving] = useState(false);
  const [newMajor, setNewMajor] = useState(false);
  const dirtyRef = useRef(false);

  const allContents = useMemo(() => [...contents, ...archived], [contents, archived]);

  /**
   * 大項目の選択肢は「実際に登録されている値」から作る。
   * 固定の一覧だけを出すと、CSVで入れた分類（例：1｜REALIZE CLUB全体）が
   * 選択肢に無いために、開いただけで別の値へすり替わってしまう。
   */
  const majorOptions = useMemo(() => {
    const fromData = [...new Set(allContents.map((c) => c.majorCategory).filter((v) => v.trim()))].sort(
      (a, b) => a.localeCompare(b, "ja")
    );
    const base = fromData.length > 0 ? fromData : [...MAJOR_CATEGORIES];
    const current = draft.majorCategory.trim();
    return current && !base.includes(current) ? [current, ...base] : base;
  }, [allContents, draft.majorCategory]);

  /** 中項目の候補も、選んだ大項目の中で実際に使われている値から作る。 */
  const middleSuggestions = useMemo(() => {
    const inSameMajor = allContents
      .filter((c) => c.majorCategory === draft.majorCategory)
      .map((c) => c.middleCategory)
      .filter((v) => v.trim());
    return [...new Set(inSameMajor)].sort((a, b) => a.localeCompare(b, "ja"));
  }, [allContents, draft.majorCategory]);

  useEffect(() => setDraft(baseline), [baseline]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  dirtyRef.current = dirty;

  // ブラウザの閉じる／再読み込みに対する未保存警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const set = <K extends keyof EducationContentDraft>(key: K, value: EducationContentDraft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "majorCategory") {
        // 主の大項目と同じものを横断分に残さない
        next.additionalMajorCategories = prev.additionalMajorCategories.filter(
          (v) => v !== value
        );
      }
      return next;
    });
    // 入力し直した項目のエラー表示はその場で消す
    if (key === "title" || key === "majorCategory") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (!draft.tags.includes(value)) set("tags", [...draft.tags, value]);
    setTagInput("");
  };

  const handleCancel = () => {
    if (dirty && !window.confirm("保存していない変更があります。破棄して戻りますか？")) return;
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!draft.title.trim()) nextErrors.title = "タイトルを入力してください。";
    if (!draft.majorCategory.trim()) nextErrors.majorCategory = "大項目を選んでください。";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(nextErrors.title ? "title" : "majorCategory")?.focus();
      return;
    }
    setSaving(true);
    try {
      dirtyRef.current = false;
      await onSubmit({ ...draft, title: draft.title.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-28">
      <Card className="p-5">
        <h2 className="mb-1 text-lg font-bold text-[#0e2245]">基本情報</h2>
        <p className="mb-4 text-sm text-slate-500">
          必須は「タイトル」と「大項目」だけです。他は分かる範囲で後から追加できます。
        </p>

        <Field label="タイトル" htmlFor="title" required error={errors.title}>
          <input
            id="title"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="例：LIFE SHIFT教科書_A4横書き"
            className={inputClass(Boolean(errors.title))}
          />
        </Field>

        <Field label="概要" htmlFor="summary">
          <textarea
            id="summary"
            value={draft.summary}
            onChange={(e) => set("summary", e.target.value)}
            rows={3}
            placeholder="どんな内容の教材かを一言で"
            className={inputClass(false)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="大項目" htmlFor="majorCategory" required error={errors.majorCategory}>
            {newMajor ? (
              <input
                id="majorCategory"
                value={draft.majorCategory}
                onChange={(e) => set("majorCategory", e.target.value)}
                placeholder="新しい大項目の名前"
                className={inputClass(Boolean(errors.majorCategory))}
              />
            ) : (
              <select
                id="majorCategory"
                value={draft.majorCategory}
                onChange={(e) => set("majorCategory", e.target.value)}
                className={inputClass(Boolean(errors.majorCategory))}
              >
                {majorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setNewMajor((v) => !v)}
              className="focus-ring mt-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {newMajor ? "一覧から選ぶ" : "新しい大項目を入力する"}
            </button>
          </Field>

          <Field
            label="横断して入れる大項目"
            htmlFor="additionalMajorCategories"
            hint="この資料を他の大項目にも並べたいときに選びます。いくつでも選べます。"
          >
            <div className="space-y-2">
              {draft.additionalMajorCategories.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {draft.additionalMajorCategories.map((name) => (
                    <li
                      key={name}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#0f5c3f] bg-[#e4f0e9] py-1 pr-1 pl-3 text-sm font-bold text-[#0f5c3f]"
                    >
                      {name}
                      <button
                        type="button"
                        aria-label={`${name} を外す`}
                        title={`${name} を外す`}
                        onClick={() =>
                          set(
                            "additionalMajorCategories",
                            draft.additionalMajorCategories.filter((v) => v !== name)
                          )
                        }
                        className="focus-ring rounded px-1.5 text-base leading-none text-[#0f5c3f] hover:bg-[#c9e0d3]"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">まだ選ばれていません。</p>
              )}
              <select
                id="additionalMajorCategories"
                value=""
                onChange={(e) => {
                  const value = e.target.value;
                  e.target.value = "";
                  if (!value) return;
                  set("additionalMajorCategories", [
                    ...new Set([...draft.additionalMajorCategories, value]),
                  ]);
                }}
                className={inputClass(false)}
              >
                <option value="">＋ 大項目を追加する…</option>
                {majorOptions
                  .filter(
                    (c) =>
                      c !== draft.majorCategory && !draft.additionalMajorCategories.includes(c)
                  )
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </Field>

          <Field label="中項目" htmlFor="middleCategory">
            <input
              id="middleCategory"
              value={draft.middleCategory}
              onChange={(e) => set("middleCategory", e.target.value)}
              list="middle-suggestions"
              placeholder="未設定のままでも登録できます"
              className={inputClass(false)}
            />
            <datalist id="middle-suggestions">
              {middleSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {middleSuggestions.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {middleSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("middleCategory", s)}
                    className="focus-ring rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </Field>

          <Field label="小項目" htmlFor="smallCategory">
            <input
              id="smallCategory"
              value={draft.smallCategory}
              onChange={(e) => set("smallCategory", e.target.value)}
              placeholder="未設定のままでも登録できます"
              className={inputClass(false)}
            />
          </Field>
        </div>

        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          表示イメージ：
          <span className="ml-1 font-bold text-[#0e2245]">
            {draft.majorCategory || "未設定"}
            {draft.additionalMajorCategories.length > 0
              ? `（＋${draft.additionalMajorCategories.join("、")}）`
              : ""}{" "}
            ＞ {draft.middleCategory || "未設定"} ＞{" "}
            {draft.smallCategory || "未設定"}
          </span>
        </p>

        <Field label="対象者（複数選択できます）">
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((audience) => {
              const selected = draft.audience.includes(audience);
              return (
                <button
                  key={audience}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    set(
                      "audience",
                      selected
                        ? draft.audience.filter((a) => a !== audience)
                        : [...draft.audience, audience as Audience]
                    )
                  }
                  className={cn(
                    "focus-ring min-h-[42px] rounded-lg border px-3.5 py-2 text-[15px] font-bold transition",
                    selected
                      ? "border-[#0f5c3f] bg-[#0f5c3f] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {audience}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="タグ" htmlFor="tagInput">
          <div className="flex gap-2">
            <input
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="入力してEnter、または「追加」"
              className={inputClass(false)}
            />
            <Button type="button" onClick={addTag} className="shrink-0">
              追加
            </Button>
          </div>
          {draft.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white py-1 pr-1.5 pl-3 text-sm font-bold text-slate-700"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`${tag} を削除`}
                    onClick={() => set("tags", draft.tags.filter((t) => t !== tag))}
                    className="focus-ring rounded-full px-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </Field>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold text-[#0e2245]">資料情報</h2>

        <Field
          label="元URL"
          htmlFor="sourceUrl"
          hint="Google Drive・Canva・YouTubeなど、ブラウザで開けるURL（https://〜）"
        >
          <input
            id="sourceUrl"
            value={draft.sourceUrl}
            onChange={(e) => set("sourceUrl", e.target.value)}
            placeholder="https://drive.google.com/..."
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="保存場所"
          htmlFor="storageLocation"
          hint="PC内や社内サーバーのパス。ブラウザからは開けないため、コピーして使います。"
        >
          <input
            id="storageLocation"
            value={draft.storageLocation}
            onChange={(e) => set("storageLocation", e.target.value)}
            placeholder="\\REALIZE-SV2\共有\教育資料\LIFE_CORE.pdf"
            className={cn(inputClass(false), "font-mono text-[15px]")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="教材形式" htmlFor="materialFormat">
            <select
              id="materialFormat"
              value={draft.materialFormat}
              onChange={(e) =>
                set("materialFormat", e.target.value as EducationContentDraft["materialFormat"])
              }
              className={inputClass(false)}
            >
              {MATERIAL_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="正本区分" htmlFor="canonicalStatus">
            <select
              id="canonicalStatus"
              value={draft.canonicalStatus}
              onChange={(e) =>
                set("canonicalStatus", e.target.value as EducationContentDraft["canonicalStatus"])
              }
              className={inputClass(false)}
            >
              {CANONICAL_STATUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold text-[#0e2245]">制作状況</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="状態" htmlFor="status">
            <select
              id="status"
              value={draft.status}
              onChange={(e) => set("status", e.target.value as EducationContentDraft["status"])}
              className={inputClass(false)}
            >
              {CONTENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="優先度" htmlFor="priority">
            <select
              id="priority"
              value={draft.priority}
              onChange={(e) => set("priority", e.target.value as EducationContentDraft["priority"])}
              className={inputClass(false)}
            >
              {CONTENT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="担当者" htmlFor="owner">
            <input
              id="owner"
              value={draft.owner}
              onChange={(e) => set("owner", e.target.value)}
              placeholder="例：山田"
              className={inputClass(false)}
            />
          </Field>
        </div>

        <Field label={`完成度：${draft.progress}%`} htmlFor="progress">
          <div className="flex items-center gap-4">
            <input
              id="progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.progress}
              onChange={(e) => set("progress", Number(e.target.value))}
              className="focus-ring h-2 flex-1 cursor-pointer accent-[#0f5c3f]"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={draft.progress}
              onChange={(e) =>
                set("progress", Math.min(100, Math.max(0, Number(e.target.value) || 0)))
              }
              aria-label="完成度（数値入力）"
              className="focus-ring w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-right text-base"
            />
            <span className="text-base font-bold text-slate-600">%</span>
          </div>
        </Field>

        <Field label="不足物" htmlFor="missingItems">
          <textarea
            id="missingItems"
            value={draft.missingItems}
            onChange={(e) => set("missingItems", e.target.value)}
            rows={2}
            placeholder="例：ナレーション音声、確認テスト"
            className={inputClass(false)}
          />
        </Field>

        <Field label="次の作業" htmlFor="nextAction">
          <textarea
            id="nextAction"
            value={draft.nextAction}
            onChange={(e) => set("nextAction", e.target.value)}
            rows={2}
            placeholder="例：第3章の動画を撮影する"
            className={inputClass(false)}
          />
        </Field>

        <Field label="備考" htmlFor="notes">
          <textarea
            id="notes"
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className={inputClass(false)}
          />
        </Field>
      </Card>

      {/* 保存・キャンセルは常に画面下部に固定して迷わせない */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {dirty ? (
            <p className="mr-auto text-sm font-bold text-amber-700">未保存の変更があります</p>
          ) : null}
          <Button type="button" onClick={handleCancel} className="sm:min-w-[140px]">
            キャンセル
          </Button>
          <Button type="submit" variant="primary" disabled={saving} className="sm:min-w-[180px]">
            {saving ? "保存中…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    "focus-ring w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400",
    hasError ? "border-red-500 bg-red-50" : "border-slate-300"
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[15px] font-bold text-slate-800">
        {label}
        {required ? (
          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">
            必須
          </span>
        ) : null}
      </label>
      {hint ? <p className="mb-1.5 text-sm text-slate-500">{hint}</p> : null}
      {children}
      {error ? <p className="mt-1.5 text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
