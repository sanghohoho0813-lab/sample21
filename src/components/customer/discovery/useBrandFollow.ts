"use client";
/* 브랜드 팔로우(찜) — localStorage `morfit-brand-follow`. Demo-only, no server. */
import { useCallback, useEffect, useState } from "react";

export const BRAND_FOLLOW_KEY = "morfit-brand-follow";
const EVT = "morfit:brand-follow";

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(BRAND_FOLLOW_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

export function useBrandFollow() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(read()); setReady(true);
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const toggle = useCallback((brandId: string) => {
    const cur = read();
    const on = !cur.includes(brandId);
    const next = on ? [...cur, brandId] : cur.filter((x) => x !== brandId);
    try { window.localStorage.setItem(BRAND_FOLLOW_KEY, JSON.stringify(next)); } catch { /* private mode etc. */ }
    setIds(next);
    window.dispatchEvent(new Event(EVT));
    return on;
  }, []);

  const isFollowing = useCallback((brandId: string) => ids.includes(brandId), [ids]);
  return { following: ids, isFollowing, toggle, ready };
}
