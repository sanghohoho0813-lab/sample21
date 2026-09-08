/* 최근 검색어 — localStorage `morfit-recent-search`, 최대 8개. */
export const RECENT_SEARCH_KEY = "morfit-recent-search";
export const RECENT_SEARCH_MAX = 8;

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, RECENT_SEARCH_MAX) : [];
  } catch { return []; }
}

function write(list: string[]) {
  try { window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list.slice(0, RECENT_SEARCH_MAX))); } catch { /* ignore */ }
}

export function pushRecentSearch(q: string): string[] {
  const t = q.trim();
  if (!t) return readRecentSearches();
  const next = [t, ...readRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, RECENT_SEARCH_MAX);
  write(next);
  return next;
}

export function removeRecentSearch(q: string): string[] {
  const next = readRecentSearches().filter((x) => x !== q);
  write(next);
  return next;
}

export function clearRecentSearches(): string[] {
  write([]);
  return [];
}

/** 추천 검색어 (Demo) — 인기 키워드 + 브랜드 */
export const SUGGESTED_SEARCHES = ["오버핏 셔츠", "와이드 데님", "울 코트", "첼시 부츠", "크롭 가디건", "플리스", "트렌치", "후디"];
