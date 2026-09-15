# PROJECT_STATE.md — MORFIT 현재 공사 진행상황

PROJECT FINAL OBJECTIVE: 고객의 패션 쇼핑 행동이 옵션별 수요 데이터가 되고, 그 데이터가 MD의 재고·할인·재구매 Action을 바꾸며, 처리결과가 다시 고객 경험으로 돌아오는 실제 작동형 패션 AX+플랫폼 (DEMO).

```text
현재 상태            : Demo Ready — 2차 고도화 완료 (Loop 1 완결 · Evidence Pack · Unit Economics · LLM Route · 접근성)
FRONT_REFERENCE      : PENDING — Drive 「샘플 21. 의류」 2026-09-15 재확인, 여전히 비어 있음. 사진 추후 적용 (등록 경로 준비됨)
DELIVERY STAGE       : DEMO
현재 구현률          : 약 88% — MORFIT 최종 MVP 목표 대비 (남은 것: 사진 자산 · 실측 Baseline · LLM 키)
빌드                 : next build 성공 · 36 Route(정적 32 + 동적 3 + API 1) · typecheck 0 error
수용 테스트          : Whole-Hybrid Journey 23/23 PASS (프로덕션 빌드) · 8폭 × 33 Route 404 0 · overflow 0 · 접근 이름 누락 0
```

## STRATEGIC GATES
| Gate | 상태 |
|---|---|
| PRIMARY CONSTRAINT | LOCKED — 옵션 단위 수요신호 단절 → 품절 손실 + 과잉재고 |
| MONEY KPI / BASELINE | 설계 완료 · BASELINE: UNKNOWN / REQUIRED (화면 표기) |
| DATA FOUNDATION | SSOT = seed.ts + store.ts · Supabase 전환 지점 분리 |
| AI / LOGIC | 4 Engine 규칙 기반 실동작 · LLM = AI READY (3곳 마커) · **/api/ai/explain Route 준비 — 키 설정 시 경영 브리핑 1곳 LIVE** |
| PROOF | Evidence Log 10 Type · 12주 실증 체크리스트 · **Evidence Pack DEMO 미리보기(인쇄·JSON) 동작** · Loop 1 알림→구매 전환 기록 |
| ADOPTION READINESS | 대표/MD/운영직원 역할별 화면 · 직원 이익(Action Center로 비교시간 감소) 명시 |
| RISK / GOVERNANCE | L2/L3만 · 자동발주 없음 · 개인정보 없음 · Fit 추천 책임 고지 |
| PLATFORM READINESS | MID — NEXT 5개 Preview로만 노출 |
| UNIT ECONOMICS | 계산 가능 항목(객단가·주문당 매출총이익·배송비·사입/위탁) 표시 · CAC/LTV/Payback = 측정 설계만 (VALIDATE LATER) |
| EVIDENCE | 시드 8 + 시연 중 자동 생성 |
| RED TEAM FINDINGS | 1차 P0 0 · P1 0 / 2차(접근성·Hover 자동 점검) 사이드바 hover 클래스 버그·터치 타겟 35종·Why AX 넘침 수정 완료 · P2 → docs/RECOMMENDATIONS.md |

## SYSTEM CORE
- [x] App Shell (Customer Header/Footer/Bottom Nav · AX Sidebar 280px/Topbar) · 실시간 날짜·시각(PC/Mobile)
- [x] Settings: 9 Canonical Theme(전부 동작) · 글자크기 · 모션 · Role Preview · Permission Matrix · Demo/Ready/Next · 데모 초기화 · CSV Import(READY) · AI 상태 · 기술자산(해당없음) · 이미지 자산 등록표
- [x] Tutorial (AX 5 Step · Customer 3 Step, 실제 Route 위 Spotlight, Overlay 완전 해제)
- [x] Why AX 16 Section (회사 맞춤 · 목차 스크롤스파이 · 이미지 슬롯 3)
- [x] Presentation Mode 16 Step (실제 Route 이동 Guided Journey, 키보드 ←/→/ESC)
- [x] Device Preview (같은 Route iframe · 재귀 금지 · ESC/배경/닫기)
- [x] Surface Switch (AX→고객 / 고객 Demo Bar→AX, 고객 Role에서는 숨김)
- [x] Demo Reset (두 Surface 동시 초기화)
- [x] 접근성·Hover 자동 점검 스크립트 (`npm run qa:a11y`) · 모바일 터치 타겟 40px+ · 인쇄 CSS(AX 셸 숨김)

## CUSTOMER PLATFORM
- [x] Home(Editorial Hero·랭킹·취향 추천·신규 브랜드·급상승·시즌 편집·핏 CTA·신뢰) · 랭킹 · 신상품 · Shop(필터/정렬/Sheet) · 검색(최근·추천) · 브랜드/브랜드샵 · 스타일 찾기(핏 프로필)
- [x] 상품 상세: 갤러리(placeholder) · 옵션별 재고상태 · **Fit Signal**(규칙 기반, AI Ready) · 사이즈 가이드 · 리뷰(DEMO) · 관련/함께 본 · 찜 · 장바구니 · 바로 주문 · 재입고 알림(품절·품절 임박)
- [x] 찜/재입고 · 장바구니(쿠폰 Demo) · DEMO Checkout · 주문완료 · My(개요/주문/추천 · Loop 4 배너) · 주문 상세(취소/반품/교환) · 재입고 알림 목록(대기/알림 도착/**구매 완료** · 주문 보기) · 프로필
- [x] NEXT 5 Preview 페이지 (404 0)

## BUSINESS AX
- [x] 경영 대시보드(KPI 위계 12 · Drill-down · AI 브리핑 + **"AI 설명 생성" 버튼(LLM 상태 READY/LIVE 표시)** · 오늘의 Action · 매출 추이 · Demand Radar Top5 · Evidence · 기획의도 진입)
- [x] Growth & Action Center(Lifecycle 추천→확인→실행중→완료/보류/무시 · 근거·영향·주의 · 현재 데이터 스트립 · 승인 시 고객 환류)
- [x] 매출·마진(+**Unit Economics 측정 설계**) · 상품·SKU(+상세 9탭) · 재고·재입고(**Demand Radar** 365 옵션 · 저회전 · 입고 예정)
- [x] 고객·재구매(7 세그먼트 · Scenario D) · 핏·반품(Fit Risk · Scenario B · 반품 큐) · 캠페인·기획전(판정 · 생성 Demo) · 브랜드·파트너(NEXT 구분) · 주문·배송(상태 변경 → 고객 반영) · AX Evidence(Loop 보기 · 12주 체크리스트) · **Evidence Pack 미리보기(/ax/evidence/pack · 인쇄 · JSON)**

## DATA BRIDGE (Closed Loop, 실동작 확인)
- [x] Loop 1 재입고 알림 → Demand Radar +1 → act-001 승인·실행·완료 → 재고 +60 · 고객 알림 · 옵션 '입고 완료' → **고객이 해당 옵션 주문 시 '구매 완료' + RESULT Evidence(알림→구매 전환)**
- [x] Loop 2 DEMO 주문 → AX 주문 목록 최상단 → 상품준비 → 고객 My Page 상태 반영
- [x] Loop 3 반품 요청(사이즈 작음) → Fit Risk ↑ → act-004 완료 → 상품 상세 핏 안내 변경 + 추천 +1 보정
- [x] Loop 4 cycle-due 세그먼트 → act-005 실행 → cp-06 running → My Page 추천 배너 + 장바구니 AERNO7 쿠폰

## AI / LOGIC
Demand&Restock(RULE+STAT, L3) · Fit(RULE, L2) · Markdown(RULE+OPT, L3) · Repeat(RULE+STAT, L2) — 전부 코드 계산. LLM: 서버 Route `/api/ai/explain` 준비(@anthropic-ai/sdk · claude-opus-5 · 키 없으면 규칙 텍스트 반환). 현재 키 없음 → AI READY (마커 3곳: 경영 브리핑 / Demand 설명 / 핏 설명).

## RESPONSIVE / THEME
검증 폭 360/390/430/768/1024/1280/1440/1920 · 9 Theme 전환 실측 · Font 3단계 · Motion 감소 · 인쇄 미디어(Evidence Pack) 실측 · 모바일 터치 타겟 40px+ (qa:a11y).

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
1. 사진 자산 적용 후 Hero/Why AX 선명도·crop 재검증 (Visual Acceptance) — Drive 폴더 업로드 대기
2. ANTHROPIC_API_KEY 제공 시 경영 브리핑 LIVE 검증(숫자 일치 확인) — 코드 변경 없이 키만 필요
3. 실제 고객사 데이터 1~3종(상품/옵션/최근 주문) CSV → seed Adapter 교체
4. Pilot 1~2주차 Baseline 측정 → Evidence Pack의 UNKNOWN/VALIDATE LATER 칸 채우기

## 최근 주요 변경
- 2차 고도화: Loop 1 알림→구매 전환 자동 기록(D-17) · Evidence Pack 미리보기 인쇄·JSON(D-18) · LLM Route 서버 연결 지점(D-19) · Unit Economics 측정 설계(D-20) · 접근성/Hover 자동 점검 + 터치 타겟·사이드바 hover 버그 수정 · 여정 QA 23 Step
- 첫 빌드 완료: 35 Route · 4 Closed Loop 실동작 · 수용 여정 21/21 · 반응형 8폭 검증
- Red Team 수정: 재구매율 비현실(93%→25%, 비회원 주문 도입) · 기간 비교 창 일 단위화 · 차트 애니메이션 제거 · 품절 임박 재입고 CTA · Preview 재귀 가드 · 헤더 폭 정리
