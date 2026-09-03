import {
  AUDIENCES,
  CANONICAL_STATUSES,
  CONTENT_PRIORITIES,
  CONTENT_STATUSES,
  MATERIAL_FORMATS,
  type Audience,
  type CanonicalStatus,
  type ContentPriority,
  type ContentStatus,
  type EducationContent,
  type EducationContentDraft,
  type MaterialFormat,
} from "@/types/content";
import { parseCsv, toCsv } from "./csv";

/** CSVの列順。大項目・中項目・小項目は指示書どおり独立した列として持つ。 */
export const CSV_HEADERS = [
  "タイトル",
  "概要",
  "大項目",
  "中項目",
  "小項目",
  "対象者",
  "タグ",
  "元URL",
  "保存場所",
  "教材形式",
  "状態",
  "完成度",
  "優先度",
  "担当者",
  "正本区分",
  "不足物",
  "次の作業",
  "備考",
] as const;

const LIST_SEPARATOR = "、";

function toEnum<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  const trimmed = value.trim();
  return (allowed as readonly string[]).includes(trimmed) ? (trimmed as T) : fallback;
}

function splitList(value: string): string[] {
  return value
    .split(/[、,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function contentToCsvRow(content: EducationContent): string[] {
  return [
    content.title,
    content.summary,
    content.majorCategory,
    content.middleCategory,
    content.smallCategory,
    content.audience.join(LIST_SEPARATOR),
    content.tags.join(LIST_SEPARATOR),
    content.sourceUrl,
    content.storageLocation,
    content.materialFormat,
    content.status,
    String(content.progress),
    content.priority,
    content.owner,
    content.canonicalStatus,
    content.missingItems,
    content.nextAction,
    content.notes,
  ];
}

export function buildCsvTemplate(): string {
  const sample = [
    "（例）LIFE SHIFT教科書_A4横書き",
    "人生80年時代から100年時代への移行を解説する教材",
    "REALIZE CLUB",
    "LIFE SHIFT",
    "第1章",
    "RC会員、顧客",
    "教科書、A4",
    "https://example.com/life-shift.pdf",
    "\\\\Realize-sv2\\共有\\教育資料\\LIFE_SHIFT.pdf",
    "PDF",
    "完成",
    "100",
    "中",
    "山田",
    "最新版・正本",
    "",
    "",
    "サンプル行です。登録前に削除してください。",
  ];
  return toCsv([[...CSV_HEADERS], sample]);
}

export function exportContentsToCsv(contents: EducationContent[]): string {
  const rows = [[...CSV_HEADERS], ...contents.map(contentToCsvRow)];
  return toCsv(rows);
}

export type CsvImportRow = {
  rowNumber: number;
  draft: EducationContentDraft | null;
  error: string | null;
  raw: string[];
};

export type CsvImportResult = {
  rows: CsvImportRow[];
  validCount: number;
  errorCount: number;
};

/** CSVテキストをプレビュー用に解析する。実際の登録はここでは行わない。 */
export function parseCsvForImport(text: string): CsvImportResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }
  const [header, ...dataRows] = table;
  const isKnownHeader = header?.[0]?.trim() === CSV_HEADERS[0];
  const body = isKnownHeader ? dataRows : table;

  const rows: CsvImportRow[] = body.map((raw, index) => {
    const rowNumber = index + (isKnownHeader ? 2 : 1);
    const title = (raw[0] ?? "").trim();
    const major = (raw[2] ?? "").trim();

    if (!title) {
      return { rowNumber, draft: null, error: "タイトルが空です。", raw };
    }
    if (!major) {
      return { rowNumber, draft: null, error: "大項目が空です。", raw };
    }

    const progressRaw = (raw[11] ?? "0").trim();
    const progressNum = Number(progressRaw.replace("%", ""));
    const progress = Number.isFinite(progressNum)
      ? Math.min(100, Math.max(0, Math.round(progressNum)))
      : 0;

    const audience = splitList(raw[5] ?? "").filter((v): v is Audience =>
      (AUDIENCES as readonly string[]).includes(v)
    );

    const draft: EducationContentDraft = {
      title,
      summary: raw[1] ?? "",
      majorCategory: major,
      middleCategory: raw[3] ?? "",
      smallCategory: raw[4] ?? "",
      audience,
      tags: splitList(raw[6] ?? ""),
      sourceUrl: raw[7] ?? "",
      storageLocation: raw[8] ?? "",
      materialFormat: toEnum<MaterialFormat>(raw[9] ?? "", MATERIAL_FORMATS, "未確認"),
      status: toEnum<ContentStatus>(raw[10] ?? "", CONTENT_STATUSES, "未着手"),
      progress,
      priority: toEnum<ContentPriority>(raw[12] ?? "", CONTENT_PRIORITIES, "未設定"),
      owner: raw[13] ?? "",
      canonicalStatus: toEnum<CanonicalStatus>(raw[14] ?? "", CANONICAL_STATUSES, "未確認"),
      missingItems: raw[15] ?? "",
      nextAction: raw[16] ?? "",
      notes: raw[17] ?? "",
    };

    return { rowNumber, draft, error: null, raw };
  });

  const validCount = rows.filter((r) => r.draft).length;
  return { rows, validCount, errorCount: rows.length - validCount };
}
