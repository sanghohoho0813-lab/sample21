export const krw = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const krwShort = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
};
export const num = (n: number) => Math.round(n).toLocaleString("ko-KR");
export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const pctDelta = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev);
export const signed = (n: number, digits = 1) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
export const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
