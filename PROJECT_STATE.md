# PROJECT_STATE.md — MORFIT 현재 공사 진행상황

PROJECT FINAL OBJECTIVE: 고객의 패션 쇼핑 행동이 옵션별 수요 데이터가 되고, 그 데이터가 MD의 재고·할인·재구매 Action을 바꾸며, 처리결과가 다시 고객 경험으로 돌아오는 실제 작동형 패션 AX+플랫폼 (DEMO).

```text
현재 상태            : Demo Ready (First Build 완료)
FRONT_REFERENCE      : PENDING — Drive 「샘플 21. 의류」 비어 있음. 사진·디자인 원본 추후 적용 (등록 경로 준비됨)
DELIVERY STAGE       : DEMO
현재 구현률(첫 빌드) : 약 80% — MORFIT 최종 MVP 목표 대비 (One-Shot 75 Gate 통과)
빌드                 : next build 성공 · 35 Route · typecheck 0 error
수용 테스트          : Whole-Hybrid Journey 21/21 PASS (프로덕션 빌드) · 8폭 × 32 Route 404 0 · 런타임 오류 0
```

## STRATEGIC GATES
| Gate | 상태 |
|---|---|
| PRIMARY CONSTRAINT | LOCKED — 옵션 단위 수요신호 단절 → 품절 손실 + 과잉재고 |
| MONEY KPI / BASELINE | 설계 완료 · BASELINE: UNKNOWN / REQUIRED (화면 표기) |
| DATA FOUNDATION | SSOT = seed.ts + store.ts · Supabase 전환 지점 분리 |
| AI / LOGIC | 4 Engine 규칙 기반 실동작 · LLM = AI READY (3곳 마커) |
| PROOF | Evidence Log 10 Type · 12주 실증 체크리스트 · Evidence Pack = READY |
| ADOPTION READINESS | 대표/MD/운영직원 역할별 화면 · 직원 이익(Action Center로 비교시간 감소) 명시 |
| RISK / GOVERNANCE | L2/L3만 · 자동발주 없음 · 개인정보 없음 · Fit 추천 책임 고지 |
| PLATFORM READINESS | MID — NEXT 5개 Preview로만 노출 |
| EVIDENCE | 시드 8 + 시연 중 자동 생성 |
| RED TEAM FINDINGS | P0 0 · P1 0 (수정 완료) · P2 → docs/RECOMMENDATIONS.md |

## SYSTEM CORE
- [x] App Shell (Customer Header/Footer/Bottom Nav · AX Sidebar 280px/Topbar) · 실시간 날짜·시각(PC/Mobile)
- [x] Settings: 9 Canonical Theme(전부 동작) · 글자크기 · 모션 · Role Preview · Permission Matrix · Demo/Ready/Next · 데모 초기화 · CSV Import(READY) · AI 상태 · 기술자산(해당없음) · 이미지 자산 등록표
- [x] Tutorial (AX 5 Step · Customer 3 Step, 실제 Route 위 Spotlight, Overlay 완전 해제)
- [x] Why AX 16 Section (회사 맞춤 · 목차 스크롤스파이 · 이미지 슬롯 3)
- [x] Presentation Mode 16 Step (실제 Route 이동 Guided Journey, 키보드 ←/→/ESC)
- [x] Device Preview (같은 Route iframe · 재귀 금지 · ESC/배경/닫기)
- [x] Surface Switch (AX→고객 / 고객 Demo Bar→AX, 고객 Role에서는 숨김)
- [x] Demo Reset (두 Surface 동시 초기화)

## CUSTOMER PLATFORM
- [x] Home(Editorial Hero·랭킹·취향 추천·신규 브랜드·급상승·시즌 편집·핏 CTA·신뢰) · 랭킹 · 신상품 · Shop(필터/정렬/Sheet) · 검색(최근·추천) · 브랜드/브랜드샵 · 스타일 찾기(핏 프로필)
- [x] 상품 상세: 갤러리(placeholder) · 옵션별 재고상태 · **Fit Signal**(규칙 기반, AI Ready) · 사이즈 가이드 · 리뷰(DEMO) · 관련/함께 본 · 찜 · 장바구니 · 바로 주문 · 재입고 알림(품절·품절 임박)
- [x] 찜/재입고 · 장바구니(쿠폰 Demo) · DEMO Checkout · 주문완료 · My(개요/주문/추천 · Loop 4 배너) · 주문 상세(취소/반품/교환) · 재입고 알림 목록 · 프로필
- [x] NEXT 5 Preview 페이지 (404 0)

## BUSINESS AX
- [x] 경영 대시보드(KPI 위계 12 · Drill-down · AI 브리핑 · 오늘의 Action · 매출 추이 · Demand Radar Top5 · Evidence · 기획의도 진입)
- [x] Growth & Action Center(Lifecycle 추천→확인→실행중→완료/보류/무시 · 근거·영향·주의 · 현재 데이터 스트립 · 승인 시 고객 환류)
- [x] 매출·마진 · 상품·SKU(+상세 9탭) · 재고·재입고(**Demand Radar** 365 옵션 · 저회전 · 입고 예정)
- [x] 고객·재구매(7 세그먼트 · Scenario D) · 핏·반품(Fit Risk · Scenario B · 반품 큐) · 캠페인·기획전(판정 · 생성 Demo) · 브랜드·파트너(NEXT 구분) · 주문·배송(상태 변경 → 고객 반영) · AX Evidence(Loop 보기 · 12주 체크리스트)

## DATA BRIDGE (Closed Loop, 실동작 확인)
- [x] Loop 1 재입고 알림 → Demand Radar +1 → act-001 승인·실행·완료 → 재고 +60 · 고객 알림 · 옵션 '입고 완료'
- [x] Loop 2 DEMO 주문 → AX 주문 목록 최상단 → 상품준비 → 고객 My Page 상태 반영
- [x] Loop 3 반품 요청(사이즈 작음) → Fit Risk ↑ → act-004 완료 → 상품 상세 핏 안내 변경 + 추천 +1 보정
- [x] Loop 4 cycle-due 세그먼트 → act-005 실행 → cp-06 running → My Page 추천 배너 + 장바구니 AERNO7 쿠폰

## AI / LOGIC
Demand&Restock(RULE+STAT, L3) · Fit(RULE, L2) · Markdown(RULE+OPT, L3) · Repeat(RULE+STAT, L2) — 전부 코드 계산. LLM 미연결(AI READY 마커 3곳: 경영 브리핑 / Demand 설명 / 핏 설명).

## RESPONSIVE / THEME
검증 폭 360/390/430/768/1024/1280/1440/1920 · 9 Theme 전환 실측 · Font 3단계 · Motion 감소.

## KNOWN ISSUES
- 사진 자산 미적용(의도) — Hero/Why AX/브랜드/상품은 색상 기반 Gradient placeholder
- Pretendard 웹폰트는 CDN 차단 환경에서 시스템 폰트로 폴백(정상 동작)
- 리뷰·캠페인 초안·반품 처리 상태는 localStorage(Demo) — Supabase 전환 시 store로 승격 필요

## USER ACTION QUEUE
```text
[ASSET]  1. Drive 「샘플 21. 의류」 사진을 /public/images 에 저장 → src/lib/assets.ts AVAILABLE 등록 (SETUP.md §1)
[OPTIONAL — Pilot 전환 시]
[DB]     2. Supabase 프로젝트 생성 · .env.local 2개 키 (SETUP.md §2)
[AI]     3. ANTHROPIC_API_KEY (경영 브리핑 1개만 연결) (SETUP.md §3)
[DEPLOY] 4. Vercel 배포 (환경변수 없이 DEMO 배포 가능)
```

## NEXT PRIORITY
1. 사진 자산 적용 후 Hero/Why AX 선명도·crop 재검증 (Visual Acceptance)
2. 실제 고객사 데이터 1~3종(상품/옵션/최근 주문) CSV → seed Adapter 교체
3. Pilot 1~2주차 Baseline 측정 지점 실측 (분석시간·전환율·반품률)

## 최근 주요 변경
- 첫 빌드 완료: 35 Route · 4 Closed Loop 실동작 · 수용 여정 21/21 · 반응형 8폭 검증
- Red Team 수정: 재구매율 비현실(93%→25%, 비회원 주문 도입) · 기간 비교 창 일 단위화 · 차트 애니메이션 제거 · 품절 임박 재입고 CTA · Preview 재귀 가드 · 헤더 폭 정리
