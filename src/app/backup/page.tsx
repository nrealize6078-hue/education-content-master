"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { downloadCsv, downloadJson, parseCsv } from "@/lib/csv";
import { exportContentsToCsv } from "@/lib/content-csv";
import type { EducationContent } from "@/types/content";
import { Button, Card, Modal } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";
import {
  chooseExistingFile,
  chooseNewFile,
  forgetFile,
  isFileStoreSupported,
  regrantPermission,
} from "@/lib/file-store";

export default function BackupPage() {
  const {
    contents,
    archived,
    exportAll,
    replaceAll,
    reload,
    notify,
    fileStatus,
    refreshFileStatus,
    saveToSaveFile,
    loadFromSaveFile,
  } = useContentStore();
  const [fileBusy, setFileBusy] = useState(false);
  const [fileApiSupported, setFileApiSupported] = useState<boolean | null>(null);
  useEffect(() => setFileApiSupported(isFileStoreSupported()), []);
  const [pending, setPending] = useState<EducationContent[] | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const total = contents.length + archived.length;

  const backupJson = async () => {
    const all = await exportAll();
    if (all.length === 0) {
      notify("バックアップするデータがありません。", "error");
      return;
    }
    downloadJson(`教育コンテンツMASTER_バックアップ_${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      version: 1,
      contents: all,
    });
    notify("JSONバックアップを書き出しました。");
  };

  const exportCsv = () => {
    if (total === 0) {
      notify("書き出すデータがありません。", "error");
      return;
    }
    downloadCsv(
      `教育コンテンツMASTER_全データ_${new Date().toISOString().slice(0, 10)}.csv`,
      parseCsv(exportContentsToCsv([...contents, ...archived]))
    );
    notify("CSVを書き出しました。");
  };

  const handleRestoreFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const items: unknown = Array.isArray(parsed) ? parsed : parsed?.contents;
      if (!Array.isArray(items)) {
        throw new Error("形式が違います");
      }
      const valid = items.filter(
        (item): item is EducationContent =>
          typeof item === "object" && item !== null && "id" in item && "title" in item
      );
      if (valid.length === 0) {
        throw new Error("復元できるコンテンツがありません");
      }
      setFileName(file.name);
      setPending(valid);
    } catch {
      notify("このJSONファイルは読み込めませんでした。バックアップファイルを選び直してください。", "error");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <span>バックアップ</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-[#0e2245]">バックアップと復元</h1>
        <p className="mt-1 text-slate-600">
          保存先ファイルを決めておくと、変更のたびに自動で書き出されます。
          手元にファイルとして残るので、ブラウザを閉じてもデータは消えません。
        </p>
      </div>

      <Card className="p-5">
        <h2 className="mb-2 text-lg font-bold text-[#0e2245]">自動保存（おすすめ）</h2>
        {fileStatus.state === "unsupported" ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
            このブラウザは自動保存に対応していません。Google Chrome か Microsoft Edge
            で開くとご利用いただけます。それまでは下の「書き出す」でこまめに保存してください。
          </p>
        ) : (
          <>
            <p
              className={
                fileStatus.state === "ready"
                  ? "rounded-lg border border-[#0f5c3f] bg-[#e4f0e9] px-4 py-3 text-[15px] font-bold text-[#0f5c3f]"
                  : "rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[15px] font-bold text-red-800"
              }
            >
              {fileStatus.state === "ready"
                ? `自動保存中：${fileStatus.name}`
                : fileStatus.state === "needs-permission"
                  ? `自動保存が止まっています（保存先：${fileStatus.name}）。「自動保存を再開する」を押してください。`
                  : "自動保存は未設定です。いまのデータはこのブラウザの中にしかありません。"}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                variant="primary"
                disabled={fileBusy}
                onClick={async () => {
                  setFileBusy(true);
                  try {
                    const name = await chooseNewFile();
                    await refreshFileStatus();
                    await saveToSaveFile();
                    notify(`${name} に自動保存するようにしました。`);
                  } catch {
                    notify("保存先ファイルが選ばれませんでした。", "error");
                  } finally {
                    setFileBusy(false);
                  }
                }}
              >
                {fileStatus.state === "none" ? "保存先ファイルを決める" : "保存先を変える"}
              </Button>

              {fileStatus.state === "needs-permission" ? (
                <Button
                  disabled={fileBusy}
                  onClick={async () => {
                    setFileBusy(true);
                    try {
                      const ok = await regrantPermission();
                      await refreshFileStatus();
                      if (ok) await saveToSaveFile();
                      else notify("書き込みが許可されませんでした。", "error");
                    } finally {
                      setFileBusy(false);
                    }
                  }}
                >
                  自動保存を再開する
                </Button>
              ) : null}

              <Button
                disabled={fileBusy || fileApiSupported === false}
                onClick={async () => {
                  setFileBusy(true);
                  try {
                    const { name, items } = await chooseExistingFile();
                    setPending(items);
                    setFileName(name);
                    await refreshFileStatus();
                  } catch {
                    notify("保存ファイルを開けませんでした。", "error");
                  } finally {
                    setFileBusy(false);
                  }
                }}
              >
                保存ファイルを開いて読み込む
              </Button>

              {fileStatus.state === "ready" ? (
                <>
                  <Button
                    disabled={fileBusy}
                    onClick={async () => {
                      setFileBusy(true);
                      try {
                        await loadFromSaveFile();
                      } finally {
                        setFileBusy(false);
                      }
                    }}
                  >
                    保存ファイルから読み直す
                  </Button>
                  <Button
                    disabled={fileBusy}
                    onClick={async () => {
                      setFileBusy(true);
                      try {
                        await forgetFile();
                        await refreshFileStatus();
                        await reload();
                        notify("自動保存を解除しました。ファイル自体は消していません。");
                      } finally {
                        setFileBusy(false);
                      }
                    }}
                  >
                    自動保存をやめる
                  </Button>
                </>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              ※ 保存先は共有フォルダやOneDrive上のファイルでも構いません。別のPCで使うときは
              「保存ファイルを開いて読み込む」で同じファイルを選んでください。
            </p>
          </>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-2 text-lg font-bold text-[#0e2245]">現在のデータ</h2>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 font-bold text-slate-800">
            通常：{contents.length}件
          </span>
          <span className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 font-bold text-slate-800">
            アーカイブ：{archived.length}件
          </span>
          <span className="rounded-lg border border-[#0f5c3f] bg-[#e4f0e9] px-4 py-2 font-bold text-[#0f5c3f]">
            合計：{total}件
          </span>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-2 text-lg font-bold text-[#0e2245]">書き出す</h2>
        <p className="mb-4 text-slate-600">
          JSONは復元用、CSVはExcelで開いて確認・編集する用です。どちらもアーカイブ分を含みます。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={backupJson}>
            JSONバックアップを書き出す
          </Button>
          <Button onClick={exportCsv}>CSVで書き出す</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-2 text-lg font-bold text-[#0e2245]">復元する</h2>
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] font-bold text-amber-900">
          ⚠ 復元すると、いま登録されているデータはすべて置き換わります。
          先に「JSONバックアップを書き出す」で現在のデータを保存しておいてください。
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleRestoreFile(file);
          }}
          className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base file:mr-4 file:rounded-md file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:font-bold file:text-white"
        />
      </Card>

      <Modal
        open={Boolean(pending)}
        onClose={() => {
          setPending(null);
          if (inputRef.current) inputRef.current.value = "";
        }}
        title="バックアップから復元しますか？"
      >
        {pending ? (
          <div className="space-y-5">
            <div className="space-y-2 text-[15px] leading-7 text-slate-700">
              <p>
                ファイル：<strong className="break-all">{fileName}</strong>
              </p>
              <p>
                復元する件数：<strong>{pending.length}件</strong>
              </p>
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-800">
                いま登録されている{total}件はすべて置き換わり、元に戻せません。
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
              <Button
                onClick={() => {
                  setPending(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="sm:min-w-[140px]"
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                className="sm:min-w-[180px]"
                onClick={async () => {
                  const items = pending;
                  setPending(null);
                  if (inputRef.current) inputRef.current.value = "";
                  await replaceAll(items);
                }}
              >
                置き換えて復元する
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
