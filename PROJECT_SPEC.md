# PROJECT_SPEC.md — MORFIT 패션·의류 AX + 멀티브랜드 플랫폼

> 이 파일은 Unified v3.0 규격과 MORFIT 마스터 프롬프트를 읽은 뒤 **이번 프로젝트에 실제로 적용하는 설계도**다.
> 일상 개발은 이 파일을 우선 읽는다. 충돌 시 우선순위: 사용자 최신 지시 > MORFIT 마스터 프롬프트 > 본 SPEC > Unified v3.0 > Front Reference > 자율판단.

```text
PROJECT NAME      : MORFIT
DIRECTORY         : morfit-fashion-ax-platform (repo: sanghohoho0813-lab/sample21)
PRODUCT TYPE      : Business AX + Customer Platform Hybrid
INDUSTRY          : 패션·의류 멀티브랜드 유통·커머스
DELIVERY STAGE    : DEMO
CAPABILITY STATUS : Customer/AX CORE = DEMO(실동작) · Supabase/AI API/PG = READY · Partner Center 등 = NEXT
FRONT REFERENCE   : PENDING (Google Drive 「샘플 21. 의류」 폴더 비어 있음 → NEUTRAL PREMIUM MODE + MORFIT §35 무드로 구현, 사진은 추후 적용)
```

## 0. STRATEGY LOCK (PASS 1-A)

| 항목 | 결정 |
|---|---|
| AX VERDICT | **FULL / GO** — 옵션(색상×사이즈) 단위 반복 거래·재고·행동 데이터가 매일 생성됨 |
| CAPITAL INDEPENDENCE | **YES** — 품절 손실·과잉재고·MD 분석시간·사이즈 반품·재구매 누락은 정책자금 없이도 비용/매출로 직접 연결 |
| PRIMARY CONSTRAINT | 고객의 조회·검색·찜·재입고 신청·사이즈 선택 데이터가 옵션별 재고·판매 데이터와 연결되지 않아 MD가 **어떤 색상·사이즈를 언제 확보하고 무엇을 할인·노출할지** 늦게 판단 → 품절 매출손실 + 과잉재고 동시 발생 |
| CORE VALUE 1 (Cost) | MD가 화면을 오가며 비교하던 분석시간 감소 → Action Center에서 우선순위 즉시 확인 |
| CORE VALUE 2 (Revenue) | 품절위험·재입고 수요·재구매 후보·교차판매 기회를 먼저 발견 |
| CORE VALUE 3 (Scale) | 브랜드·SKU가 늘어도 동일 인력으로 옵션·고객·캠페인 우선순위 관리 |
| MONEY KPI — Cost | 주간 상품·재고 분석시간 / 위험 발견→확인 시간 / 수기 보고서 수 |
| MONEY KPI — Revenue | 구매전환율 / 찜→구매 / 재입고 알림→구매 / 재구매율 / 품절 추정 손실 / 추천상품 구매율 |
| MONEY KPI — Scale | MD 1인당 활성 SKU / 직원 1인당 주문 / 관리 브랜드 수 / AX 처리 Action 비율 |
| BASELINE STATUS | **UNKNOWN / REQUIRED** — Demo 숫자는 SIMULATION 표기, 개선율은 지어내지 않음 (VALIDATE LATER) |
| PRIMARY CONVERSION | 탐색 → 옵션 선택 → 장바구니 → 주문정보 → DEMO 결제예정 → 주문완료 |
| SECONDARY GOAL | ① 핏 프로필 완성 + 추천 확인 ② 찜 / 품절 옵션 재입고 알림 신청 |
| PROCESS REDESIGN | ELIMINATE(채널별 중복 확인) → STANDARDIZE(상품·옵션·반품사유·Action 상태) → DIGITIZE(고객 Event) → AUTOMATE(계산·알림·상태) → AI(설명·복합판단만) |
| SHARED DATA ASSET / SSOT | `src/lib/demo/seed.ts`(정적 Demo Repository) + `src/lib/store.ts`(변경분, localStorage) — Supabase 전환 시 store action만 교체 |
| CUSTOMER EVENT → AX MAP | view/wishlist/cart/restock → Demand Radar · order → 주문/매출/재고 · return → Fit Risk · profile/purchase cycle → 재구매 세그먼트 |
| AI METHOD MATRIX | Engine 1 Demand&Restock(RULE+STAT, L3, MID) · Engine 2 Fit(RULE, L2, MID) · Engine 3 Markdown(RULE+OPT, L3, MID) · Engine 4 Repeat(RULE+STAT, L2, LOW) · AI Briefing = **AI READY**(LLM 연결 시 1순위) |
| PROOF PLAN | Evidence Log(10 Type) + 12주 실증 준비(§33) — Demo에서는 `실증 준비 / Demo Evidence`만 표시 |
| PLATFORM READINESS | **MID** — 소비자 커머스 + 내부 운영체계 우선. 산업 플랫폼/SaaS 과장 금지 |
| FUTURE EXPANSION (NEXT 5) | 멤버십 · 브랜드 파트너센터 · 광고·기획전 상품 · 스타일 콘텐츠 · B2B 단체구매 → `/next/[slug]` Preview 페이지 (404 금지) |
| MOAT CANDIDATE | 옵션 단위 수요×반품×핏 데이터(Proprietary Data) · MD Workflow(Action Lifecycle) · 고객 핏 프로필(Switching Cost) — 기술스택은 Moat 아님 |
| RISK | Fit 추천 오류(MID→고객 최종 선택 책임 명시) · 자동발주 없음(L3) · 개인정보 없음(가상 데이터) |
| NOT BUILDING | 실 PG · 택배 API · 자동발주 L4 · 브랜드 정산 · 파트너 로그인 · 자체 ML 학습 · Native App · 대규모 셀러센터 · 광고경매 · 커뮤니티 · 무신사 UI 복제 · 실제 개인정보 |
| STRATEGIC ACCEPTANCE | Strategic P0 = 0 목표 (Demo/Live 혼동 0 · Baseline 없는 개선율 0 · 근거 없는 AI 0 · L4 자동실행 0) |

## 1. Customer IA
```
Header  : 홈 · 랭킹 · 신상품 · 브랜드 · 남성 · 여성 · 스타일 찾기 · 세일 | 검색 · 알림 · 찜 · 장바구니 · 마이
Mobile  : Bottom Nav = 홈 / 카테고리(Sheet) / 검색(Sheet) / 찜 / 마이, Hamburger = 전체 메뉴 Drawer
Routes  : / · /ranking · /new · /brands · /brands/[slug] · /shop(?gender,category,sale,...) · /search(?q) · /style
          /products/[id] · /wishlist · /cart · /checkout · /checkout/complete/[orderId]
          /my · /my/orders · /my/orders/[id] · /my/restock · /my/profile · /next/[slug]
Demo Control Bar (대표·관리자 Role만): [시연] [스마트폰 보기] [Business AX 보기]
```

## 2. Business AX IA
```
01 경영 대시보드 /ax · 02 Growth & Action Center /ax/actions · 03 매출·마진 /ax/sales · 04 상품·SKU /ax/products(+/[id])
05 재고·재입고 /ax/inventory (Demand Radar) · 06 고객·재구매 /ax/customers · 07 핏·반품 /ax/fit-returns · 08 캠페인·기획전 /ax/campaigns
09 브랜드·파트너 /ax/brands · 10 주문·배송 /ax/orders · 11 AX Evidence /ax/evidence · 12 기획의도 /ax/why · 13 시연 모드 /ax/present · 14 설정 /ax/settings
Sidebar 280px(Theme Shell) · Topbar: 실시간 시계 · 역할(대표/MD/운영) · 튜토리얼 · 시연 · 스마트폰 보기 · [고객 화면 보기]
Mobile  : Bottom Nav = 대시보드 / Action / 재고 / 주문 / 더보기(Drawer)
```

## 3. Roles / Permission (src/lib/roles.ts)
대표(owner) 전체 · MD 브랜드/상품/마진/Action/캠페인(전체 손익·권한·자금 제외) · 운영(ops) 주문/반품/재입고 문의/담당 Action(마진·캠페인 제외) · 고객(customer) Business AX 접근 불가(→ `/`로 리다이렉트). 설정 > Permission Matrix로 시각화.

## 4. Closed Data Loops (4개 설계 / 4개 Demo 실동작)
| Loop | Customer Event | AX 반영 | Action | 고객 환류 | Evidence |
|---|---|---|---|---|---|
| 1 관심 급증→재입고 | 조회·찜·재입고 알림(`subscribeRestock`) | Demand Radar `restockRequests`↑ | act-001 재입고 → 완료 시 `inventoryDelta`+수량 | 재입고 알림 Notification + 옵션 상태 `restocked` | CUSTOMER→ACTION→RESULT |
| 2 주문→재고·배송 | DEMO 주문(`placeOrder`) | 주문 목록·매출·재고 즉시 반영 | 운영직원 상태 변경(`updateOrderStatus`) | My Page 주문상태 + Notification | CUSTOMER→ACTION |
| 3 사이즈 반품→핏 개선 | 반품 요청(`requestReturn`) | Fit Risk `returnDelta`↑ | act-004 핏 안내 강화 → `fitNoteOverride` | 상품 상세 핏 안내 변경 + 추천 규칙 +1 보정 | RISK→RESULT |
| 4 구매주기→재구매 | 구매이력·관심브랜드 | cycle-due 세그먼트 42명 | act-005 캠페인 → cp-06 running | My Page 추천 + Notification | ACTION→CUSTOMER |

## 5. Data Model (src/lib/types.ts)
Brand · Category · Product · Variant(옵션) · Customer · Order/OrderItem · ReturnRequest · Campaign · AXAction · EvidenceLog · RestockSubscription · CartItem · FitProfile · TrackedEvent · Notification · DailyPoint · ProductDaily.
Demo 규모: 브랜드 10 · 상품 48 · 옵션 365 · 고객 361 · 주문 1,27x(90일) · 반품 9x · 캠페인 8 · Action 12 · Evidence 8.
Scenario A: `p-nove-oxford` 블랙 M (재고 4, 7일 판매 21 vs 13, 찜 41, 알림 18) · B: `p-plane-wide` 사이즈 작음 반품 · C: `p-still-balmacaan` 저회전 · D: AERNO 구매주기 도래 42명.

## 6. Event Tracking (Adapter: store.track)
view_home · search_product · select_category · view_product · select_color · select_size · complete_fit_profile · view_fit_recommendation · add_wishlist · remove_wishlist · subscribe_restock · add_to_cart · begin_checkout · complete_demo_order · view_order · request_return · view_recommendation · click_recommendation · return_visit

## 7. Visual Direction
- Customer: Black/White/Warm Ivory/Cobalt `#315CF5` · Editorial · Image-led(사진은 추후, gradient placeholder) · 굵은 제목 · 1280px · 모바일 2열 · Pure White Form/Checkout/My
- AX: Theme 01 Deep Navy Blue 기본, 9 Canonical Theme 전부 동작(Settings) · Root 19px · Sidebar 280px · KPI→Insight→Action→Evidence 우선 · Pure White Raised Surface · Error Red = 의미색만
- PROJECT SIGNATURE: ① Editorial Commerce Discovery ② Fit Signal ③ Demand Radar ④ Closed Loop Timeline

## 8. CORE / CONDITIONAL / PLUS
- CORE: Shared Foundation · Customer 핵심 Journey · AX 핵심 Flow · Data Bridge(4 Loop) · Demo Repository · KPI→Detail→Insight→Action→Result→Evidence · Role · 9 Theme · Device Preview · Surface Switch · Why AX · Presentation · Responsive · Interaction Integrity · Demo Reset · Data Freshness
- CONDITIONAL(조건 충족 시): Supabase/Auth/RLS · 실제 AI API 1개(AI Briefing) · 실제 이미지 자산 · CSV Import · 외부 API
- PLUS: 추가 브랜드 Story · 보고서 Export · Evidence Pack 고도화 · Partner Center Preview 고도화 · 고급 Motion

## 9. Acceptance (요약 — 상세는 QA_REPORT.md)
Fresh Load → Customer Home 5초 테스트 → 랭킹 → 상세 → 핏 프로필 → 추천 → 재입고 알림 → AX 전환 → Role → Demand Radar → Action 승인/실행 → 고객 알림 → DEMO 주문 → AX 주문 반영 → 배송상태 변경 → My Page → Evidence → Why AX → 시연 모드 → 9 Theme → PC/Mobile Preview → 설정 → Demo Reset.
Strategy 98+ / Product 98+ 목표 · Strategic P0 0 · Product P0 0.
