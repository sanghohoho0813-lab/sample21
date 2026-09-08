# DECISIONS.md — MORFIT 주요 설계 결정 (WHY / WHY NOT / REVISIT WHEN)

## D-01 Customer Front와 Business AX를 하나의 Next.js 앱, 하나의 Zustand 스토어로 구현
- WHY: Closed Data Loop(고객 Event → AX → 고객 환류)를 Demo에서 **실제로** 체감시키려면 두 Surface가 같은 상태를 공유해야 함. 별도 앱/Mock API는 왕복 지연과 불일치를 만든다.
- WHY NOT ALTERNATIVE: (a) Supabase 즉시 도입 — API 키·비용·설정이 Hard Blocker가 되어 첫 빌드가 멈춤. (b) 두 앱 분리 — 시연 시 상태 동기화 불가.
- REVISIT WHEN: Pilot 전환 시 `store.ts` action을 Supabase repository 호출로 교체(구조는 이미 분리).

## D-02 Demo Repository = 결정론적 시드(PRNG) + 주문에서 파생되는 판매·재고 통계
- WHY: 매출·주문·수량·재고·반품·찜이 서로 모순되면 심사자가 즉시 신뢰를 잃는다. 주문을 먼저 생성하고 옵션 판매·일별 매출을 **주문에서 계산**해 정합성을 보장.
- WHY NOT: 화면별 하드코딩 숫자 — 유지보수 불가, 모순 발생.
- REVISIT WHEN: 실데이터 CSV Import 시 seed를 Adapter로 대체.

## D-03 Scenario A~D를 주문 생성에 결정론적으로 주입
- WHY: 시연 스토리(옥스포드 셔츠 블랙 M 급상승·품절위험, 데님 사이즈 반품, 발마칸 코트 저회전, AERNO 재구매 주기)가 어떤 날짜에 열어도 유지되어야 함. Action 카드의 근거 문장도 계산값으로 생성.
- REVISIT WHEN: 실데이터 연결 후 Scenario 제거.

## D-04 AI는 전부 규칙 기반(RULE/STAT) + "AI READY" 표시, LLM 호출 없음
- WHY: API 키 없음. Unified §42 "외부 LLM API 임의 호출 금지". 재입고·할인·핏·재구매는 규칙과 수식으로 충분히 설명 가능(AI Fit Gate 통과 4개). 자연어 브리핑만 LLM 가치가 높아 1순위 연결 지점으로 준비(`src/lib/ai.ts`).
- WHY NOT: "AI가 추천했습니다" 포장 — Strategic P0.
- REVISIT WHEN: `ANTHROPIC_API_KEY` 제공 시 `/api/ai/explain` Route 추가 후 AI Briefing 1개만 연결.

## D-05 자동발주 L4 미구현, 모든 Action은 L2/L3(사람 승인)
- WHY: Error Cost MID, 브랜드 정책·현금흐름에 영향. MORFIT 프롬프트 §19 명시.
- REVISIT WHEN: 12주 실증 후 저위험 베이식(UNIT ZERO 티셔츠 등)에 한해 L4 검토.

## D-06 Customer Public 화면에 Theme Picker 미노출, 브랜드 토큰 고정 + AX 테마 연동은 Accent만
- WHY: MORFIT은 독립 패션 브랜드로 보여야 함(§35). Unified §Hybrid Theme 규칙(AX 선택 테마가 Customer에도 전달)은 `--brand-accent`가 테마 Primary를 따르는 방식으로 충족. 기본 테마(01 Deep Navy)에서는 MORFIT Cobalt `#315CF5`.
- WHY NOT: 고객 화면 전체를 테마색으로 물들이기 — 브랜드 일관성 훼손.

## D-07 Device Preview = 같은 Route를 iframe으로 여는 True Viewport
- WHY: 부모 transform으로 fixed/sticky가 깨지는 CSS-scale 방식의 P0 결함을 원천 차단. iframe 내부(`window.self !== window.top`)에서는 Preview 버튼을 숨겨 재귀 금지. 상태는 localStorage로 공유.
- WHY NOT: 별도 `/mobile-preview` Route — 404·상태 불일치 위험.

## D-08 사진 자산은 추후 적용, 지금은 색상 DNA 기반 Gradient Placeholder
- WHY: 사용자 지시("사진은 추후 적용"). Drive 폴더가 비어 있음. 빈 박스 대신 상품 색상으로 만든 placeholder를 사용하고, `/public/images` + `src/lib/assets.ts` 등록만으로 교체 가능하게 설계.
- REVISIT WHEN: Drive 폴더에 자산 업로드 시 `AVAILABLE` 배열 등록.

## D-09 Font: Pretendard Variable(CDN) + 시스템 폴백, Root 18px(Customer)/19px(AX)
- WHY: 한글 가독성·Executive Readability. 오프라인/차단 환경에서도 시스템 폰트로 안전.

## D-10 Recharts 2.x 사용 (3.x 미사용)
- WHY: 안정성·문서량. 차트는 모두 실제 데이터에서 렌더링(가짜 이미지 금지).

## D-11 NEXT 메뉴는 `/next/[slug]` Preview 페이지로 구현 (Footer + Drawer 노출, 상단 Nav에는 미노출)
- WHY: 70/30 규칙. 현재 핵심 8개 메뉴가 우선. Preview 페이지는 예상 기능 3~5개만 보여주고 "향후 확장" 배지로 현재 기능과 분리.

## D-12 기술자산(특허·벤처) 표시 = "해당없음 (Demo 프로젝트)"
- WHY: 가상 회사. 출원하지 않은 특허를 출원된 것처럼 표시 금지(Unified §71).
