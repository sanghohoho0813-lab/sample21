# QA_REPORT.md — MORFIT First Build (DEMO)

> 빌드: `next build` 성공 (Next 15.5 · 36 Route · TypeScript 0 error). 검증 환경: 프로덕션 서버 + Playwright(Chromium).
> 2차 고도화 재측정은 §9 참조 (여정 23/23 · 반응형 · 접근성).
> 모든 숫자는 DEMO / SIMULATION. 실제 성과 아님. BASELINE: UNKNOWN / REQUIRED.

## 1. Score

### SCORE A — Strategy / Business Quality (자체 평가)
| 영역 | 배점 | 점수 | 근거 |
|---|---:|---:|---|
| Problem / Constraint | 15 | 15 | Primary Constraint 1문장 잠금, 핵심 기능 60~70%가 Constraint와 직결(Demand Radar·Action·Fit) |
| Process Redesign | 10 | 9 | ELIMINATE→…→AI 순서 표, 중복확인 제거가 화면(Action Center)으로 구현 |
| Data Foundation / Asset | 15 | 14 | SSOT(seed+store) · 옵션 단위 수요×반품×핏 데이터 · 12개월 Data Question 답변 |
| AI Fit / Explainability | 10 | 10 | 4 Engine 전부 RULE/STAT · 근거 2~4 · L2/L3 · Error Cost · AI Ready 3곳만 |
| Proof / KPI Design | 15 | 15 | Cost/Revenue/Scale KPI 3종 · Evidence 10 Type · 12주 체크리스트 · Baseline UNKNOWN 명시 · **Evidence Pack 미리보기(인쇄·JSON) + Loop 1 알림→구매 전환 기록 (2차)** |
| Customer / Partner / Platform Fit | 10 | 9 | Primary Journey 완주 · 4 Closed Loop 실동작 · NEXT 5 Preview(과장 없음) |
| Scale / Unit Economics | 10 | 9 | 사입/위탁 매출·마진 구성, 객단가·주문당 매출총이익·배송비 비중 계산 표시. CAC/LTV/Payback은 측정 설계만(VALIDATE LATER) — 값을 지어내지 않음 (2차) |
| Moat / Asset | 5 | 5 | Proprietary 옵션 데이터·MD Workflow·핏 프로필. 기술스택 Moat 미주장 |
| Adoption / Risk | 5 | 5 | 역할별 화면·직원 이익 명시·개인정보 없음 |
| Financeability / Growth Logic | 5 | 4 | 정책자금 언급은 실증 이후로 제한(보장 표현 0) |
| **합계** | **100** | **95** | Strategic P0 = 0 (2차 재평가) |

### SCORE B — Product / Implementation Quality (자체 평가)
| 영역 | 배점 | 점수 | 근거 |
|---|---:|---:|---|
| Product Shell | 15 | 15 | Nav·Settings·Tutorial·Presentation·Device Preview·Escape Path 실측 |
| Business AX | 20 | 19 | KPI→Detail→Insight→Action→Result→Evidence · Role · Freshness |
| Customer Platform | 20 | 18 | Explore→Detail→Fit→Cart→DEMO Checkout→My · 사진은 placeholder(추후) |
| Cross-Surface | 15 | 15 | 4 Loop 자동 검증 통과 · Theme 상태 공유 · Surface 왕복 |
| Visual / Interaction | 15 | 14 | Hover/Pressed·Skeleton·Empty·Error·Overlay 정리 + **접근 이름 100% · 모바일 터치 타겟 40px+ · 사이드바 hover 복구 (2차 자동 점검)**. 사진 밀도는 자산 적용 후 재평가 |
| Theme Integrity | 10 | 10 | 9 Theme 실측 전환 · 잔존 장식색 0(하드코딩 팔레트 클래스 0건) · Error Red 의미색만 |
| Story / Growth | 5 | 5 | Why AX 16 Section · Current→Improved→Growth · NEXT 분리 |
| **합계** | **100** | **96** | Product P0 = 0 (2차 재평가) |

판정: **Strategy 95 / Product 96 → 고품질 MVP(90+)** (1차 93/95 → 2차 재평가). 98+ 목표 대비 부족분은 (1) 사진 자산 미적용, (2) 실측 Baseline 부재(Pilot에서만 가능), (3) CAC/LTV 실값 없음, (4) LLM 키 없음 — 모두 Demo 단계에서 지어내지 않기로 한 항목.

## 2. Strategic P0 점검 (13항목)
| 항목 | 결과 |
|---|---|
| Primary Constraint 없음 | PASS (PROJECT_SPEC §0) |
| 핵심 기능이 Constraint와 단절 | PASS |
| Cost/Revenue/Scale KPI 없음 | PASS |
| Demo Data를 Live처럼 표현 | PASS — 전 화면 DEMO/SIMULATION 배지, Freshness `DEMO DATA` |
| Baseline 없는 개선율 | PASS — Evidence·KPI에 `BASELINE: UNKNOWN / REQUIRED`, 개선율은 SIMULATION 표기 |
| 고객행동이 Workflow와 단절 | PASS — Loop 1~4 자동 검증 |
| Rule로 충분한데 AI 포장 | PASS — 전부 RULE/STAT, "AI Ready" 3곳만 |
| AI Action 근거 없음 | PASS — 근거 2~4 + 주의 + 승인자 + 다음 행동 |
| High Risk AI 무감독 | PASS — L2/L3만, 자동발주 없음 |
| Data Provenance 불명확 | PASS — Freshness + 데이터 출처 필터 |
| NEXT를 현재 기능처럼 표현 | PASS — NEXT 배지 + Preview 페이지 + "구현되지 않음" 고지 |
| 정책자금·투자 보장 표현 | PASS — 소스 전수 검색 0건 |
| Capital Independence 실패 | PASS — YES (§3.2) |

## 3. Whole-Hybrid Acceptance Journey (자동, `scripts/qa-journey.mjs`) — **21/21 PASS**, pageerror 0
Fresh Load·Demo Reset → Home 5초 → Tutorial 종료(Overlay 0) → 랭킹 → 상세(Scenario A) → 핏 프로필 → 재입고 알림(Loop 1) → AX 전환·KPI → Role(MD) 변화 → Demand Radar 반영(18→19) → Action 확인·실행·완료(재고 +60, 알림 발송) → 고객 재입고 상태 → 장바구니·DEMO 주문(Loop 2) → AX 주문 반영·상품준비 → My Page 상태 반영 → Evidence → Why AX 발견 → 시연 모드 → 9 Theme 전환 → 글자크기·Device Preview(재귀 0·스크롤 복구) → Demo Reset.

## 4. Responsive (자동, `scripts/qa-screens.mjs`) — 8폭 × 32 Route = 256 조합
| 항목 | 결과 |
|---|---|
| 404 / notFound | 0 |
| 런타임·콘솔 오류 | 0 (CDN 폰트 차단 노이즈 제외) |
| Horizontal overflow | 1차 74건(헤더 폭·그리드 min-width·표·썸네일 폭) → 수정 후 **0건 / 256 조합** |
| Mobile 360 | 2열 상품 그리드 · 표→카드 · 필터 Sheet · Sticky CTA와 Bottom Nav 비중첩 |

## 5. Theme / Visual
- 9 Canonical Theme × Desktop/Mobile/Preview 동일 상태(localStorage) · `data-theme` 실측
- 하드코딩 팔레트 클래스(`text-red-*` 등) 0건 · 원시 Hex는 시맨틱 톤/에디토리얼 그라디언트/아이콘 Accent만
- Dark Sidebar 텍스트 White 계열 · Pure White Raised Surface · Error Red = 의미색
- 차트 애니메이션 비활성(스크린샷·인쇄 안정성)

## 6. Red Team (PASS 3, 1회) — 발견 및 조치
| # | 관점 | 발견 | 등급 | 조치 |
|---|---|---|---|---|
| 1 | Business Devil | 재구매율 93.5% (회원 361명에 주문 1,200건 배정) | P1 | 비회원 주문 42% 도입 → 24.8% |
| 2 | Business Devil | 매출이 항상 "직전 대비 하락" (현재 기간이 오늘 남은 시간만큼 짧음) | P1 | 기간 비교를 일 단위 경계로 |
| 3 | Product Devil | 반품률 ↑247% 등 무의미한 델타 | P1 | 반품률은 델타 대신 분모·분자 표기 |
| 4 | Product Devil | 차트가 스크린샷·시연 초기에 비어 보임 | P1 | 애니메이션 제거 |
| 5 | Product Devil | Device Preview iframe 내부에 하이드레이션 전 Preview 버튼 노출(재귀 가능) | P0 | 인라인 스크립트 + CSS 가드 |
| 6 | Customer | Scenario A(품절 임박)에서 재입고 알림 신청 불가 → Loop 1 시연 단절 | P1 | 품절 임박 옵션에도 재입고 CTA |
| 7 | Product Devil | Freshness가 SSR에서 초를 렌더 → 하이드레이션 불일치 | P1 | 마운트 후 렌더 |
| 8 | Product Devil | AX 상단바 768/1024px 폭 초과, 고객 헤더 768/1024px 초과 | P1 | 반응형 축약(아이콘화·xl에서 텍스트) |
| 9 | AI Devil | "AI 추천"이라 부르는 곳 없음, 규칙 기반 명시 | — | 유지 |
| 10 | Growth Devil | 파트너센터·멤버십·B2B를 현재 기능처럼 보이지 않게 | — | NEXT Preview로 분리 확인 |
| 11 | Data Devil | 개인정보(전화·이메일) 없음, 이름은 역할별 마스킹 | — | 유지 |
| P2 | — | Evidence Pack Export, 재입고→구매 추적, 캠페인 초안 store 승격 등 | P2 | docs/RECOMMENDATIONS.md |

## 7. 최종 재측정 (수정 후 프로덕션 빌드, 3회차)
- Acceptance Journey: **21/21 PASS** · pageerror 0
- Responsive: 256 조합 중 **404 0 · 오류 0 · overflow 0**
- 재현: `npm run build && npm start` 후 `node scripts/qa-journey.mjs`, `QA_SHOTS=0 npm run qa:shots`

## 8. Known Issues / 남은 것
- 사진 자산 미적용(의도) — placeholder. 적용 후 Image Sharpness Gate 재검증 필요
- 리뷰·캠페인 초안·반품 처리 상태는 localStorage(Demo)
- Pretendard CDN 차단 환경에서는 시스템 폰트 폴백

## 9. 2차 고도화 재측정 (2026-09-15 · 프로덕션 빌드)
### 9.1 범위
Loop 1 완결(알림→구매 전환 자동 기록) · Evidence Pack DEMO 미리보기(`/ax/evidence/pack` 인쇄·JSON) · Unit Economics 측정 설계 패널 · `/api/ai/explain` LLM Route(키 없으면 규칙 텍스트) · 접근성/Hover 자동 점검 스크립트 + 수정. Drive 「샘플 21. 의류」 재확인 → 여전히 비어 있어 사진은 계속 보류.

### 9.2 결과 요약
| 항목 | 결과 |
|---|---|
| typecheck / build | 0 error · `next build` 성공 · 36 Route |
| Whole-Hybrid Journey (`npm run qa:journey`) | **23/23 PASS** · pageerror 0 — 추가 Step: "Restock notified → purchased (Loop 1 complete)", "Evidence Pack preview + JSON export"(다운로드 JSON 구조·VALIDATE LATER 고정 검증) |
| 반응형 (`QA_SHOTS=0 npm run qa:shots`) | 최종: 8폭 × 33 Route = **264 조합 · 404 0 · 상태코드 비정상 0 · 런타임 오류 0 · overflow 0** (중간 재검사에서 Why AX 360px 6px 넘침 1건 발견 → flex-wrap 수정 후 0) |
| 접근성·Hover (`npm run qa:a11y`) | 최종: 66 route×폭(1280·390) · 4,987 인터랙티브 요소 — **접근 이름 누락 0 · 모바일 40px 미만 터치 타겟 0**(1차 35종 → 2차 7종 → 최종 0) · 40~43px 경고 778건(허용) · hover 무변화 16종 = 선택된 탭·칩·현재 메뉴 등 활성 상태 컨트롤과 hover-lift 카드 내부 링크(측정 한계) — 실제 hover 클래스 누락 없음 |
| 인쇄 미디어 (Evidence Pack) | `emulateMedia(print)` 실측: AX 사이드바·상단바·하단 탭·목차 숨김, 좌측 여백 0, 흰 배경, 7 Section 출력 |
| LLM Route 스모크 | `GET /api/ai/explain` → `{status:"AI_READY", configured:false}` · `POST`(키 없음) → 규칙 텍스트 그대로 + note. 외부 호출 0 |

### 9.3 2차 Red Team (자동 점검이 찾은 것)
| # | 관점 | 발견 | 등급 | 조치 |
|---|---|---|---|---|
| 1 | Product Devil | AX 사이드바 hover·active 배경이 렌더되지 않음 — Tailwind 불투명도 `bg-white/8`, `/12`는 스케일 밖이라 클래스 미생성 | P1 | `bg-white/[0.08]`, `/[0.12]`로 교체 (ThemeSettings 포함) |
| 2 | Customer Devil | 모바일(390px)에서 40px 미만 터치 타겟 35종(Button sm 38px · Segmented sm 34px · EntityChip 28px · 역할 전환 34px · 데모 바 28px · 용어 도움말 14px · 텍스트 링크 20~25px 등) | P1 | 모바일 전용 높이 상향(`h-10 md:h-*`) · 인라인 링크 `.tap`(히트 영역 확장, 레이아웃 불변) · 도움말 아이콘 40×40 히트박스 |
| 3 | Product Devil | 접근 가능한 이름 없는 버튼 — 더보기(하단 탭) | P2 | `aria-label` 추가 → 누락 0 |
| 4 | Product Devil | Why AX 360px에서 6px 가로 넘침 (Evidence 예시 행 배지 비줄바꿈) | P2 | `flex-wrap` |
| 5 | QA | 여정 QA 체크아웃 동의 체크박스가 클릭 직후 등록되지 않는 타이밍 플레이크 | P2(테스트) | `name="agree"` 지정 + 체크 확인 후 재시도 루프 |
| 6 | Hover | 활성 상태 컨트롤(선택된 탭·칩·현재 메뉴)은 hover 변화 없음 | — | 의도된 상태 표시로 유지. 썸네일 링크에는 `hover:opacity-90` 추가 |

### 9.4 남은 것 (2차 이후)
- 사진 자산: Drive 폴더 업로드 대기 (등록 경로 `src/lib/assets.ts`)
- LLM: `ANTHROPIC_API_KEY` 서버 설정만 하면 경영 브리핑 1곳 LIVE — 키 없이 검증 불가한 부분은 "생성 문장의 숫자 일치 확인"
- 접근성 후속: 스크린리더 읽기 순서 · 색 대비 자동 검사 (RECOMMENDATIONS P-07)

