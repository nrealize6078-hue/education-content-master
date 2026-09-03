"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EducationContentDraft } from "@/types/content";
import { EmptyState, LoadingState } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import { ContentForm } from "@/features/contents/content-form";

export default function EditContentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditContent />
    </Suspense>
  );
}

function EditContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const { contents, archived, loading, update } = useContentStore();

  const content = useMemo(
    () => [...contents, ...archived].find((c) => c.id === id) ?? null,
    [contents, archived, id]
  );

  const initial: EducationContentDraft | undefined = useMemo(() => {
    if (!content) return undefined;
    const { id: _id, createdAt, updatedAt, archivedAt, ...draft } = content;
    void _id;
    void createdAt;
    void updatedAt;
    void archivedAt;
    return draft;
  }, [content]);

  if (loading) return <LoadingState />;

  if (!content || !initial) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <EmptyState title="コンテンツが見つかりません。" />
        <div className="text-center">
          <Link href="/" className="focus-ring rounded font-bold text-[#0f5c3f] hover:underline">
            ← 一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <Link
          href={`/contents/detail?id=${content.id}`}
          className="focus-ring rounded font-bold hover:underline"
        >
          詳細
        </Link>
        <span className="mx-2">＞</span>
        <span>編集</span>
      </nav>
      <h1 className="mb-1 text-2xl font-bold text-[#0e2245]">教材を編集</h1>
      <p className="mb-5 break-words text-slate-600">{content.title}</p>

      <ContentForm
        initial={initial}
        submitLabel="変更を保存"
        onCancel={() => router.push(`/contents/detail?id=${content.id}`)}
        onSubmit={async (draft) => {
          await update(content.id, draft);
          router.push(`/contents/detail?id=${content.id}`);
        }}
      />
    </div>
  );
}
