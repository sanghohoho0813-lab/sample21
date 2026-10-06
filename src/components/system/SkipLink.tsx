/** 키보드 사용자가 반복되는 메뉴를 건너뛰고 본문으로 바로 가는 링크 — Tab을 처음 누를 때만 보인다 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-xl focus:bg-brand-black focus:px-4 focus:py-3 focus:font-semibold focus:text-white"
    >
      본문 바로가기
    </a>
  );
}
