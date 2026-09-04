"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import type { EducationContent } from "@/types/content";
import { Button, Card, EmptyState, LoadingState, ProgressBar, StatusBadge } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import { majorHref } from "@/lib/nav";
import {
  CategoryPath,
  CrossMajorTags,
  OpenSourceButton,
  StorageLocationBox,
} from "@/features/contents/content-actions";
import { HardDeleteDialog } from "@/features/contents/delete-dialog";

export default function ContentDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContentDetail />
    </Suspense>
  );
}

function ContentDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const { contents, archived, loading, duplicate, archive, restore, hardDelete } =
    useContentStore();
  const [deleteTarget, setDeleteTarget] = useState<EducationContent | null>(null);

  const content = useMemo(
    () => [...contents, ...archived].find((c) => c.id === id) ?? null,
    [contents, archived, id]
  );

  if (loading) return <LoadingState />;

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <EmptyState
          title="コンテンツが見つかりません。"
          description="削除されたか、URLが正しくない可能性があります。"
        />
        <div className="text-center">
          <Link href="/" className="focus-ring rounded font-bold text-[#0f5c3f] hover:underline">
            ← 一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span>＞</span>
        <Link
          href={majorHref(content.majorCategory)}
          className="focus-ring rounded font-bold break-words text-[#0f5c3f] hover:underline"
        >
          {content.majorCategory || "未設定"}
        </Link>
        <span>＞</span>
        <span className="break-words">{content.title}</span>
      </nav>

      <Link
        href={majorHref(content.majorCategory)}
        className="focus-ring inline-flex min-h-[44px] items-center rounded-lg border-2 border-[#0f5c3f] bg-white px-4 py-2 text-base font-bold text-[#0f5c3f] hover:bg-[#e4f0e9]"
      >
        ← {content.majorCategory || "未設定"} の一覧へ戻る
      </Link>

      {content.archivedAt ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-900">
          このコンテンツはアーカイブ済みです（通常の一覧には表示されません）。
        </p>
      ) : null}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CategoryPath content={content} className="mb-2" />
            <CrossMajorTags content={content} className="mb-2 ml-2" />
            <h1 className="text-2xl leading-snug font-bold break-words text-[#0e2245]">
              {content.title}
            </h1>
            {content.summary ? (
              <p className="mt-2 leading-7 whitespace-pre-wrap text-slate-700">{content.summary}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <OpenSourceButton content={content} size="md" />
            <Link
              href={`/contents/edit?id=${content.id}`}
              className="focus-ring inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-bold whitespace-nowrap text-slate-800 hover:bg-slate-50"
            >
              編集
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <StatusBadge status={content.status} />
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
            {content.materialFormat}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
            優先度：{content.priority}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
            {content.canonicalStatus}
          </span>
          <div className="min-w-[200px] flex-1">
            <ProgressBar value={content.progress} />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold text-[#0e2245]">分類・対象</h2>
          <Row label="大項目">{content.majorCategory || "未設定"}</Row>
          <Row label="横断して入れている大項目">
            {(content.additionalMajorCategories ?? []).filter((v) => v.trim()).join("、") || "なし"}
          </Row>
          <Row label="中項目">{content.middleCategory || "未設定"}</Row>
          <Row label="小項目">{content.smallCategory || "未設定"}</Row>
          <Row label="対象者">
            {content.audience.length > 0 ? content.audience.join("、") : "未設定"}
          </Row>
          <Row label="タグ">
            {content.tags.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-bold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            ) : (
              "未設定"
            )}
          </Row>
          <Row label="担当者">{content.owner || "未設定"}</Row>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold text-[#0e2245]">保存先</h2>
          <Row label="元URL">
            {content.sourceUrl ? (
              <span className="break-all">{content.sourceUrl}</span>
            ) : (
              <span className="text-slate-400">未登録</span>
            )}
          </Row>
          <div className="mt-4">
            <p className="mb-1.5 text-sm font-bold text-slate-600">保存場所（PC・社内サーバー）</p>
            <StorageLocationBox value={content.storageLocation} />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold text-[#0e2245]">制作状況</h2>
        <Row label="不足物">{content.missingItems || "未設定"}</Row>
        <Row label="次の作業">{content.nextAction || "未設定"}</Row>
        <Row label="備考">{content.notes || "未設定"}</Row>
        <Row label="登録日">{formatDateTime(content.createdAt)}</Row>
        <Row label="最終更新日">{formatDateTime(content.updatedAt)}</Row>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-lg font-bold text-[#0e2245]">このコンテンツの操作</h2>
        <p className="mb-4 text-sm text-slate-500">
          削除しても、リンク先のGoogle Drive・Canva・YouTube・PC内の元ファイルは削除されません。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void duplicate(content.id)}>複製</Button>
          {content.archivedAt ? (
            <Button onClick={() => void restore(content.id)}>アーカイブから戻す</Button>
          ) : (
            <Button
              onClick={async () => {
                await archive(content.id);
                router.push("/");
              }}
            >
              アーカイブ
            </Button>
          )}
          <Link
            href="/"
            className="focus-ring inline-flex min-h-[44px] items-center rounded-lg px-5 py-2.5 text-base font-bold text-slate-700 hover:bg-slate-100"
          >
            ← 一覧へ戻る
          </Link>
          <Button variant="danger" className="ml-auto" onClick={() => setDeleteTarget(content)}>
            完全に削除
          </Button>
        </div>
      </Card>

      <HardDeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async (target) => {
          setDeleteTarget(null);
          await hardDelete(target.id);
          router.push("/");
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-sm font-bold text-slate-600">{label}</dt>
      <dd className="min-w-0 flex-1 break-words whitespace-pre-wrap text-slate-800">{children}</dd>
    </div>
  );
}
