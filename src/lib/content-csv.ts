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

/** 書き出し時の列順。大項目・中項目・小項目は独立した列として持つ。 */
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

/**
 * 取り込み時に認識する列名。
 * 本ツールが書き出す名前に加えて、Excelの「資料MASTER」を
 * そのままCSV保存したときの列名も受け付ける。
 */
type FieldKey =
  | "title"
  | "summary"
  | "major"
  | "middle"
  | "small"
  | "audience"
  | "tags"
  | "url"
  | "storage"
  | "urlOrStorage"
  | "format"
  | "status"
  | "progress"
  | "priority"
  | "owner"
  | "canonical"
  | "missing"
  | "next"
  | "notes";

const COLUMN_ALIASES: Record<FieldKey, string[]> = {
  title: ["タイトル", "資料名", "教材名", "コンテンツ名", "名称"],
  summary: ["概要", "目的・内容", "目的内容", "内容", "説明"],
  major: ["大項目", "大分類", "カテゴリ"],
  middle: ["中項目", "中分類", "サブカテゴリ"],
  small: ["小項目", "小分類"],
  audience: ["対象者", "対象"],
  tags: ["タグ", "検索キーワード", "キーワード"],
  url: ["元URL", "URL", "リンク"],
  storage: ["保存場所", "格納場所", "ファイルパス"],
  // URLと保存場所が1列にまとまっている場合（Excelの資料MASTERはこの形）
  urlOrStorage: ["資料URL／保存場所", "資料URL/保存場所", "URL／保存場所", "URL/保存場所"],
  format: ["教材形式", "資料形式", "形式", "ファイル形式"],
  status: ["状態", "ステータス", "進捗"],
  progress: ["完成度", "進捗率", "達成率"],
  priority: ["優先度", "優先順位"],
  owner: ["担当者", "作成者／担当", "作成者/担当", "作成者", "担当"],
  canonical: ["正本区分", "版区分", "正本"],
  missing: ["不足物", "不足しているもの", "不足"],
  next: ["次の作業", "次アクション", "ネクストアクション"],
  notes: ["備考", "メモ", "コメント"],
};

/** 「資料名【必須】」のような装飾を取り除いて比較する */
function normalizeHeader(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[【（(\[].*?[】）)\]]/g, "") // 【必須】などを除去
    .replace(/[\s　]/g, "")
    .replace(/[／/]/g, "/")
    .toLowerCase();
}

function matchField(headerCell: string): FieldKey | null {
  const normalized = normalizeHeader(headerCell);
  if (!normalized) return null;
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES) as [FieldKey, string[]][]) {
    for (const alias of aliases) {
      if (normalized === normalizeHeader(alias)) return key;
    }
  }
  return null;
}

/**
 * ヘッダー行を探す。
 * Excelから書き出したCSVは先頭にタイトル行や説明行が入るため、
 * 「認識できる列名が最も多い行」をヘッダーとみなす。
 */
function findHeaderRow(rows: string[][]): { index: number; map: Partial<Record<FieldKey, number>> } | null {
  let best: { index: number; map: Partial<Record<FieldKey, number>>; score: number } | null = null;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    const map: Partial<Record<FieldKey, number>> = {};
    let score = 0;
    row.forEach((cell, index) => {
      const field = matchField(cell ?? "");
      if (field && map[field] === undefined) {
        map[field] = index;
        score += 1;
      }
    });
    // タイトルに相当する列が無ければヘッダーとは認めない
    if (map.title === undefined) continue;
    if (!best || score > best.score) best = { index: i, map, score };
  }

  return best && best.score >= 2 ? { index: best.index, map: best.map } : null;
}

function toEnum<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  const trimmed = value.trim();
  return (allowed as readonly string[]).includes(trimmed) ? (trimmed as T) : fallback;
}

function splitList(value: string): string[] {
  return value
    .split(/[、,・]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
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
  /** プレビュー表示用（タイトル・大項目・中項目・小項目） */
  preview: { title: string; major: string; middle: string; small: string };
};

export type CsvImportResult = {
  rows: CsvImportRow[];
  validCount: number;
  errorCount: number;
  /** 空行としてスキップした数（エラーではない） */
  skippedCount: number;
  /** 認識したヘッダー行（1始まり）。見つからなければ null */
  headerRowNumber: number | null;
  /** 認識できた列名の一覧（画面に出して安心してもらうため） */
  recognizedColumns: string[];
};

/** CSVテキストをプレビュー用に解析する。実際の登録はここでは行わない。 */
export function parseCsvForImport(text: string): CsvImportResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return {
      rows: [],
      validCount: 0,
      errorCount: 0,
      skippedCount: 0,
      headerRowNumber: null,
      recognizedColumns: [],
    };
  }

  const header = findHeaderRow(table);

  // ヘッダーが見つからない場合は、従来どおり列の並び順で読む
  const map: Partial<Record<FieldKey, number>> = header?.map ?? {
    title: 0,
    summary: 1,
    major: 2,
    middle: 3,
    small: 4,
    audience: 5,
    tags: 6,
    url: 7,
    storage: 8,
    format: 9,
    status: 10,
    progress: 11,
    priority: 12,
    owner: 13,
    canonical: 14,
    missing: 15,
    next: 16,
    notes: 17,
  };
  const bodyStart = header ? header.index + 1 : 0;
  const body = table.slice(bodyStart);

  const recognizedColumns = header
    ? (Object.keys(map) as FieldKey[])
        .filter((k) => map[k] !== undefined)
        .map((k) => (table[header.index]?.[map[k]!] ?? "").trim())
        .filter(Boolean)
    : [];

  const at = (row: string[], key: FieldKey): string => {
    const index = map[key];
    if (index === undefined) return "";
    return (row[index] ?? "").trim();
  };

  const rows: CsvImportRow[] = [];
  let skippedCount = 0;

  body.forEach((raw, index) => {
    const rowNumber = bodyStart + index + 1;

    // 完全に空の行（Excelの予備枠）は静かに飛ばす
    if (raw.every((cell) => !(cell ?? "").trim())) {
      skippedCount += 1;
      return;
    }

    const title = at(raw, "title");
    const major = at(raw, "major");
    const preview = {
      title,
      major,
      middle: at(raw, "middle"),
      small: at(raw, "small"),
    };

    if (!title) {
      // タイトルが無い行は登録できないが、内容もほぼ空なら黙って飛ばす
      const meaningful = raw.filter((cell) => (cell ?? "").trim()).length;
      if (meaningful <= 1) {
        skippedCount += 1;
        return;
      }
      rows.push({ rowNumber, draft: null, error: "タイトルが空です。", preview });
      return;
    }

    // URLと保存場所が1列にまとまっている場合は、http(s)かどうかで振り分ける
    let sourceUrl = at(raw, "url");
    let storageLocation = at(raw, "storage");
    const combined = at(raw, "urlOrStorage");
    if (combined) {
      if (isUrl(combined)) sourceUrl = sourceUrl || combined;
      else storageLocation = storageLocation || combined;
    }
    // 「元URL」列にローカルパスが入っていた場合も保存場所へ寄せる
    if (sourceUrl && !isUrl(sourceUrl)) {
      storageLocation = storageLocation || sourceUrl;
      sourceUrl = "";
    }

    const progressRaw = at(raw, "progress").replace(/[%％]/g, "");
    const progressNum = Number(progressRaw);
    const progress = Number.isFinite(progressNum)
      ? Math.min(100, Math.max(0, Math.round(progressNum)))
      : 0;

    const audience = splitList(at(raw, "audience")).filter((v): v is Audience =>
      (AUDIENCES as readonly string[]).includes(v)
    );

    const draft: EducationContentDraft = {
      title,
      summary: at(raw, "summary"),
      // 大項目が空でも「分類待ち」として取り込む（分類は後から直せる）
      majorCategory: major || "分類待ち",
      middleCategory: at(raw, "middle"),
      smallCategory: at(raw, "small"),
      audience,
      tags: splitList(at(raw, "tags")),
      sourceUrl,
      storageLocation,
      materialFormat: toEnum<MaterialFormat>(at(raw, "format"), MATERIAL_FORMATS, "未確認"),
      status: toEnum<ContentStatus>(at(raw, "status"), CONTENT_STATUSES, "未着手"),
      progress,
      priority: toEnum<ContentPriority>(at(raw, "priority"), CONTENT_PRIORITIES, "未設定"),
      owner: at(raw, "owner"),
      canonicalStatus: toEnum<CanonicalStatus>(at(raw, "canonical"), CANONICAL_STATUSES, "未確認"),
      missingItems: at(raw, "missing"),
      nextAction: at(raw, "next"),
      notes: at(raw, "notes"),
    };

    rows.push({ rowNumber, draft, error: null, preview });
  });

  const validCount = rows.filter((r) => r.draft).length;
  return {
    rows,
    validCount,
    errorCount: rows.length - validCount,
    skippedCount,
    headerRowNumber: header ? header.index + 1 : null,
    recognizedColumns,
  };
}
