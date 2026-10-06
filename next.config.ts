import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 메타데이터(제목·설명·공유 이미지)를 모든 요청에서 <head>에 바로 넣는다. 기본값은 크롤러가 아닌 요청에
  // 본문 끝으로 스트리밍하는데, 이 앱의 generateMetadata는 시드 조회뿐이라 기다릴 비용이 없다.
  htmlLimitedBots: /.*/,
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
