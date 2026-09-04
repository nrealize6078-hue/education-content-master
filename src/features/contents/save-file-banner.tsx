"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { chooseNewFile, isFileStoreSupported, regrantPermission } from "@/lib/file-store";
import { useContentStore } from "./content-store";

/**
 * 「データがこのブラウザにしか無い」状態を放置させないための帯。
 * 保存ファイルが設定できていない間だけ出す。
 */
export function SaveFileBanner() {
  const { serverMode, fileStatus, refreshFileStatus, saveToSaveFile, notify } = useContentStore();
  const [busy, setBusy] = useState(false);
  // ブラウザの対応状況は描画後に調べる（サーバー描画と食い違わせないため）
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(isFileStoreSupported()), []);

  if (serverMode || fileStatus.state === "ready") return null;

  const setUp = async () => {
    setBusy(true);
    try {
      const name = await chooseNewFile();
      await refreshFileStatus();
      await saveToSaveFile();
      notify(`${name} に自動保存するようにしました。`);
    } catch {
      notify("保存先ファイルが選ばれませんでした。", "error");
    } finally {
      setBusy(false);
    }
  };

  const regrant = async () => {
    setBusy(true);
    try {
      const ok = await regrantPermission();
      await refreshFileStatus();
      if (ok) {
        await saveToSaveFile();
      } else {
        notify("保存ファイルへの書き込みが許可されませんでした。", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  if (fileStatus.state === "unsupported") {
    return (
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-[15px] font-bold text-amber-900">
          このブラウザでは自動保存を使えません。データはブラウザの中だけに保存されます。
        </p>
        <p className="mt-1 text-sm text-amber-900">
          Google Chrome または Microsoft Edge で開くと、パソコンのファイルへ自動保存できます。
          いまのブラウザで使い続ける場合は、
          <Link href="/backup" className="focus-ring mx-1 rounded font-bold underline">
            バックアップ
          </Link>
          からこまめに書き出してください。
        </p>
      </div>
    );
  }

  if (fileStatus.state === "needs-permission") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-bold text-amber-900">
            自動保存が止まっています（保存先：{fileStatus.name}）
          </p>
          <p className="mt-0.5 text-sm text-amber-900">
            ブラウザを開き直したため、書き込みの許可がいったん外れました。ボタンを押すと再開します。
          </p>
        </div>
        <button
          type="button"
          onClick={regrant}
          disabled={busy}
          className="focus-ring inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-amber-600 px-5 py-2 text-base font-bold whitespace-nowrap text-white hover:bg-amber-700 disabled:opacity-60"
        >
          自動保存を再開する
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[15px] font-bold text-red-800">
          いまのデータはこのブラウザの中にしかありません。
        </p>
        <p className="mt-0.5 text-sm text-red-800">
          保存先のファイルを一度決めておくと、変更のたびに自動で書き出され、
          ブラウザを閉じても消えなくなります。
        </p>
      </div>
      <button
        type="button"
        onClick={setUp}
        disabled={busy || supported === false}
        className="focus-ring inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-[#0f5c3f] px-5 py-2 text-base font-bold whitespace-nowrap text-white hover:bg-[#0c4b34] disabled:opacity-60"
      >
        保存先ファイルを決める
      </button>
    </div>
  );
}
