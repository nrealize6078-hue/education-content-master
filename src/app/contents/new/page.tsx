"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContentStore } from "@/features/contents/content-store";
import { ContentForm } from "@/features/contents/content-form";

export default function NewContentPage() {
  const router = useRouter();
  const { create } = useContentStore();

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <span>新しい教材を登録</span>
      </nav>
      <h1 className="mb-5 text-2xl font-bold text-[#0e2245]">新しい教材を登録</h1>

      <ContentForm
        submitLabel="登録する"
        onCancel={() => router.push("/")}
        onSubmit={async (draft) => {
          const created = await create(draft);
          router.push(`/contents/detail?id=${created.id}`);
        }}
      />
    </div>
  );
}
