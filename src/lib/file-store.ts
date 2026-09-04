"use client";

import type { EducationContent } from "@/types/content";
import type { CategoryOrder } from "./category-order";

/**
 * データをパソコンのファイルとして保存し続けるための仕組み。
 *
 * ブラウザ内（ローカルストレージ）だけに置くと、ブラウザの終了・履歴の削除・
 * 別のPCやブラウザで開いた場合に消えてしまう。
 * 一度だけ保存先ファイルを選んでもらい、以降は変更のたびに自動で上書きする。
 */

const DB_NAME = "ecm-file-store";
const DB_VERSION = 1;
const STORE = "handles";
const HANDLE_KEY = "backup-file";

export type SaveFileStatus =
  | { state: "unsupported" }
  | { state: "none" }
  | { state: "ready"; name: string }
  | { state: "needs-permission"; name: string };

export function isFileStoreSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* File System Access API は TypeScript の標準型に含まれないため、必要な分だけ宣言する */
type Permission = "granted" | "denied" | "prompt";
type FileHandle = {
  name: string;
  queryPermission(options: { mode: "readwrite" }): Promise<Permission>;
  requestPermission(options: { mode: "readwrite" }): Promise<Permission>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  getFile(): Promise<File>;
};
type PickerOptions = {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
};
type PickerWindow = {
  showSaveFilePicker(options?: PickerOptions): Promise<FileHandle>;
  showOpenFilePicker(options?: PickerOptions & { multiple?: boolean }): Promise<FileHandle[]>;
};

function picker(): PickerWindow {
  return window as unknown as PickerWindow;
}

const FILE_TYPES = [
  { description: "教育コンテンツMASTERの保存ファイル", accept: { "application/json": [".json"] } },
];

async function getHandle(): Promise<FileHandle | null> {
  if (!isFileStoreSupported()) return null;
  try {
    return (await idbGet<FileHandle>(HANDLE_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function getStatus(): Promise<SaveFileStatus> {
  if (!isFileStoreSupported()) return { state: "unsupported" };
  const handle = await getHandle();
  if (!handle) return { state: "none" };
  try {
    const permission = await handle.queryPermission({ mode: "readwrite" });
    return permission === "granted"
      ? { state: "ready", name: handle.name }
      : { state: "needs-permission", name: handle.name };
  } catch {
    return { state: "none" };
  }
}

/** 新しく保存先ファイルを作る（ボタン押下など、利用者の操作から呼ぶこと） */
export async function chooseNewFile(): Promise<string> {
  const handle = await picker().showSaveFilePicker({
    suggestedName: "教育コンテンツMASTER_データ.json",
    types: FILE_TYPES,
  });
  await idbSet(HANDLE_KEY, handle);
  return handle.name;
}

/** すでにある保存ファイルを選び直す（別PCや再インストール後の復旧用） */
export async function chooseExistingFile(): Promise<{ name: string; items: EducationContent[] }> {
  const [handle] = await picker().showOpenFilePicker({ types: FILE_TYPES, multiple: false });
  if (!handle) throw new Error("ファイルが選ばれませんでした。");
  const permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    throw new Error("このファイルへの書き込みが許可されませんでした。");
  }
  await idbSet(HANDLE_KEY, handle);
  return { name: handle.name, items: (await readItems(handle)).contents };
}

/** 保存先の許可を取り直す（ブラウザを開き直した直後に必要になることがある） */
export async function regrantPermission(): Promise<boolean> {
  const handle = await getHandle();
  if (!handle) return false;
  const permission = await handle.requestPermission({ mode: "readwrite" });
  return permission === "granted";
}

export async function forgetFile(): Promise<void> {
  await idbDelete(HANDLE_KEY);
}

export type SaveFileContent = {
  contents: EducationContent[];
  /** 分類の並び順。古い保存ファイルには入っていない。 */
  categoryOrder?: CategoryOrder;
};

async function readItems(handle: FileHandle): Promise<SaveFileContent> {
  const file = await handle.getFile();
  const text = await file.text();
  if (!text.trim()) return { contents: [] };
  const parsed = JSON.parse(text) as unknown;
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed as { contents?: unknown }).contents;
  if (!Array.isArray(list)) throw new Error("保存ファイルの形式が違います。");
  const categoryOrder = Array.isArray(parsed)
    ? undefined
    : (parsed as { categoryOrder?: CategoryOrder }).categoryOrder;
  return { contents: list as EducationContent[], categoryOrder };
}

/** 保存ファイルの中身を読む。許可が無い・未設定なら null。 */
export async function loadFromFile(): Promise<SaveFileContent | null> {
  const handle = await getHandle();
  if (!handle) return null;
  try {
    if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") return null;
    return await readItems(handle);
  } catch {
    return null;
  }
}

/**
 * 保存ファイルへ書き出す。
 * 未設定・許可なしのときは false を返すだけで、画面の操作は止めない。
 */
export async function saveToFile(
  items: EducationContent[],
  categoryOrder?: CategoryOrder
): Promise<boolean> {
  const handle = await getHandle();
  if (!handle) return false;
  try {
    if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") return false;
    const writable = await handle.createWritable();
    await writable.write(
      JSON.stringify(
        { savedAt: new Date().toISOString(), contents: items, categoryOrder },
        null,
        2
      )
    );
    await writable.close();
    return true;
  } catch {
    return false;
  }
}
