/** 향후 확장(예정) 메뉴 — 고객 메뉴·푸터·/next/[slug] 화면과 그 탭 제목이 같은 목록을 쓴다 */
export const NEXT_MENUS = [
  { slug: "membership", label: "멤버십", desc: "등급별 적립·무료배송·선공개" },
  { slug: "partner-center", label: "브랜드 파트너센터", desc: "브랜드 직접 상품등록·재고연동·정산" },
  { slug: "ads", label: "광고·기획전 상품", desc: "브랜드 노출 상품과 기획전 신청" },
  { slug: "style-content", label: "스타일 콘텐츠", desc: "룩북·매거진·스타일링 가이드" },
  { slug: "b2b", label: "B2B 단체구매", desc: "기업·단체 유니폼·단체복 견적" },
] as const;
