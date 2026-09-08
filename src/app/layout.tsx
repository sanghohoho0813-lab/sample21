import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/system/AppProviders";

export const metadata: Metadata = {
  title: { default: "MORFIT — 멀티브랜드 패션 플랫폼", template: "%s | MORFIT" },
  description: "여러 브랜드를 한곳에서. 취향과 사이즈에 맞는 패션을 발견하는 멀티브랜드 커머스 MORFIT (DEMO).",
  openGraph: { title: "MORFIT — 멀티브랜드 패션 플랫폼", description: "취향과 사이즈에 맞는 패션을 발견하세요.", type: "website", locale: "ko_KR", siteName: "MORFIT" },
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#111111" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="deep-navy" data-font="default" data-motion="normal" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
