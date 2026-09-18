/* ------------------------------------------------------------------
   미래AI랩 브릿지 CTA — 링크와 문구는 전부 여기서만 바꾼다.
   (화면 코드에는 URL·문구를 직접 쓰지 않는다)
------------------------------------------------------------------- */
export const MIRAE_LINKS = {
  /** 메인 CTA — 우리 회사도 만들어보기 */
  consult: "https://miraeailab.com/business-diagnosis",
  /** 다른 샘플 보기 */
  samples: "https://miraeailab.com/business-services",
  /** 미래AI랩 홈페이지 */
  home: "https://miraeailab.com/",
} as const;

export const MIRAE_COPY = {
  brand: "미래AI랩",
  badge: "MIRAE AI LAB",
  /** 제작 주체 고지 (로고는 이미 화면에 있으므로 텍스트로만) */
  madeBy: "이 샘플은 미래AI랩이 기획·제작했습니다",
  headline: "이 샘플이 마음에 드셨다면, 대표님 회사도 이렇게 설계해볼 수 있습니다.",
  desc: "미래AI랩은 평범한 회사를 기술·데이터·AI 기반의 성장형 기업으로 바꾸는 AX / MVP / 플랫폼 기획·개발을 진행합니다.",
  sub: "지금 보고 계신 화면도 같은 순서로 만들었습니다 — 문제 정의 → 데이터 구조 → 화면 → 실증.",
  /** 메인 CTA 문구 (통일) */
  consult: "우리 회사도 만들어보기",
  samples: "다른 샘플 보기",
  home: "미래AI랩 홈페이지",
  newTab: "새 창에서 열립니다",
} as const;

/** 스크린리더용 링크 설명 */
export const MIRAE_ARIA = {
  consult: `${MIRAE_COPY.consult} · 미래AI랩 무료 진단 페이지 (새 창)`,
  samples: `${MIRAE_COPY.samples} · 미래AI랩 서비스 페이지 (새 창)`,
  home: `${MIRAE_COPY.home} (새 창)`,
} as const;
