import type { MetadataRoute } from "next";

/** 고객 화면만 색인 대상. 운영화면(/ax)과 API는 검색에 노출하지 않는다. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/ax", "/api"] } };
}
