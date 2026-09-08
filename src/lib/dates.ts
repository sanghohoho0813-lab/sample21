export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function daysAgo(n: number, base = new Date()): Date {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
export function daysAgoKey(n: number, base = new Date()) {
  return todayKey(daysAgo(n, base));
}
export function isoDaysAgo(n: number, hour = 10, minute = 0, base = new Date()) {
  const d = daysAgo(n, base);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
export function daysBetween(a: string | Date, b: string | Date) {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
export function fmtDate(iso: string | Date, opts: "short" | "long" | "time" | "datetime" = "short"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "-";
  if (opts === "short") return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  if (opts === "long") return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(d);
  if (opts === "time") return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${fmtDate(d, "short")} ${fmtDate(d, "time")}`;
}
export function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}일 전`;
  return fmtDate(iso);
}
