# PROJECT_STATE.md — MORFIT 현재 공사 진행상황

PROJECT FINAL OBJECTIVE: 고객의 패션 쇼핑 행동이 옵션별 수요 데이터가 되고, 그 데이터가 MD의 재고·할인·재구매 Action을 바꾸며, 처리결과가 다시 고객 경험으로 돌아오는 실제 작동형 패션 AX+플랫폼 (DEMO).

```text
현재 상태            : Demo Ready — 8차 3차 고도화 완료 (쿠폰 금액 결함 수정 · 금액·검증 규칙 단일화 · 서버 메타데이터 · 창 키보드 접근성 · 시드 5배 가속 · 단위 테스트 44 · CI)
FRONT_REFERENCE      : PENDING — Drive 「샘플 21. 의류」 2026-09-15 재확인, 여전히 비어 있음. 사진 추후 적용 (등록 경로 준비됨)
DELIVERY STAGE       : DEMO
현재 구현률          : 약 88% — MORFIT 최종 MVP 목표 대비 (남은 것: 사진 자산 · 실측 Baseline · LLM 키)
빌드                 : next build 성공(빌드 시 ESLint 포함) · Next 15.5.27 · typecheck 0 · ESLint 0 · Prettier 형식 통일 · 운영 의존성 보안 경고 0 · 단위 테스트 44/44 (npm run check · GitHub Actions)
수용 테스트          : Whole-Hybrid Journey 25/25 PASS · 사용 흐름·예외 33/33 PASS (qa:flows) (프로덕션 빌드) · 8폭 × 33 Route 404 0 · overflow 0 · 접근 이름 누락 0 · 레이아웃 결함 0 (일반·햄버거·긴 데이터 × 8폭 × 34 Route)
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
- [x] AX 메뉴 1차 8개 · 최대 2단계(아코디언 + 섹션 탭, D-27) · 활성 화면 1곳만 강조 · 햄버거 왼쪽 · Drawer 86vw/최대 380px · 배경 스크롤 잠금
- [x] 고객 전체 메뉴 1차 7개 · '확장 기능 보기(예정)' 접기 · 화면 전환 CTA 통일(고객 플랫폼 보기 / AX 운영화면 보기)
- [x] 한글 UI 통일(D-28) · 글자 하한 0.78rem · 한글 단어 단위 줄바꿈 · 숫자/날짜 한 줄(D-29) · 레이아웃 자동 검사 `npm run qa:layout`(D-30) · ESLint(D-31)
- [x] Settings: 9 Canonical Theme(전부 동작 · 아이콘 10단계 톤이 테마를 따라 이동) · 글자크기 · 모션 · Role Preview · Permission Matrix · Demo/Ready/Next · 데모 초기화 · CSV Import(READY) · AI 상태 · 기술자산(해당없음) · 이미지 자산 등록표
- [x] Tutorial (AX 5 Step · Customer 3 Step, 실제 Route 위 Spotlight, Overlay 완전 해제)
- [x] Why AX 16 Section (회사 맞춤 · 목차 스크롤스파이 · 이미지 슬롯 3)
- [x] Presentation Mode 16 Step (실제 Route 이동 Guided Journey, 키보드 ←/→/ESC)
- [x] Device Preview (같은 Route iframe · 재귀 금지 · ESC/배경/닫기)
- [x] 화면 전환 (AX → "고객 플랫폼 보기" 헤더·Drawer 하단 / 고객 데모 바·Drawer 하단 → "AX 운영화면 보기", 고객 역할에서는 숨김)
- [x] 미래AI랩 브릿지 CTA — 고객·AX 전 화면 하단 공통(`SampleBridgeCTA`) + AX 사이드바 축소판(`SampleBridgeMini`) · 링크/문구는 `src/lib/mirae.ts`
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
검증 폭 360/390/412/430/768/1024/1280/1440/1920 · AX 고정 사이드바는 1280px부터(그 아래 햄버거 Drawer, D-32) · 9 Theme 전환 실측 · Font 3단계 · Motion 감소(설정 + OS prefers-reduced-motion) · 인쇄 미디어(Evidence Pack) 실측 · 모바일 터치 타겟 40px+ (qa:a11y).
모션: 진입(stagger)·페이지 전환·호버 프리미티브(tile/press/sheen/link-line/nudge). 차트 애니메이션은 D-14대로 비활성.

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
- 6차: UI/UX 고도화 — 지표 위계(주요 4 + 보조 칸, D-33) · '데모' 표시 한 곳 + 고객 화면 운영 설명 분리(LoopHint, D-34) · 휴대폰 상품 상세 구매 바·옵션 시트(D-35) · 입력 검증(핏 프로필 범위·주문서 즉시 해제·CSV 필수 열, D-36) · 찜 버튼 아이콘·탭 겹침·카드 캡션 겹침 수정(D-37)
- 7차: 2차 고도화(처음 쓰는 사람 기준 재점검) — 휴대폰 하위 화면 뒤로 버튼·장바구니/주문서 하단 고정 결제 바·`--tabbar-h`(D-38) · 토스트 2개 제한·위치 자동·시트 열림 시 공용 이동 버튼 숨김(D-39) · 평소 상태 배지 제거·고객 문구 통일(D-40) · 실행 센터 카드 자리 유지·AX 주문 카드 버튼 아래로·주문 정보 행 분리(D-41) · 주문 완료 버튼 높이 붕괴 수정
- 8차: 3차 고도화(개발자 시선) — 쿠폰 할인 100배 저장 결함 수정·금액/검증/메모 규칙 단일화·저장 데이터 v5 마이그레이션(D-42) · 라우트 서버 메타데이터·OG/manifest/robots(D-43) · 시드 생성 316→65ms·미래 시각 주문 정리(D-44) · 창 포커스 관리·본문 바로가기·오류 경계(D-45) · Vitest·Prettier·CI·보안 헤더·의존성 경고 0(D-46) · lucide 전체 import 제거(D-47)
- 5차: UI/UX 안정화 — 메뉴 1차 노출 33 → 15(AX 14→8 · 고객 19→7, 기능 삭제 0, D-27) · 한글 UI(D-28) · 타이포 하한·줄바꿈 규칙·AutoFit(D-29) · 레이아웃 결함 268 → 0(D-30) · ESLint 0(D-31) · AX 사이드바 1280px부터(D-32)
- 4차: 미래AI랩 브릿지 CTA(상담·다른 샘플·홈페이지) 양쪽 셸에 공통 배치(D-25) · 장식 반복 모션의 reduced-motion 점멸 위험 제거(D-26)
- 3차: 사이드바 4그룹 재편(D-21) · 아이콘 '같은 색 10단계 톤'으로 통일하고 테마 연동(D-22) · 모션/호버 프리미티브 도입(D-23)
- 2차 고도화: Loop 1 알림→구매 전환 자동 기록(D-17) · Evidence Pack 미리보기 인쇄·JSON(D-18) · LLM Route 서버 연결 지점(D-19) · Unit Economics 측정 설계(D-20) · 접근성/Hover 자동 점검 + 터치 타겟·사이드바 hover 버그 수정 · 여정 QA 23 Step
- 첫 빌드 완료: 35 Route · 4 Closed Loop 실동작 · 수용 여정 21/21 · 반응형 8폭 검증
- Red Team 수정: 재구매율 비현실(93%→25%, 비회원 주문 도입) · 기간 비교 창 일 단위화 · 차트 애니메이션 제거 · 품절 임박 재입고 CTA · Preview 재귀 가드 · 헤더 폭 정리
