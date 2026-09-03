"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { decodeCsvFile, downloadCsv, parseCsv } from "@/lib/csv";
import {
  CSV_HEADERS,
  buildCsvTemplate,
  exportContentsToCsv,
  parseCsvForImport,
  type CsvImportResult,
} from "@/lib/content-csv";
import { Button, Card } from "@/components/ui";
import { useContentStore } from "@/features/contents/content-store";

export default function ImportPage() {
  const router = useRouter();
  const { bulkCreate, contents, notify } = useContentStore();
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [skipErrors, setSkipErrors] = useState(true);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await decodeCsvFile(file);
    setFileName(file.name);
    setResult(parseCsvForImport(text));
  };

  const downloadTemplate = () => {
    downloadCsv("教育コンテンツMASTER_テンプレート.csv", parseCsv(buildCsvTemplate()));
  };

  const exportAllCsv = () => {
    if (contents.length === 0) {
      notify("書き出すコンテンツがありません。", "error");
      return;
    }
    downloadCsv(
      `教育コンテンツMASTER_${new Date().toISOString().slice(0, 10)}.csv`,
      parseCsv(exportContentsToCsv(contents))
    );
  };

  const reset = () => {
    setResult(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const runImport = async () => {
    if (!result) return;
    const drafts = result.rows.filter((r) => r.draft).map((r) => r.draft!);
    if (drafts.length === 0) {
      notify("登録できる行がありません。", "error");
      return;
    }
    if (!skipErrors && result.errorCount > 0) {
      notify("エラー行があるため登録を中止しました。", "error");
      return;
    }
    setImporting(true);
    try {
      await bulkCreate(drafts);
      reset();
      router.push("/");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <span>CSV取り込み</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-[#0e2245]">CSVで教材をまとめて登録</h1>
        <p className="mt-1 text-slate-600">
          既存の資料一覧をCSVにして、一度にまとめて登録できます。
          <strong>Excelの「資料MASTER」をそのままCSV保存したファイルも読み込めます。</strong>
        </p>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-bold text-[#0e2245]">1. CSVファイルを選ぶ</h2>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base file:mr-4 file:rounded-md file:border-0 file:bg-[#0f5c3f] file:px-4 file:py-2 file:font-bold file:text-white"
        />
        {fileName ? (
          <p className="mt-2 text-sm text-slate-600">選択中のファイル：{fileName}</p>
        ) : null}
        <ul className="mt-3 space-y-1 text-sm text-slate-500">
          <li>・見出し行の位置は自動で探します（Excelのタイトル行や説明行があっても大丈夫です）</li>
          <li>・列は名前で対応づけます。「資料名」「大分類」「中分類」などの言い方でも読み取れます</li>
          <li>・文字コードはUTF-8・Shift-JISのどちらでも構いません</li>
          <li>・空の行は自動で飛ばします</li>
        </ul>
      </Card>

      {result ? (
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-[#0e2245]">2. 読み込み前プレビュー</h2>

          {result.headerRowNumber ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900">
              <p className="font-bold">
                {result.headerRowNumber}行目を見出し行として認識しました
              </p>
              {result.recognizedColumns.length > 0 ? (
                <p className="mt-1 text-sm break-words">
                  読み取れた列：{result.recognizedColumns.join("／")}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] font-bold text-amber-900">
              見出し行が見つかりませんでした。列の並び順どおりに読み取っています。
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-3">
            <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 font-bold whitespace-nowrap text-emerald-900">
              登録できる行：{result.validCount}件
            </span>
            <span
              className={cn(
                "rounded-lg border px-4 py-2 font-bold whitespace-nowrap",
                result.errorCount > 0
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-slate-300 bg-slate-50 text-slate-600"
              )}
            >
              エラー行：{result.errorCount}件
            </span>
            {result.skippedCount > 0 ? (
              <span className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 font-bold whitespace-nowrap text-slate-600">
                空行として除外：{result.skippedCount}件
              </span>
            ) : null}
          </div>

          {result.rows.length === 0 ? (
            <p className="py-6 text-center text-slate-500">
              このCSVには読み取れる行がありませんでした。
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[920px] border-collapse text-left text-[15px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="w-[6%] px-3 py-2 font-bold whitespace-nowrap">行</th>
                    <th className="w-[34%] px-3 py-2 font-bold">タイトル</th>
                    <th className="w-[17%] px-3 py-2 font-bold">大項目</th>
                    <th className="w-[13%] px-3 py-2 font-bold">中項目</th>
                    <th className="w-[12%] px-3 py-2 font-bold">小項目</th>
                    <th className="w-[18%] px-3 py-2 font-bold">判定</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 200).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={cn("border-t border-slate-200", row.error && "bg-red-50")}
                    >
                      <td className="px-3 py-2 tabular-nums">{row.rowNumber}</td>
                      <td className="max-w-[300px] truncate px-3 py-2" title={row.preview.title}>
                        {row.preview.title || "—"}
                      </td>
                      <td className="px-3 py-2">{row.preview.major || "—"}</td>
                      <td className="px-3 py-2">{row.preview.middle || "—"}</td>
                      <td className="px-3 py-2">{row.preview.small || "—"}</td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="font-bold text-red-700">{row.error}</span>
                        ) : (
                          <span className="font-bold text-emerald-700">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > 200 ? (
                <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  先頭200行のみ表示しています（登録は全行が対象です）。
                </p>
              ) : null}
            </div>
          )}

          {result.errorCount > 0 ? (
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
                className="mt-1 h-5 w-5 accent-[#0f5c3f]"
              />
              <span className="text-[15px] text-slate-700">
                <strong>エラー行を飛ばして、正常な行だけ登録する</strong>
                <br />
                チェックを外すと、エラーが1件でもある場合は登録しません。
              </span>
            </label>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button onClick={reset}>取り消す</Button>
            <Button
              variant="primary"
              onClick={runImport}
              disabled={importing || result.validCount === 0}
            >
              {importing ? "登録中…" : `${result.validCount}件を登録する`}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-bold text-[#0e2245]">書き出し</h2>
        <p className="mb-4 text-slate-600">
          テンプレートの列は <strong>{CSV_HEADERS.join("／")}</strong> です。
          必須は「タイトル」と「大項目」の2つだけです。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={downloadTemplate}>CSVテンプレートを書き出す</Button>
          <Button onClick={exportAllCsv}>現在の全データをCSVで書き出す</Button>
        </div>
      </Card>
    </div>
  );
}
