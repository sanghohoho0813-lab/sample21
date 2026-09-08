# RECOMMENDATIONS.md — P2 이상 선택적 개선 (구현하지 않고 기록)

> Red Team / QA에서 나온 P2 아이디어는 여기에만 기록한다. 무한 확장하지 않는다.
> 판단 기준: 고객 확보 → 계약률 → 반복업무 감소 → 고객 만족 → 모듈 연결 → 확장성.

## 지금 하지 않는 이유가 분명한 것 (NEXT / READY)
| # | 항목 | 왜 지금이 아닌가 | 재검토 조건 |
|---|---|---|---|
| R-01 | 실제 사진 자산 적용 (Hero / Why AX / 카테고리 / 브랜드) | 사용자 지시: 사진은 추후. 등록 경로(`src/lib/assets.ts`)는 준비됨 | Drive 「샘플 21. 의류」 업로드 시 |
| R-02 | Supabase Auth/RLS + 실데이터 Import | API 키·비용·설정은 Hard Blocker. Adapter 구조 준비됨 | Pilot 계약 시 |
| R-03 | AI Briefing LLM 연결 (1개만) | 키 없음. 규칙 기반이 먼저 실증되어야 LLM 가치가 검증됨 | `ANTHROPIC_API_KEY` 제공 시 |
| R-04 | 브랜드 파트너센터 (로그인·상품등록·재고연동·정산) | Platform Readiness MID. 현재는 내부 운영 우선 | 입점 브랜드 20개 이상 |
| R-05 | 멤버십 / B2B 단체구매 / 광고·기획전 상품 / 스타일 콘텐츠 | 반복매출·B2B 수요 검증 전. Preview 페이지로 방향만 노출 | 재구매율·B2B 문의 데이터 확보 후 |
| R-06 | 자동발주 L4 | Error Cost MID. 12주 실증 없이 자동실행 금지 | 실증 후 저위험 베이식 한정 |

## 제품 폴리시 후보 (P2)
| # | 항목 | 기대 효과 | 비용 |
|---|---|---|---|
| P-01 | 재입고 알림 → 구매 전환 추적을 RestockSubscription.status=purchased로 자동 연결 (현재 notified까지) | Loop 1 Evidence 완결성 | 소 |
| P-02 | 캠페인 생성 Draft를 store로 승격해 Action·Evidence와 연결 | Loop 4 Evidence 강화 | 소 |
| P-03 | Demand Radar에 30일 스파크라인 추가 | 판단 속도 | 소 |
| P-04 | 주문 상태 일괄 처리(체크박스) | 운영직원 반복 클릭 감소 | 소 |
| P-05 | Evidence Pack PDF/CSV Export (READY → 실제) | 심사·보고서 재사용 | 중 |
| P-06 | 고객 화면 검색 자동완성·오타 보정 | 탐색 전환 | 중 |
| P-07 | 접근성 정밀 점검 (스크린리더 순서, 색 대비 자동 검사) | Public Web Quality | 중 |
| P-08 | Playwright 여정 테스트를 CI(GitHub Actions)에 연결 | 회귀 방지 | 소 |

## 시드 데이터 후보
- 리뷰를 seed 레이어로 이동해 Fit Engine 입력(반품 피드백)과 연결
- 브랜드별 리드타임 편차·입고 예정 일정 캘린더

## 하지 않기로 한 것
- 무신사 등 실제 플랫폼 UI·문구·랭킹 복제
- 정책자금·투자 "보장" 문구, Demo 성과의 실제 성과 표현
- 기능 개수를 늘리기 위한 AI Ready 마커 남발 (현재 3곳: 브리핑 / Demand / Fit)
