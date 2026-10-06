import { ImageResponse } from "next/og";

/* 링크 공유 미리보기(카카오톡·슬랙 등) 이미지 — 기본 글꼴에 한글이 없어 로고·영문만 쓴다 */
export const alt = "MORFIT — Multi-brand fashion platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "linear-gradient(135deg, #111111 0%, #1b2440 100%)", color: "#ffffff" }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "rgba(255,255,255,0.6)" }}>FASHION AX + PLATFORM</div>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 168, fontWeight: 900, letterSpacing: -6 }}>
          MORFIT<span style={{ color: "#315CF5" }}>.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "rgba(255,255,255,0.75)" }}>
          <span>Multi-brand fashion · size-aware shopping</span>
          <span>Demo</span>
        </div>
      </div>
    ),
    size,
  );
}
