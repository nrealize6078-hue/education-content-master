/**
 * 教育コンテンツMASTER — データ型定義
 *
 * 分類は「大項目 ＞ 中項目 ＞ 小項目」の3階層。
 * major = 旧仕様の category、middle = 旧仕様の subcategory に相当し、
 * small を新設した（実装指示 3-4 に準拠）。
 */

export const MAJOR_CATEGORIES = [
  "不動産",
  "保険",
  "営業",
  "人生支援",
  "REALIZE CLUB",
  "LMP",
  "LIFE ACADEMY",
  "システム・AI",
  "その他",
  "分類待ち",
] as const;
export type MajorCategory = (typeof MAJOR_CATEGORIES)[number];

export const CONTENT_STATUSES = [
  "未着手",
  "整理中",
  "制作中",
  "要修正",
  "完成",
  "保留",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const MATERIAL_FORMATS = [
  "PDF",
  "PowerPoint",
  "Word",
  "Excel／スプレッドシート",
  "Googleドキュメント",
  "Googleスプレッドシート",
  "Canva",
  "動画",
  "Webページ",
  "画像",
  "音声",
  "営業台本",
  "マニュアル",
  "Eラーニング",
  "その他",
  "未確認",
] as const;
export type MaterialFormat = (typeof MATERIAL_FORMATS)[number];

export const AUDIENCES = [
  "社内全員",
  "社内営業",
  "LMP加盟店",
  "RC導入企業",
  "RC会員",
  "顧客",
  "経営者",
  "インフルエンサー",
  "管理者",
  "その他",
] as const;
export type Audience = (typeof AUDIENCES)[number];

export const CONTENT_PRIORITIES = ["最優先", "高", "中", "低", "未設定"] as const;
export type ContentPriority = (typeof CONTENT_PRIORITIES)[number];

export const CANONICAL_STATUSES = [
  "最新版・正本",
  "参考資料",
  "旧版",
  "未確認",
] as const;
export type CanonicalStatus = (typeof CANONICAL_STATUSES)[number];

/** 中項目の候補（大項目ごと）。あくまで選択候補であり、自由入力も可能。 */
export const MIDDLE_CATEGORY_SUGGESTIONS: Partial<Record<MajorCategory, string[]>> = {
  "REALIZE CLUB": [
    "LIFE CORE",
    "LIFE SHIFT",
    "LIFE CHECK42",
    "LIFE JOURNEY",
    "LIFE ROAD MAP",
    "LIFE MEETING",
    "LIFE CONSULTANT",
    "ミオ先生",
    "LIFE RECORD",
  ],
  LMP: ["使用方法", "営業資料", "営業トーク", "アポ取り", "クロージング", "福利厚生営業", "加盟店教育"],
  "LIFE ACADEMY": [
    "家計",
    "住環境",
    "万が一",
    "健康",
    "災害",
    "人生後半",
    "Q1〜Q42",
    "テスト",
    "動画",
    "解説",
  ],
};

export type EducationContent = {
  id: string;
  title: string;
  summary: string;
  /** 大項目 */
  majorCategory: string;
  /** 中項目 */
  middleCategory: string;
  /** 小項目 */
  smallCategory: string;
  audience: Audience[];
  tags: string[];
  sourceUrl: string;
  storageLocation: string;
  materialFormat: MaterialFormat;
  status: ContentStatus;
  progress: number;
  priority: ContentPriority;
  owner: string;
  canonicalStatus: CanonicalStatus;
  missingItems: string;
  nextAction: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

/** 新規登録時に必須なのはタイトルと大項目のみ。他は空でも仮登録できる。 */
export type EducationContentDraft = Omit<
  EducationContent,
  "id" | "createdAt" | "updatedAt" | "archivedAt"
>;

export function createEmptyDraft(): EducationContentDraft {
  return {
    title: "",
    summary: "",
    majorCategory: "分類待ち",
    middleCategory: "",
    smallCategory: "",
    audience: [],
    tags: [],
    sourceUrl: "",
    storageLocation: "",
    materialFormat: "未確認",
    status: "未着手",
    progress: 0,
    priority: "未設定",
    owner: "",
    canonicalStatus: "未確認",
    missingItems: "",
    nextAction: "",
    notes: "",
  };
}

export type SortOrder =
  | "updatedDesc"
  | "updatedAsc"
  | "titleAsc"
  | "progressDesc"
  | "progressAsc"
  | "priorityDesc"
  | "createdDesc";

export const SORT_LABELS: Record<SortOrder, string> = {
  updatedDesc: "最終更新日が新しい順",
  updatedAsc: "最終更新日が古い順",
  titleAsc: "タイトル順",
  progressDesc: "完成度が高い順",
  progressAsc: "完成度が低い順",
  priorityDesc: "優先度順",
  createdDesc: "登録日順",
};

export type ContentFilters = {
  keyword: string;
  majorCategory: string[];
  middleCategory: string[];
  status: ContentStatus[];
  audience: Audience[];
  materialFormat: MaterialFormat[];
  priority: ContentPriority[];
  canonicalStatus: CanonicalStatus[];
  owner: string[];
};

export function createEmptyFilters(): ContentFilters {
  return {
    keyword: "",
    majorCategory: [],
    middleCategory: [],
    status: [],
    audience: [],
    materialFormat: [],
    priority: [],
    canonicalStatus: [],
    owner: [],
  };
}
