import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MORFIT — 멀티브랜드 패션 플랫폼",
    short_name: "MORFIT",
    description: "취향과 사이즈에 맞는 패션을 발견하는 멀티브랜드 커머스 (데모)",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "ko",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
