import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/system/AppProviders";
import Script from "next/script";

/** 공유 미리보기 이미지 등 절대 주소의 기준 — 배포 주소(NEXT_PUBLIC_SITE_URL) → Vercel 운영 주소 → 로컬 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MORFIT — 멀티브랜드 패션 플랫폼", template: "%s | MORFIT" },
  description: "여러 브랜드를 한곳에서. 취향과 사이즈에 맞는 패션을 발견하는 멀티브랜드 커머스 MORFIT (데모).",
  openGraph: {
    title: "MORFIT — 멀티브랜드 패션 플랫폼",
    description: "취향과 사이즈에 맞는 패션을 발견하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "MORFIT",
  },
  icons: { icon: "/favicon.svg" },
  applicationName: "MORFIT",
  // iOS가 주문번호·금액 같은 숫자를 전화 링크로 바꾸지 않게
  formatDetection: { telephone: false, address: false, email: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      data-theme="deep-navy"
      data-font="default"
      data-motion="normal"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Device Preview Safety: inside the preview iframe, hide preview triggers before hydration (no recursion). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(window.self!==window.top){document.documentElement.setAttribute('data-preview','1')}}catch(e){document.documentElement.setAttribute('data-preview','1')}",
          }}
        />
      </head>
      <body>
        {/* 미래AI랩 데모 공용 뒤로·앞으로 버튼 */}
        <Script src="/mirae-history-nav.js" strategy="beforeInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
