import { ImageResponse } from "next/og";

/* iOS 홈 화면 아이콘 — favicon.svg와 같은 'M + 파란 점' 모양 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111111", color: "#ffffff", fontSize: 120, fontWeight: 900, position: "relative" }}>
        M
        <div style={{ position: "absolute", top: 26, right: 26, width: 26, height: 26, borderRadius: 13, background: "#315CF5" }} />
      </div>
    ),
    size,
  );
}
