"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HasId = { id: string };

/**
 * 一覧で「今しがた自分が変更した行」を、その場に留めておくための仕組み。
 *
 * 例：状態で絞り込んでいる最中に「完成」へ変えると、
 * そのままでは絞り込み条件から外れて行が消えてしまう。
 * 変更した行は消さず、並び順が変わっても元の位置に置いたままにする。
 * 絞り込みや並び順を操作したときは、留め置きを解除して通常の一覧に戻す。
 */
export function useStickyList<T extends HasId>(
  /** 絞り込み・並び替え済みの一覧 */
  base: T[],
  /** 絞り込み前の全件（消えた行を引き戻すための元データ） */
  pool: T[],
  /** 絞り込み条件や並び順が変わったことを表す文字列 */
  resetKey: string
) {
  const [stickyIds, setStickyIds] = useState<string[]>([]);
  const orderRef = useRef<string[]>([]);

  // 絞り込み・並び順を変えたら、留め置きは解除する
  useEffect(() => {
    setStickyIds((prev) => (prev.length === 0 ? prev : []));
  }, [resetKey]);

  const markSticky = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setStickyIds((prev) => [...new Set([...prev, ...ids])]);
  }, []);

  const clearSticky = useCallback(() => setStickyIds([]), []);

  const { items, outOfFilterIds } = useMemo(() => {
    const poolById = new Map(pool.map((p) => [p.id, p]));
    const pinned = stickyIds.filter((id) => poolById.has(id));

    if (pinned.length === 0) {
      return { items: base, outOfFilterIds: new Set<string>() };
    }

    const pinnedSet = new Set(pinned);
    const baseIds = new Set(base.map((b) => b.id));
    const rest = base.filter((b) => !pinnedSet.has(b.id));
    const restIndex = new Map(rest.map((r, i) => [r.id, i]));

    const prev = orderRef.current;
    const prevIndex = new Map(prev.map((id, i) => [id, i]));

    // 留め置き対象を、前回そこにあった位置へ差し戻す
    const insertions = new Map<number, string[]>();
    const appended: string[] = [];
    for (const id of prev) {
      if (!pinnedSet.has(id)) continue;
      const pi = prevIndex.get(id);
      if (pi === undefined) continue;
      let at = 0;
      for (let k = pi - 1; k >= 0; k -= 1) {
        const j = restIndex.get(prev[k]!);
        if (j !== undefined) {
          at = j + 1;
          break;
        }
      }
      const list = insertions.get(at);
      if (list) list.push(id);
      else insertions.set(at, [id]);
    }
    for (const id of pinned) {
      if (!prevIndex.has(id)) appended.push(id);
    }

    const merged: T[] = [];
    for (let i = 0; i <= rest.length; i += 1) {
      for (const id of insertions.get(i) ?? []) {
        const item = poolById.get(id);
        if (item) merged.push(item);
      }
      if (i < rest.length) merged.push(rest[i]!);
    }
    for (const id of appended) {
      const item = poolById.get(id);
      if (item) merged.push(item);
    }

    // 絞り込み条件から外れているのに表示している行（画面で理由を伝えるため）
    const outOfFilterIds = new Set(pinned.filter((id) => !baseIds.has(id)));
    return { items: merged, outOfFilterIds };
  }, [base, pool, stickyIds]);

  // 次回の差し戻し位置の基準として、今表示した並びを覚えておく
  useEffect(() => {
    orderRef.current = items.map((i) => i.id);
  }, [items]);

  return { items, outOfFilterIds, markSticky, clearSticky };
}
