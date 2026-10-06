"use client";
/* 루트 레이아웃까지 실패했을 때의 마지막 안전망 — 전역 CSS·폰트가 없을 수 있으므로 인라인 스타일만 쓴다. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif", color: "#111", background: "#fff" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <p style={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: 22, margin: 0 }}>MORFIT.</p>
            <h1 style={{ fontSize: 22, margin: "16px 0 8px" }}>일시적인 문제로 화면을 열 수 없습니다</h1>
            <p style={{ color: "#555", margin: 0 }}>잠시 후 다시 시도해 주세요.</p>
            <button onClick={reset} style={{ marginTop: 24, height: 44, padding: "0 20px", borderRadius: 12, border: 0, background: "#111", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>다시 시도</button>
          </div>
        </main>
      </body>
    </html>
  );
}
