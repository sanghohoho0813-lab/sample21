/* ------------------------------------------------------------------
   Visual Asset Registry — 사진은 추후 적용 (Google Drive 「샘플 21. 의류」).
   1) 파일을 /public/images/<filename> 에 넣고
   2) 아래 AVAILABLE 에 파일명을 추가하면 placeholder 대신 실제 사진이 사용됩니다.
   MORFIT Master Prompt §38 Image Asset Pack 파일명 규격을 그대로 따릅니다.
------------------------------------------------------------------- */
export const ASSET_PACK = {
  customer: [
    "hero_main.jpg", "hero_secondary.jpg", "fashion_editorial_01.jpg", "fashion_editorial_02.jpg", "fashion_editorial_03.jpg",
    "category_outer.jpg", "category_top.jpg", "category_bottom.jpg", "category_shoes.jpg", "category_bag.jpg",
    "brand_aerno.jpg", "brand_nove.jpg", "brand_stillform.jpg", "fit_profile.jpg", "order_scene.jpg", "trust_delivery.jpg", "mobile_card_vertical.jpg",
  ],
  ax: [
    "ax_cover_main.jpg", "ax_merchandiser_work.jpg", "ax_inventory_operation.jpg", "ax_manager_tablet.jpg", "ax_fashion_showroom.jpg", "ax_report_evidence.jpg",
    "why_ax_01_current.jpg", "why_ax_02_improved.jpg", "why_ax_03_growth.jpg",
  ],
} as const;

/** 실제로 /public/images 에 존재하는 파일만 여기에 등록한다. 비어 있으면 전부 placeholder. */
export const AVAILABLE: string[] = [];

export function assetUrl(name: string): string | null {
  return AVAILABLE.includes(name) ? `/images/${name}` : null;
}
