/* ------------------------------------------------------------------
   MORFIT Demo Repository — single centralized seed (SSOT for DEMO).
   All numbers are deterministic (seeded PRNG) and internally consistent:
   orders → variant sales → daily series → KPI. Scenario A–D are tuned here.
   NOTHING here is real company data. Everything is labelled DEMO.
------------------------------------------------------------------- */
import type {
  Brand, Category, Product, Variant, Customer, Order, OrderItem, ReturnRequest,
  Campaign, AXAction, EvidenceLog, DailyPoint, ProductDaily, CategoryId, Gender,
  Fit, SizingTendency, SegmentId, ReturnReason, OrderStatus,
} from "../types";
import { mulberry32, hashStr, pick, randInt } from "./rng";
import { daysAgoKey, isoDaysAgo, todayKey } from "../dates";

export const TODAY = todayKey();
export const DEMO_CUSTOMER_ID = "c-me";
export const DEMO_CUSTOMER_NAME = "김하늘";

/* ----------------------------- Brands ----------------------------- */
export const BRANDS: Brand[] = [
  { id: "b-aerno", slug: "aerno", name: "AERNO", tagline: "구조적인 미니멀리즘", description: "절제된 실루엣과 고밀도 소재로 완성하는 컨템포러리 베이식. 오래 입어도 형태가 무너지지 않는 옷을 만듭니다.", sourcing: "purchase", commissionRate: 0, leadTimeDays: 7, manager: "박지원 MD", contractStatus: "active", joinedAt: isoDaysAgo(420), gradient: ["#1f2937", "#6b7280"], followers: 12840 },
  { id: "b-nove", slug: "nove-studio", name: "NOVE STUDIO", tagline: "편안한 오버핏의 기준", description: "셔츠와 팬츠를 중심으로 여유 있는 실루엣을 연구합니다. 옥스포드·코듀로이 등 촉감이 좋은 원단을 고집합니다.", sourcing: "consignment", commissionRate: 0.28, leadTimeDays: 6, manager: "박지원 MD", contractStatus: "active", joinedAt: isoDaysAgo(300), gradient: ["#0f172a", "#334155"], followers: 9820 },
  { id: "b-still", slug: "still-form", name: "STILL FORM", tagline: "겨울을 위한 조용한 형태", description: "울·캐시미어 혼방 아우터와 니트로 유명한 FW 중심 브랜드. 시즌성이 강해 재고 회전 관리가 핵심입니다.", sourcing: "purchase", commissionRate: 0, leadTimeDays: 14, manager: "이도윤 MD", contractStatus: "active", joinedAt: isoDaysAgo(380), gradient: ["#3f3f46", "#a1a1aa"], followers: 7430 },
  { id: "b-current", slug: "current-type", name: "CURRENT TYPE", tagline: "스트리트의 현재형", description: "그래픽 후디, 트랙 팬츠, 러너 스니커즈. 10~20대 남성 고객 비중이 높고 신상품 반응속도가 빠릅니다.", sourcing: "consignment", commissionRate: 0.25, leadTimeDays: 5, manager: "최서준 MD", contractStatus: "renewal", joinedAt: isoDaysAgo(250), gradient: ["#111827", "#2563eb"], followers: 15320 },
  { id: "b-plane", slug: "plane-archive", name: "PLANE ARCHIVE", tagline: "데님의 원형을 기록하다", description: "생지·워싱 데님 전문. 핏이 브랜드마다 다르기 때문에 사이즈 안내가 반품률을 크게 좌우합니다.", sourcing: "consignment", commissionRate: 0.27, leadTimeDays: 10, manager: "이도윤 MD", contractStatus: "active", joinedAt: isoDaysAgo(330), gradient: ["#1e3a8a", "#60a5fa"], followers: 8610 },
  { id: "b-mellow", slug: "mellow-code", name: "MELLOW CODE", tagline: "부드러운 여성복의 언어", description: "니트 원피스, 슬립 스커트, 발레 플랫. 20~30대 여성 고객의 재구매율이 가장 높은 브랜드입니다.", sourcing: "consignment", commissionRate: 0.3, leadTimeDays: 8, manager: "최서준 MD", contractStatus: "active", joinedAt: isoDaysAgo(280), gradient: ["#9f1239", "#fda4af"], followers: 11270 },
  { id: "b-object", slug: "object-nine", name: "OBJECT NINE", tagline: "신발과 소품의 완성", description: "더비·첼시부츠·레더 스니커즈와 벨트·머플러. 사이즈(mm) 단위 재고관리가 중요합니다.", sourcing: "purchase", commissionRate: 0, leadTimeDays: 12, manager: "박지원 MD", contractStatus: "active", joinedAt: isoDaysAgo(360), gradient: ["#292524", "#a8a29e"], followers: 6120 },
  { id: "b-field", slug: "field-note", name: "FIELD NOTE", tagline: "도시와 야외 사이", description: "3레이어 쉘 자켓, 카고 팬츠, 플리스. 기능성 소재와 유틸리티 디테일이 특징입니다.", sourcing: "consignment", commissionRate: 0.26, leadTimeDays: 9, manager: "최서준 MD", contractStatus: "active", joinedAt: isoDaysAgo(210), gradient: ["#14532d", "#86efac"], followers: 5480 },
  { id: "b-halfmoon", slug: "half-moon", name: "HALF MOON", tagline: "단정한 여성 컨템포러리", description: "트위드 자켓, 실크 블라우스, 롱 트렌치. 30~40대 직장인 여성이 주 고객입니다.", sourcing: "purchase", commissionRate: 0, leadTimeDays: 11, manager: "이도윤 MD", contractStatus: "new", joinedAt: isoDaysAgo(40), gradient: ["#4c1d95", "#c4b5fd"], followers: 2210 },
  { id: "b-unit", slug: "unit-zero", name: "UNIT ZERO", tagline: "매일의 기본", description: "수피마 코튼 티셔츠, 헤비 후디, 스웻 팬츠. 회전이 빠르고 마진이 안정적인 베이식 라인입니다.", sourcing: "purchase", commissionRate: 0, leadTimeDays: 5, manager: "박지원 MD", contractStatus: "active", joinedAt: isoDaysAgo(400), gradient: ["#0c4a6e", "#7dd3fc"], followers: 9930 },
];

export const CATEGORIES: Category[] = [
  { id: "outer", name: "아우터", gradient: ["#334155", "#94a3b8"] },
  { id: "top", name: "상의", gradient: ["#1e293b", "#cbd5e1"] },
  { id: "bottom", name: "하의", gradient: ["#1e3a8a", "#93c5fd"] },
  { id: "dress", name: "원피스·스커트", gradient: ["#831843", "#f9a8d4"] },
  { id: "shoes", name: "신발", gradient: ["#292524", "#d6d3d1"] },
  { id: "bag", name: "가방", gradient: ["#3f3f46", "#e4e4e7"] },
  { id: "acc", name: "액세서리", gradient: ["#365314", "#bef264"] },
];
export const CATEGORY_NAME: Record<CategoryId, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name])) as Record<CategoryId, string>;

/* ----------------------------- Products ----------------------------- */
const APPAREL_SIZES = ["S", "M", "L", "XL"];
const SHOE_SIZES = ["240", "250", "260", "270", "280"];
const WOMEN_SHOE_SIZES = ["225", "235", "245", "250"];
const FREE = ["FREE"];

const COLOR_HEX: Record<string, [string, string]> = {
  블랙: ["#1f1f1f", "#4a4a4a"], 화이트: ["#f5f5f4", "#d6d3d1"], 아이보리: ["#efe9dc", "#d6ccb5"], 네이비: ["#1e2a4a", "#3b4a73"],
  차콜: ["#3a3d44", "#6b6f78"], 베이지: ["#d9c8a9", "#b9a47f"], 카키: ["#5b6b4a", "#8a9a72"], 브라운: ["#5a3f2b", "#8b6a4f"],
  그레이: ["#8c8f96", "#b8bbc2"], 인디고: ["#283563", "#4b5a96"], 라이트블루: ["#a9c4e6", "#7fa5d1"], 버건디: ["#5d1f2e", "#8c3a4d"],
  크림: ["#f3ecd9", "#e3d6b6"], 워시드블루: ["#6f8fb8", "#a4bbd8"], 올리브: ["#4f5b3a", "#7f8b62"],
};
export const colorHex = (c: string) => COLOR_HEX[c] ?? ["#cfcbc2", "#e9e7e1"];

interface PDef {
  id: string; brand: string; cat: CategoryId; gender: Gender; name: string; subtitle: string; price: number; sale?: number; costRate: number;
  fit: Fit; sizing: SizingTendency; colors: string[]; sizes?: string[]; material: string; care?: string; desc: string; fitNote: string;
  tags?: string[]; newDays?: number; season?: "SS" | "FW" | "ALL"; seasonEnd?: number; pop: number; // popularity 0.2~1.6
}

const P: PDef[] = [
  // AERNO
  { id: "p-aerno-coat", brand: "b-aerno", cat: "outer", gender: "unisex", name: "릴랙스 울 싱글 코트", subtitle: "메리노 울 80% · 드롭 숄더", price: 329000, costRate: 0.42, fit: "relaxed", sizing: "true", colors: ["차콜", "베이지"], material: "울 80%, 나일론 20%", desc: "어깨선을 살짝 떨어뜨린 드롭 숄더 코트. 안감에 큐프라를 사용해 니트 위에도 부드럽게 착용됩니다.", fitNote: "정사이즈로 나왔습니다. 두꺼운 니트를 자주 입으면 한 치수 크게 선택해도 좋습니다.", season: "FW", seasonEnd: 120, pop: 0.9, tags: ["코트", "울"] },
  { id: "p-aerno-blazer", brand: "b-aerno", cat: "outer", gender: "men", name: "스트럭처 블레이저", subtitle: "노치드 라펠 · 2버튼", price: 259000, costRate: 0.45, fit: "regular", sizing: "true", colors: ["네이비", "블랙"], material: "울 60%, 폴리 40%", desc: "어깨 패드를 최소화해 데일리로 입기 좋은 블레이저. 슬랙스·데님 어디에나 어울립니다.", fitNote: "정사이즈입니다. 어깨가 넓은 편이면 한 치수 크게 권장합니다.", season: "ALL", seasonEnd: 240, pop: 0.7 },
  { id: "p-aerno-sweat", brand: "b-aerno", cat: "top", gender: "unisex", name: "헤비 코튼 크루넥 스웻셔츠", subtitle: "480g 프렌치테리", price: 89000, sale: 79000, costRate: 0.38, fit: "relaxed", sizing: "large", colors: ["그레이", "블랙", "아이보리"], material: "코튼 100%", desc: "두툼한 프렌치테리 원단으로 형태감이 살아 있는 스웻셔츠. 세탁 후에도 목 늘어짐이 적습니다.", fitNote: "크게 나왔습니다. 평소보다 한 치수 작게 선택하는 고객이 많습니다.", season: "ALL", seasonEnd: 240, pop: 1.2, tags: ["베스트"] },
  { id: "p-aerno-slacks", brand: "b-aerno", cat: "bottom", gender: "men", name: "와이드 테이퍼드 슬랙스", subtitle: "원턱 · 밴딩 없음", price: 129000, costRate: 0.4, fit: "relaxed", sizing: "true", colors: ["차콜", "베이지"], material: "울 50%, 폴리 48%, 스판 2%", desc: "허벅지는 넉넉하고 밑단으로 갈수록 좁아지는 테이퍼드 실루엣.", fitNote: "정사이즈입니다. 허리 기준으로 선택하세요.", season: "ALL", seasonEnd: 240, pop: 0.9 },
  { id: "p-aerno-tote", brand: "b-aerno", cat: "bag", gender: "unisex", name: "미니멀 레더 토트", subtitle: "베지터블 태닝 소가죽", price: 189000, costRate: 0.4, fit: "regular", sizing: "true", colors: ["블랙", "브라운"], sizes: FREE, material: "소가죽 100%", desc: "A4가 세로로 들어가는 크기. 별도 로고 없이 가죽 질감만으로 완성했습니다.", fitNote: "단일 사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.6 },
  // NOVE STUDIO — Scenario A: 오버핏 옥스포드 셔츠 / 블랙 / M
  { id: "p-nove-oxford", brand: "b-nove", cat: "top", gender: "unisex", name: "오버핏 옥스포드 셔츠", subtitle: "13oz 옥스포드 · 드롭 숄더", price: 79000, costRate: 0.36, fit: "oversized", sizing: "large", colors: ["블랙", "화이트", "라이트블루"], material: "코튼 100%", desc: "두께감 있는 옥스포드 원단으로 만든 오버핏 셔츠. 단독으로도, 니트 위 레이어드로도 활용도가 높습니다.", fitNote: "오버핏으로 크게 나왔습니다. 평소 사이즈 그대로 선택하면 넉넉한 실루엣, 한 치수 작게 선택하면 세미 오버핏입니다.", season: "ALL", seasonEnd: 240, pop: 1.6, tags: ["베스트", "급상승"] },
  { id: "p-nove-stripe", brand: "b-nove", cat: "top", gender: "unisex", name: "스트라이프 릴랙스 셔츠", subtitle: "코튼 포플린", price: 72000, costRate: 0.36, fit: "relaxed", sizing: "true", colors: ["라이트블루", "네이비"], material: "코튼 100%", desc: "가는 스트라이프 포플린 셔츠. 여름부터 초가을까지 시원하게 입을 수 있습니다.", fitNote: "정사이즈입니다.", season: "SS", seasonEnd: 30, pop: 0.6 },
  { id: "p-nove-cord", brand: "b-nove", cat: "outer", gender: "unisex", name: "코듀로이 워크 자켓", subtitle: "8웨일 코듀로이 · 4포켓", price: 168000, costRate: 0.38, fit: "relaxed", sizing: "true", colors: ["브라운", "올리브"], material: "코튼 100%", desc: "워크웨어 실루엣의 코듀로이 자켓. 봄·가을 아우터로 가장 많이 찾는 제품입니다.", fitNote: "정사이즈입니다. 안에 후디를 입으려면 한 치수 크게 권장합니다.", season: "FW", seasonEnd: 150, pop: 1.0, newDays: 12 },
  { id: "p-nove-balloon", brand: "b-nove", cat: "bottom", gender: "unisex", name: "벌룬 팬츠", subtitle: "코튼 트윌 · 밴딩 허리", price: 98000, costRate: 0.37, fit: "oversized", sizing: "large", colors: ["블랙", "베이지"], material: "코튼 98%, 스판 2%", desc: "허벅지에 볼륨을 주고 밑단을 조인 벌룬 실루엣. 허리는 밴딩+끈 조절입니다.", fitNote: "크게 나왔습니다. 밴딩 허리라 한 치수 작게 선택해도 편합니다.", season: "ALL", seasonEnd: 240, pop: 0.8 },
  { id: "p-nove-cross", brand: "b-nove", cat: "bag", gender: "unisex", name: "캔버스 크로스백", subtitle: "12oz 캔버스 · 조절 스트랩", price: 58000, costRate: 0.35, fit: "regular", sizing: "true", colors: ["아이보리", "블랙"], sizes: FREE, material: "코튼 캔버스 100%", desc: "가볍게 메는 크로스백. 안쪽에 지퍼 포켓이 있습니다.", fitNote: "단일 사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.5 },
  // STILL FORM — Scenario C: 울 블렌드 발마칸 코트 (저회전)
  { id: "p-still-balmacaan", brand: "b-still", cat: "outer", gender: "unisex", name: "울 블렌드 발마칸 코트", subtitle: "래글런 슬리브 · 히든 버튼", price: 398000, sale: 358000, costRate: 0.44, fit: "oversized", sizing: "large", colors: ["차콜", "카키"], material: "울 70%, 폴리 30%", desc: "클래식한 발마칸 실루엣의 롱 코트. 무릎 아래 기장으로 겨울 내내 활용도가 높습니다.", fitNote: "여유 있게 크게 나왔습니다. 평소 사이즈 그대로 선택하면 넉넉하게 떨어집니다.", season: "FW", seasonEnd: 75, pop: 0.95, tags: ["시즌오프"] },
  { id: "p-still-vest", brand: "b-still", cat: "outer", gender: "unisex", name: "경량 패딩 베스트", subtitle: "덕다운 90/10", price: 149000, costRate: 0.4, fit: "regular", sizing: "true", colors: ["블랙", "베이지"], material: "나일론 100%, 충전재 덕다운", desc: "니트 위에 겹쳐 입기 좋은 얇은 패딩 베스트.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.8, newDays: 20 },
  { id: "p-still-polo", brand: "b-still", cat: "top", gender: "men", name: "리브 니트 폴로", subtitle: "메리노 울 100%", price: 118000, costRate: 0.4, fit: "slim", sizing: "small", colors: ["네이비", "크림"], material: "울 100%", desc: "몸에 붙는 리브 조직의 니트 폴로. 단정한 룩에 잘 어울립니다.", fitNote: "슬림핏으로 작게 나왔습니다. 여유 있게 입으려면 한 치수 크게 권장합니다.", season: "FW", seasonEnd: 120, pop: 0.6 },
  { id: "p-still-pleats", brand: "b-still", cat: "dress", gender: "women", name: "플리츠 미디 스커트", subtitle: "울 혼방 · 밴딩", price: 128000, costRate: 0.4, fit: "regular", sizing: "true", colors: ["차콜", "베이지"], material: "울 40%, 폴리 60%", desc: "잔주름 플리츠가 걸을 때 흐르는 미디 스커트.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.7 },
  { id: "p-still-sherpa", brand: "b-still", cat: "outer", gender: "unisex", name: "셰르파 플리스 자켓", subtitle: "보아 플리스 · 하이넥", price: 139000, costRate: 0.38, fit: "relaxed", sizing: "true", colors: ["아이보리", "브라운"], material: "폴리 100%", desc: "포근한 보아 플리스 자켓. 가을·초겨울 데일리 아우터.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.9, newDays: 6 },
  // CURRENT TYPE
  { id: "p-current-hoodie", brand: "b-current", cat: "top", gender: "men", name: "아카이브 그래픽 후디", subtitle: "400g 기모 · 백프린트", price: 89000, costRate: 0.34, fit: "oversized", sizing: "large", colors: ["블랙", "그레이"], material: "코튼 80%, 폴리 20%", desc: "브랜드 아카이브 그래픽을 넣은 오버핏 후디.", fitNote: "크게 나왔습니다. 평소 사이즈 그대로 선택하면 오버핏입니다.", season: "ALL", seasonEnd: 240, pop: 1.3, tags: ["베스트"] },
  { id: "p-current-track", brand: "b-current", cat: "bottom", gender: "men", name: "나일론 트랙 팬츠", subtitle: "사이드 라인 · 밴딩", price: 79000, costRate: 0.34, fit: "relaxed", sizing: "true", colors: ["블랙", "네이비"], material: "나일론 100%", desc: "가볍고 바스락거리는 나일론 트랙 팬츠.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.9 },
  { id: "p-current-runner", brand: "b-current", cat: "shoes", gender: "unisex", name: "에어 메쉬 러너", subtitle: "경량 메쉬 · EVA 미드솔", price: 129000, sale: 109000, costRate: 0.4, fit: "regular", sizing: "small", colors: ["화이트", "블랙"], sizes: SHOE_SIZES, material: "메쉬, 합성피혁", desc: "가벼운 러너 스니커즈. 발볼이 좁게 나와 반 치수 크게 권장합니다.", fitNote: "작게 나왔습니다. 발볼이 넓다면 5mm 크게 선택하세요.", season: "ALL", seasonEnd: 240, pop: 1.1 },
  { id: "p-current-cap", brand: "b-current", cat: "acc", gender: "unisex", name: "워싱 볼캡", subtitle: "코튼 트윌 · 자수 로고", price: 39000, costRate: 0.3, fit: "regular", sizing: "true", colors: ["블랙", "베이지"], sizes: FREE, material: "코튼 100%", desc: "빈티지 워싱 처리한 볼캡.", fitNote: "단일 사이즈, 뒷면 스트랩으로 조절합니다.", season: "ALL", seasonEnd: 240, pop: 0.7 },
  { id: "p-current-coach", brand: "b-current", cat: "outer", gender: "men", name: "코치 자켓", subtitle: "나일론 · 스냅 버튼", price: 119000, costRate: 0.36, fit: "relaxed", sizing: "true", colors: ["블랙", "카키"], material: "나일론 100%", desc: "간절기 가볍게 걸치는 코치 자켓.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 200, pop: 0.7, newDays: 25 },
  // PLANE ARCHIVE — Scenario B: 와이드 스트레이트 데님 (사이즈 작음 반품)
  { id: "p-plane-wide", brand: "b-plane", cat: "bottom", gender: "unisex", name: "와이드 스트레이트 데님", subtitle: "13.5oz 셀비지 · 논워시", price: 138000, costRate: 0.38, fit: "relaxed", sizing: "small", colors: ["인디고", "워시드블루"], material: "코튼 100%", desc: "허벅지부터 밑단까지 일자로 떨어지는 와이드 데님. 논워시 원단이라 첫 세탁 후 약간 줄어듭니다.", fitNote: "허리가 타이트하게 나왔습니다. 평소 사이즈보다 한 치수 크게 선택을 권장합니다.", season: "ALL", seasonEnd: 240, pop: 1.2, tags: ["베스트"] },
  { id: "p-plane-semi", brand: "b-plane", cat: "bottom", gender: "unisex", name: "세미 와이드 데님", subtitle: "12oz 워싱", price: 118000, costRate: 0.38, fit: "regular", sizing: "true", colors: ["워시드블루", "블랙"], material: "코튼 99%, 스판 1%", desc: "스판이 약간 들어가 편안한 세미 와이드 데님.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.9 },
  { id: "p-plane-trucker", brand: "b-plane", cat: "outer", gender: "unisex", name: "데님 트러커 자켓", subtitle: "14oz · 셀비지", price: 178000, costRate: 0.4, fit: "regular", sizing: "true", colors: ["인디고", "블랙"], material: "코튼 100%", desc: "클래식 트러커 자켓. 오래 입을수록 색이 빠지며 멋이 납니다.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 200, pop: 0.8 },
  { id: "p-plane-miniskirt", brand: "b-plane", cat: "dress", gender: "women", name: "데님 미니 스커트", subtitle: "A라인 · 하이웨이스트", price: 88000, costRate: 0.36, fit: "slim", sizing: "small", colors: ["워시드블루", "인디고"], material: "코튼 100%", desc: "하이웨이스트 A라인 데님 스커트.", fitNote: "허리가 작게 나왔습니다. 한 치수 크게 권장합니다.", season: "SS", seasonEnd: 30, pop: 0.5 },
  { id: "p-plane-workshirt", brand: "b-plane", cat: "top", gender: "unisex", name: "워크웨어 샴브레이 셔츠", subtitle: "6oz 샴브레이", price: 92000, costRate: 0.36, fit: "relaxed", sizing: "true", colors: ["라이트블루", "인디고"], material: "코튼 100%", desc: "가벼운 샴브레이 소재의 워크 셔츠.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.6 },
  // MELLOW CODE
  { id: "p-mellow-knitdress", brand: "b-mellow", cat: "dress", gender: "women", name: "리브 니트 롱 원피스", subtitle: "슬림 실루엣 · 사이드 슬릿", price: 128000, costRate: 0.36, fit: "slim", sizing: "true", colors: ["크림", "블랙", "브라운"], material: "비스코스 60%, 나일론 40%", desc: "몸의 선을 부드럽게 따라가는 니트 원피스.", fitNote: "정사이즈입니다. 신축성이 좋습니다.", season: "FW", seasonEnd: 120, pop: 1.1, tags: ["베스트"] },
  { id: "p-mellow-cardigan", brand: "b-mellow", cat: "top", gender: "women", name: "크롭 울 가디건", subtitle: "메리노 울 · 진주 버튼", price: 98000, sale: 88000, costRate: 0.36, fit: "slim", sizing: "true", colors: ["아이보리", "버건디"], material: "울 70%, 나일론 30%", desc: "허리선에서 끝나는 크롭 가디건.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.9, newDays: 9 },
  { id: "p-mellow-slip", brand: "b-mellow", cat: "dress", gender: "women", name: "새틴 슬립 스커트", subtitle: "바이어스 컷 · 밴딩", price: 79000, costRate: 0.34, fit: "regular", sizing: "true", colors: ["블랙", "크림"], material: "폴리 100%", desc: "은은한 광택의 새틴 스커트.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.7 },
  { id: "p-mellow-flat", brand: "b-mellow", cat: "shoes", gender: "women", name: "레더 발레 플랫", subtitle: "소가죽 · 리본 스트랩", price: 119000, costRate: 0.4, fit: "regular", sizing: "true", colors: ["블랙", "크림"], sizes: WOMEN_SHOE_SIZES, material: "소가죽 100%", desc: "부드러운 소가죽 발레 플랫.", fitNote: "정사이즈입니다. 발볼이 넓으면 5mm 크게 권장합니다.", season: "ALL", seasonEnd: 240, pop: 0.8 },
  { id: "p-mellow-shoulder", brand: "b-mellow", cat: "bag", gender: "women", name: "미니 숄더백", subtitle: "램스킨 · 골드 체인", price: 168000, costRate: 0.38, fit: "regular", sizing: "true", colors: ["블랙", "크림"], sizes: FREE, material: "양가죽 100%", desc: "체인 스트랩 미니 숄더백.", fitNote: "단일 사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.6 },
  // OBJECT NINE
  { id: "p-object-derby", brand: "b-object", cat: "shoes", gender: "men", name: "플레인 토 더비", subtitle: "굿이어 웰트 · 소가죽", price: 258000, costRate: 0.45, fit: "regular", sizing: "true", colors: ["블랙", "브라운"], sizes: SHOE_SIZES, material: "소가죽 100%, 레더 솔", desc: "굿이어 웰트 제법의 플레인 토 더비. 길들일수록 발에 맞습니다.", fitNote: "정사이즈입니다. 발볼이 넓으면 5mm 크게 권장합니다.", season: "ALL", seasonEnd: 240, pop: 0.6 },
  { id: "p-object-chelsea", brand: "b-object", cat: "shoes", gender: "unisex", name: "첼시 부츠", subtitle: "스웨이드 · 사이드 고어", price: 238000, costRate: 0.45, fit: "regular", sizing: "true", colors: ["브라운", "블랙"], sizes: SHOE_SIZES, material: "스웨이드 100%", desc: "스웨이드 첼시 부츠. FW 시즌 신발 랭킹 상위.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.9, newDays: 15 },
  { id: "p-object-sneaker", brand: "b-object", cat: "shoes", gender: "unisex", name: "로우탑 레더 스니커즈", subtitle: "풀그레인 소가죽", price: 179000, costRate: 0.42, fit: "regular", sizing: "large", colors: ["화이트", "블랙"], sizes: SHOE_SIZES, material: "소가죽 100%", desc: "깔끔한 로우탑 레더 스니커즈.", fitNote: "크게 나왔습니다. 5mm 작게 선택을 권장합니다.", season: "ALL", seasonEnd: 240, pop: 1.0 },
  { id: "p-object-belt", brand: "b-object", cat: "acc", gender: "unisex", name: "스퀘어 버클 벨트", subtitle: "소가죽 · 3cm", price: 69000, costRate: 0.35, fit: "regular", sizing: "true", colors: ["블랙", "브라운"], sizes: FREE, material: "소가죽 100%", desc: "심플한 스퀘어 버클 벨트.", fitNote: "단일 사이즈, 구멍 5개 조절.", season: "ALL", seasonEnd: 240, pop: 0.5 },
  { id: "p-object-muffler", brand: "b-object", cat: "acc", gender: "unisex", name: "울 머플러", subtitle: "램스울 100%", price: 59000, costRate: 0.33, fit: "regular", sizing: "true", colors: ["차콜", "베이지", "버건디"], sizes: FREE, material: "울 100%", desc: "부드러운 램스울 머플러.", fitNote: "단일 사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.8, newDays: 4 },
  // FIELD NOTE
  { id: "p-field-shell", brand: "b-field", cat: "outer", gender: "unisex", name: "3레이어 쉘 자켓", subtitle: "방수 20,000mm · 심실링", price: 298000, costRate: 0.42, fit: "regular", sizing: "true", colors: ["블랙", "올리브"], material: "나일론 100%", desc: "비와 바람을 막는 3레이어 쉘 자켓.", fitNote: "정사이즈입니다. 안에 플리스를 입으려면 한 치수 크게 권장합니다.", season: "ALL", seasonEnd: 200, pop: 0.7 },
  { id: "p-field-cargo", brand: "b-field", cat: "bottom", gender: "men", name: "립스탑 카고 팬츠", subtitle: "6포켓 · 밑단 조절", price: 109000, costRate: 0.36, fit: "relaxed", sizing: "true", colors: ["카키", "블랙"], material: "코튼 65%, 나일론 35%", desc: "튼튼한 립스탑 원단의 카고 팬츠.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.9 },
  { id: "p-field-fleece", brand: "b-field", cat: "outer", gender: "unisex", name: "폴라 플리스 집업", subtitle: "300g 플리스", price: 98000, costRate: 0.34, fit: "relaxed", sizing: "true", colors: ["올리브", "그레이"], material: "폴리 100%", desc: "따뜻한 폴라 플리스 집업.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 1.0, newDays: 8 },
  { id: "p-field-vest", brand: "b-field", cat: "outer", gender: "unisex", name: "유틸리티 베스트", subtitle: "멀티 포켓", price: 89000, costRate: 0.34, fit: "relaxed", sizing: "true", colors: ["카키", "블랙"], material: "코튼 100%", desc: "포켓이 많은 유틸리티 베스트.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 200, pop: 0.4 },
  { id: "p-field-messenger", brand: "b-field", cat: "bag", gender: "unisex", name: "메신저백", subtitle: "코듀라 · 버클", price: 89000, costRate: 0.34, fit: "regular", sizing: "true", colors: ["블랙", "올리브"], sizes: FREE, material: "코듀라 나일론", desc: "13인치 노트북이 들어가는 메신저백.", fitNote: "단일 사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.5 },
  // HALF MOON
  { id: "p-half-tweed", brand: "b-halfmoon", cat: "outer", gender: "women", name: "트위드 크롭 자켓", subtitle: "울 혼방 트위드", price: 219000, costRate: 0.42, fit: "regular", sizing: "true", colors: ["아이보리", "블랙"], material: "울 45%, 아크릴 30%, 폴리 25%", desc: "단정한 트위드 자켓.", fitNote: "정사이즈입니다.", season: "FW", seasonEnd: 120, pop: 0.7, newDays: 18 },
  { id: "p-half-pants", brand: "b-halfmoon", cat: "bottom", gender: "women", name: "하이웨이스트 와이드 팬츠", subtitle: "투턱 · 벨트 루프", price: 118000, costRate: 0.38, fit: "relaxed", sizing: "true", colors: ["블랙", "베이지"], material: "폴리 70%, 레이온 28%, 스판 2%", desc: "다리가 길어 보이는 하이웨이스트 팬츠.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.8 },
  { id: "p-half-blouse", brand: "b-halfmoon", cat: "top", gender: "women", name: "실크 블라우스", subtitle: "실크 100% · 셔츠 칼라", price: 158000, costRate: 0.4, fit: "regular", sizing: "true", colors: ["크림", "네이비"], material: "실크 100%", desc: "은은한 광택의 실크 블라우스.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 0.5 },
  { id: "p-half-trench", brand: "b-halfmoon", cat: "outer", gender: "women", name: "롱 트렌치 코트", subtitle: "더블 브레스트 · 벨트", price: 289000, costRate: 0.42, fit: "regular", sizing: "true", colors: ["베이지", "블랙"], material: "코튼 100%", desc: "클래식 더블 트렌치 코트.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 200, pop: 0.8, newDays: 2 },
  // UNIT ZERO
  { id: "p-unit-tee", brand: "b-unit", cat: "top", gender: "unisex", name: "수피마 코튼 티셔츠", subtitle: "20수 · 2팩", price: 39000, costRate: 0.3, fit: "regular", sizing: "true", colors: ["화이트", "블랙", "그레이"], material: "코튼 100%", desc: "부드러운 수피마 코튼 티셔츠 2팩.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 1.4, tags: ["베스트"] },
  { id: "p-unit-hoodie", brand: "b-unit", cat: "top", gender: "unisex", name: "헤비웨이트 후디", subtitle: "500g 기모", price: 69000, costRate: 0.32, fit: "relaxed", sizing: "true", colors: ["블랙", "그레이", "네이비"], material: "코튼 100%", desc: "두툼한 기모 후디.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 1.2 },
  { id: "p-unit-sweatpants", brand: "b-unit", cat: "bottom", gender: "unisex", name: "스웻 팬츠", subtitle: "500g 기모 · 밴딩", price: 59000, costRate: 0.32, fit: "relaxed", sizing: "true", colors: ["블랙", "그레이"], material: "코튼 100%", desc: "후디와 세트로 입는 스웻 팬츠.", fitNote: "정사이즈입니다.", season: "ALL", seasonEnd: 240, pop: 1.0 },
  { id: "p-unit-socks", brand: "b-unit", cat: "acc", gender: "unisex", name: "립 삭스 3팩", subtitle: "코튼 혼방", price: 15000, costRate: 0.3, fit: "regular", sizing: "true", colors: ["화이트", "블랙"], sizes: FREE, material: "코튼 80%, 폴리 18%, 스판 2%", desc: "매일 신는 립 삭스 3팩.", fitNote: "단일 사이즈(240~280).", season: "ALL", seasonEnd: 240, pop: 0.9 },
];

function measurementsFor(cat: CategoryId, sizes: string[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  sizes.forEach((s, i) => {
    if (cat === "top" || cat === "outer") out[s] = { 총장: 68 + i * 2, 어깨: 48 + i * 2, 가슴: 56 + i * 3, 소매: 60 + i * 1.5 };
    else if (cat === "bottom") out[s] = { 총장: 100 + i * 2, 허리: 38 + i * 2.5, 엉덩이: 52 + i * 2.5, 허벅지: 31 + i * 1.5, 밑단: 22 + i * 1 };
    else if (cat === "dress") out[s] = { 총장: 84 + i * 2, 허리: 33 + i * 2.5, 엉덩이: 46 + i * 2.5 };
    else if (cat === "shoes") out[s] = { 발길이: Number(s) / 10, 발볼: 9.2 + i * 0.3 };
    else out[s] = {};
  });
  return out;
}

export const PRODUCTS: Product[] = P.map((d) => {
  const sizes = d.sizes ?? APPAREL_SIZES;
  const r = mulberry32(hashStr(d.id));
  return {
    id: d.id, brandId: d.brand, categoryId: d.cat, gender: d.gender, name: d.name, subtitle: d.subtitle,
    price: d.price, salePrice: d.sale ?? null, cost: Math.round(d.price * d.costRate / 1000) * 1000,
    fit: d.fit, sizing: d.sizing, colors: d.colors, sizes, material: d.material, care: d.care ?? "찬물 단독 세탁, 건조기 사용 금지",
    description: d.desc, fitNote: d.fitNote,
    model: { height: d.gender === "women" ? 168 : 182, weight: d.gender === "women" ? 52 : 70, size: d.cat === "shoes" ? sizes[Math.floor(sizes.length / 2)] : "M" },
    measurements: measurementsFor(d.cat, sizes), tags: d.tags ?? [],
    createdAt: isoDaysAgo(d.newDays ?? randInt(r, 45, 320)), season: d.season ?? "ALL", seasonEndsInDays: d.seasonEnd ?? 240,
    gradient: colorHex(d.colors[0]), rating: Math.round((4.2 + r() * 0.7) * 10) / 10, reviewCount: randInt(r, 12, 480),
  };
});
const POP: Record<string, number> = Object.fromEntries(P.map((d) => [d.id, d.pop]));
export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
export const BRAND_BY_ID: Record<string, Brand> = Object.fromEntries(BRANDS.map((b) => [b.id, b]));

/* ----------------------------- Variants ----------------------------- */
export const variantId = (productId: string, colorIdx: number, size: string) => `${productId}-c${colorIdx}-${size}`;

const SIZE_WEIGHT: Record<string, number> = { XS: 0.5, S: 0.8, M: 1.4, L: 1.2, XL: 0.6, FREE: 1, "225": 0.5, "235": 1, "245": 1, "250": 0.9, "240": 0.6, "260": 1.1, "270": 1.3, "280": 0.8 };

/** Scenario anchors */
export const SCENARIO = {
  A_VARIANT: variantId("p-nove-oxford", 0, "M"), // 오버핏 옥스포드 셔츠 / 블랙 / M
  A_PRODUCT: "p-nove-oxford",
  B_PRODUCT: "p-plane-wide", // 와이드 스트레이트 데님 — 사이즈 작음 반품
  C_PRODUCT: "p-still-balmacaan", // 발마칸 코트 — 저회전
  D_BRAND: "b-aerno", // 재구매 주기 도래
  D_SEGMENT: "cycle-due" as SegmentId,
};

interface VariantBase { id: string; productId: string; color: string; colorIdx: number; size: string; weight: number; }
const VARIANT_BASES: VariantBase[] = [];
for (const p of PRODUCTS) {
  p.colors.forEach((color, ci) => {
    const colorW = color === "블랙" ? 1.3 : color === "화이트" || color === "아이보리" ? 1.0 : 0.8;
    for (const size of p.sizes) {
      VARIANT_BASES.push({ id: variantId(p.id, ci, size), productId: p.id, color, colorIdx: ci, size, weight: Math.pow(POP[p.id], 2.2) * colorW * (SIZE_WEIGHT[size] ?? 1) });
    }
  });
}

/* Day-dependent weight to shape Scenario A (급상승) and C (저회전). dayOffset = days ago (0 = today). */
function dayWeight(vb: VariantBase, dayOffset: number) {
  let w = vb.weight;
  if (vb.id === SCENARIO.A_VARIANT) w *= dayOffset <= 7 ? 2.2 : dayOffset <= 14 ? 1.6 : 1.1;
  else if (vb.productId === SCENARIO.A_PRODUCT) w *= dayOffset <= 7 ? 1.7 : 1.0;
  if (vb.productId === SCENARIO.C_PRODUCT) w *= dayOffset <= 21 ? 0.12 : dayOffset <= 45 ? 0.9 : 1.5;
  if (vb.productId === SCENARIO.B_PRODUCT) w *= 1.4;
  // FW products ramp up recently, SS fade
  const p = PRODUCT_BY_ID[vb.productId];
  if (p.season === "FW") w *= dayOffset <= 30 ? 1.25 : 0.85;
  if (p.season === "SS") w *= dayOffset <= 30 ? 0.55 : 1.1;
  // new products only sell after createdAt
  const ageDays = Math.round((Date.now() - new Date(p.createdAt).getTime()) / 86400000);
  if (dayOffset > ageDays) w = 0;
  return w;
}

/* ----------------------------- Customers ----------------------------- */
const FAMILY = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "류", "홍"];
const GIVEN = ["서연", "지우", "하준", "도윤", "민준", "예린", "수아", "시우", "지민", "유진", "현우", "지호", "채원", "다은", "준서", "소율", "은우", "지안", "태윤", "나은", "서준", "하린", "주원", "연우", "가은", "민서", "우진", "예은", "시윤", "다인"];
const SEGMENTS: SegmentId[] = ["first-purchase", "wish-no-buy", "restock-waiting", "cycle-due", "brand-loyal", "post-return-drop", "vip"];
export const SEGMENT_LABEL: Record<SegmentId, string> = {
  "first-purchase": "첫 구매 전환후보", "wish-no-buy": "찜 다수·미구매", "restock-waiting": "재입고 대기", "cycle-due": "구매주기 도래",
  "brand-loyal": "브랜드 충성고객", "post-return-drop": "반품 후 재구매 감소", vip: "고가치 반복구매",
};

const custRand = mulberry32(20260908);
export const CUSTOMERS: Customer[] = [];
{
  const N = 360;
  for (let i = 0; i < N; i++) {
    const r = custRand;
    const name = `${pick(r, FAMILY)}${pick(r, GIVEN)}`;
    const gender: Gender = r() < 0.52 ? "women" : "men";
    const joined = randInt(r, 5, 400);
    const orderCount = r() < 0.18 ? 0 : randInt(r, 1, 9);
    const avgOrder = randInt(r, 60, 220) * 1000;
    const totalSpend = orderCount * avgOrder;
    const lastPurchase = orderCount === 0 ? null : isoDaysAgo(randInt(r, 1, Math.min(joined, 120)));
    const avgCycle = orderCount >= 2 ? randInt(r, 28, 75) : null;
    const fav = r() < 0.75 ? pick(r, BRANDS).id : null;
    const seg: SegmentId = orderCount === 0 ? (r() < 0.6 ? "first-purchase" : "wish-no-buy") : orderCount >= 6 && totalSpend > 900000 ? "vip" : pick(r, SEGMENTS.filter((s) => s !== "first-purchase"));
    const returnCount = orderCount === 0 ? 0 : r() < 0.7 ? 0 : randInt(r, 1, 3);
    CUSTOMERS.push({
      id: `c-${String(i + 1).padStart(4, "0")}`, name, gender, age: randInt(r, 19, 46), joinedAt: isoDaysAgo(joined), lastPurchaseAt: lastPurchase,
      orderCount, totalSpend, avgCycleDays: avgCycle, favoriteBrandId: fav, favoriteCategory: pick(r, CATEGORIES).id,
      wishlistCount: randInt(r, 0, 12), cartCount: randInt(r, 0, 3), restockWaiting: r() < 0.15 ? randInt(r, 1, 3) : 0,
      hasFitProfile: r() < 0.46, returnCount, ltv: Math.round(totalSpend * (1 + (avgCycle ? 90 / avgCycle : 0.3)) / 1000) * 1000,
      segment: seg,
    });
  }
  // Scenario D: AERNO buyers whose cycle is due
  let dCount = 0;
  for (const c of CUSTOMERS) {
    if (dCount >= 42) break;
    if (c.orderCount >= 2) { c.favoriteBrandId = SCENARIO.D_BRAND; c.segment = "cycle-due"; c.avgCycleDays = 45; c.lastPurchaseAt = isoDaysAgo(randInt(custRand, 40, 52)); dCount++; }
  }
  // Demo customer (the "logged in" shopper)
  CUSTOMERS.unshift({
    id: DEMO_CUSTOMER_ID, name: DEMO_CUSTOMER_NAME, gender: "women", age: 29, joinedAt: isoDaysAgo(210), lastPurchaseAt: isoDaysAgo(44),
    orderCount: 3, totalSpend: 386000, avgCycleDays: 45, favoriteBrandId: "b-aerno", favoriteCategory: "top", wishlistCount: 2, cartCount: 0,
    restockWaiting: 0, hasFitProfile: false, returnCount: 0, ltv: 980000, segment: "cycle-due",
  });
}
export const CUSTOMER_BY_ID: Record<string, Customer> = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]));

/* ----------------------------- Orders (90d) ----------------------------- */
const ADDRESSES = ["서울 마포구 성산로", "서울 성동구 왕십리로", "경기 성남시 분당구 판교역로", "부산 해운대구 센텀중앙로", "대구 수성구 동대구로", "서울 강남구 테헤란로", "인천 연수구 송도과학로", "서울 송파구 올림픽로"];
const orderRand = mulberry32(777);
export const SEED_ORDERS: Order[] = [];
{
  const totalWeightByDay: number[] = [];
  for (let d = 0; d < 90; d++) totalWeightByDay.push(VARIANT_BASES.reduce((s, v) => s + dayWeight(v, d), 0));
  let seq = 1;
  const nonDemoCustomers = CUSTOMERS.filter((c) => c.id !== DEMO_CUSTOMER_ID && c.orderCount > 0);
  const A_BASE = VARIANT_BASES.find((v) => v.id === SCENARIO.A_VARIANT)!;
  const C_BASES = VARIANT_BASES.filter((v) => v.productId === SCENARIO.C_PRODUCT);
  for (let d = 89; d >= 0; d--) {
    const dow = new Date(Date.now() - d * 86400000).getDay();
    const base = 11 + (dow === 0 || dow === 6 ? 5 : 0) + (d < 14 ? 3 : 0);
    const nOrders = base + randInt(orderRand, -2, 4);
    // Scenario injections (deterministic): A = 급상승 최근 7일, C = 과거에는 팔리다 최근 멈춤
    const forced: VariantBase[] = [];
    if (d < 7) forced.push(A_BASE, A_BASE);
    else if (d < 14) forced.push(A_BASE);
    if (d >= 22 && d % 2 === 0) forced.push(C_BASES[d % C_BASES.length]);
    for (let k = 0; k < nOrders; k++) {
      const nItems = orderRand() < 0.55 ? 1 : orderRand() < 0.8 ? 2 : 3;
      const items: OrderItem[] = [];
      for (let it = 0; it < nItems; it++) {
        let target = orderRand() * totalWeightByDay[d];
        let chosen = VARIANT_BASES[0];
        if (forced.length && it === 0 && k < forced.length) chosen = forced[k];
        else for (const v of VARIANT_BASES) { target -= dayWeight(v, d); if (target <= 0) { chosen = v; break; } }
        const p = PRODUCT_BY_ID[chosen.productId];
        const unit = p.salePrice ?? p.price;
        items.push({ variantId: chosen.id, productId: p.id, qty: orderRand() < 0.9 ? 1 : 2, unitPrice: unit, discount: p.salePrice ? p.price - p.salePrice : 0 });
      }
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const couponDiscount = orderRand() < 0.22 ? Math.round(subtotal * 0.05 / 1000) * 1000 : 0;
      const shippingFee = subtotal >= 50000 ? 0 : 3000;
      const total = subtotal - couponDiscount + shippingFee;
      const cust = pick(orderRand, nonDemoCustomers);
      const hour = randInt(orderRand, 8, 23);
      const createdAt = isoDaysAgo(d, hour, randInt(orderRand, 0, 59));
      let status: OrderStatus = "delivered";
      if (d === 0) status = orderRand() < 0.6 ? "preparing" : "pending";
      else if (d === 1) status = orderRand() < 0.5 ? "shipped" : "preparing";
      else if (d <= 3) status = orderRand() < 0.6 ? "in-transit" : "shipped";
      else if (orderRand() < 0.03) status = "cancelled";
      const id = `MF${String(new Date(createdAt).getMonth() + 1).padStart(2, "0")}${String(new Date(createdAt).getDate()).padStart(2, "0")}-${String(seq++).padStart(4, "0")}`;
      SEED_ORDERS.push({
        id, customerId: cust.id, customerName: cust.name, createdAt, status, items, subtotal, discount: couponDiscount + items.reduce((s, i) => s + i.discount * i.qty, 0),
        shippingFee, total, channel: orderRand() < 0.68 ? "mobile" : "web", address: pick(orderRand, ADDRESSES), source: "DEMO",
        statusHistory: [{ status: "pending", at: createdAt, actor: "고객" }, ...(status !== "pending" ? [{ status, at: isoDaysAgo(Math.max(0, d - 1), 14), actor: "운영팀" }] : [])],
      });
    }
  }
  // Demo customer past orders (for My Page history) — AERNO purchases, last 44 days ago
  const mine: [number, string, string][] = [[44, variantId("p-aerno-sweat", 0, "S"), "delivered"], [96, variantId("p-aerno-slacks", 0, "S"), "delivered"], [150, variantId("p-unit-tee", 0, "S"), "delivered"]];
  mine.forEach(([d, vid, st], i) => {
    const p = PRODUCT_BY_ID[vid.split("-c")[0]];
    const unit = p.salePrice ?? p.price;
    const createdAt = isoDaysAgo(d, 20, 12);
    SEED_ORDERS.push({ id: `MF-ME-${String(i + 1).padStart(3, "0")}`, customerId: DEMO_CUSTOMER_ID, customerName: DEMO_CUSTOMER_NAME, createdAt, status: st as OrderStatus, items: [{ variantId: vid, productId: p.id, qty: 1, unitPrice: unit, discount: p.salePrice ? p.price - p.salePrice : 0 }], subtotal: unit, discount: p.salePrice ? p.price - p.salePrice : 0, shippingFee: 0, total: unit, channel: "mobile", address: "서울 마포구 성산로 12", source: "DEMO", statusHistory: [{ status: "pending", at: createdAt, actor: "고객" }, { status: "delivered", at: isoDaysAgo(d - 3, 15), actor: "운영팀" }] });
  });
}

/* ----------------------------- Derived variant stats ----------------------------- */
const salesByVariant = new Map<string, { d7: number; p7: number; d30: number }>();
for (const o of SEED_ORDERS) {
  if (o.status === "cancelled") continue;
  const age = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 86400000);
  for (const it of o.items) {
    const s = salesByVariant.get(it.variantId) ?? { d7: 0, p7: 0, d30: 0 };
    if (age < 7) s.d7 += it.qty; else if (age < 14) s.p7 += it.qty;
    if (age < 30) s.d30 += it.qty;
    salesByVariant.set(it.variantId, s);
  }
}

const vRand = mulberry32(4242);
export const VARIANTS: Variant[] = VARIANT_BASES.map((vb) => {
  const s = salesByVariant.get(vb.id) ?? { d7: 0, p7: 0, d30: 0 };
  const p = PRODUCT_BY_ID[vb.productId];
  const daily = Math.max(0.05, s.d30 / 30);
  let stock = Math.round(daily * randInt(vRand, 12, 40)) + randInt(vRand, 0, 6);
  const views7d = Math.round(s.d7 * randInt(vRand, 14, 26) + randInt(vRand, 5, 40));
  let wishlist7d = Math.round(views7d * (0.06 + vRand() * 0.05));
  let wishlistPrev7d = Math.round(wishlist7d * (0.7 + vRand() * 0.6));
  let cart7d = Math.round(views7d * (0.03 + vRand() * 0.03));
  let restockRequests = 0;
  let incoming = 0;
  let returns30d = Math.round(s.d30 * (0.03 + vRand() * 0.05));
  let fitReturns30d = Math.round(returns30d * (0.3 + vRand() * 0.3));
  if (vb.id === SCENARIO.A_VARIANT) { stock = 4; wishlist7d = 41; wishlistPrev7d = 14; cart7d = 23; restockRequests = 18; }
  else if (vb.productId === SCENARIO.A_PRODUCT) { stock = Math.max(stock, 9); wishlistPrev7d = Math.round(wishlist7d * 0.7); restockRequests = vb.size === "L" && vb.colorIdx === 0 ? 6 : 0; if (vb.size === "L" && vb.colorIdx === 0) stock = 7; }
  if (vb.productId === SCENARIO.C_PRODUCT) { stock = randInt(vRand, 8, 14); wishlist7d = randInt(vRand, 0, 2); wishlistPrev7d = randInt(vRand, 1, 3); cart7d = randInt(vRand, 0, 1); }
  if (vb.productId === SCENARIO.B_PRODUCT) { returns30d = Math.round(s.d30 * 0.22 + (vb.size === "M" || vb.size === "L" ? 0.6 : 0)); fitReturns30d = vb.size === "S" || vb.size === "XL" ? Math.max(0, returns30d - 1) : returns30d; }
  if (p.season === "SS") stock = Math.round(stock * 1.6) + 6;
  // a few sold-out / low variants for realism
  if (vRand() < 0.05 && vb.id !== SCENARIO.A_VARIANT) stock = 0;
  if (vRand() < 0.06) incoming = randInt(vRand, 10, 40);
  return { id: vb.id, productId: vb.productId, color: vb.color, size: vb.size, stock, incoming, sales7d: s.d7, salesPrev7d: s.p7, sales30d: s.d30, views7d, wishlist7d, wishlistPrev7d, cart7d, restockRequests, returns30d, fitReturns30d };
});
export const VARIANT_BY_ID: Record<string, Variant> = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));
export const variantsOf = (productId: string) => VARIANTS.filter((v) => v.productId === productId);

/* ----------------------------- Daily series ----------------------------- */
export const DAILY: DailyPoint[] = [];
{
  const map = new Map<string, DailyPoint>();
  for (let d = 89; d >= 0; d--) map.set(daysAgoKey(d), { date: daysAgoKey(d), revenue: 0, orders: 0, units: 0, views: 0, wishlist: 0, discount: 0, returns: 0 });
  for (const o of SEED_ORDERS) {
    if (o.status === "cancelled") continue;
    const k = o.createdAt.slice(0, 10);
    const dp = map.get(k); if (!dp) continue;
    dp.revenue += o.total; dp.orders += 1; dp.units += o.items.reduce((s, i) => s + i.qty, 0); dp.discount += o.discount;
  }
  const r = mulberry32(99);
  for (const dp of map.values()) { dp.views = Math.round(dp.orders * (52 + r() * 18)); dp.wishlist = Math.round(dp.views * (0.07 + r() * 0.03)); dp.returns = Math.round(dp.units * (0.05 + r() * 0.04)); DAILY.push(dp); }
}

export const PRODUCT_DAILY: ProductDaily[] = PRODUCTS.map((p) => {
  const r = mulberry32(hashStr(p.id + "d"));
  const series: ProductDaily["series"] = [];
  for (let d = 29; d >= 0; d--) {
    const k = daysAgoKey(d);
    let units = 0;
    for (const o of SEED_ORDERS) { if (o.status === "cancelled" || !o.createdAt.startsWith(k)) continue; for (const it of o.items) if (it.productId === p.id) units += it.qty; }
    let views = Math.round(units * (16 + r() * 10) + POP[p.id] * (8 + r() * 10));
    let wishlist = Math.round(views * (0.06 + r() * 0.04));
    if (p.id === SCENARIO.A_PRODUCT && d <= 7) { views = Math.round(views * (1.6 + (7 - d) * 0.12)); wishlist = Math.round(wishlist * 2.1); }
    if (p.id === SCENARIO.C_PRODUCT) { views = Math.round(views * (d <= 21 ? 0.45 : 1)); }
    series.push({ date: k, units, views, wishlist });
  }
  return { productId: p.id, series };
});
export const PRODUCT_DAILY_BY_ID: Record<string, ProductDaily> = Object.fromEntries(PRODUCT_DAILY.map((p) => [p.productId, p]));

/* ----------------------------- Returns ----------------------------- */
const REASONS: ReturnReason[] = ["size-small", "size-large", "fit", "color", "material", "delivery", "change-of-mind", "other"];
export const RETURN_REASON_LABEL: Record<ReturnReason, string> = { "size-small": "사이즈 작음", "size-large": "사이즈 큼", fit: "핏 불만족", color: "색상 차이", material: "소재·품질 기대 차이", delivery: "배송 문제", "change-of-mind": "단순 변심", other: "기타" };
export const RETURNS: ReturnRequest[] = [];
{
  const r = mulberry32(31);
  let n = 1;
  const delivered = SEED_ORDERS.filter((o) => o.status === "delivered" && o.customerId !== DEMO_CUSTOMER_ID);
  for (const o of delivered) {
    for (const it of o.items) {
      const isB = it.productId === SCENARIO.B_PRODUCT;
      const chance = isB ? 0.2 : 0.055;
      if (r() > chance) continue;
      const p = PRODUCT_BY_ID[it.productId];
      let reason: ReturnReason;
      if (isB) reason = r() < 0.8 ? "size-small" : pick(r, REASONS);
      else if (p.sizing === "small") reason = r() < 0.5 ? "size-small" : pick(r, REASONS);
      else if (p.sizing === "large") reason = r() < 0.45 ? "size-large" : pick(r, REASONS);
      else reason = pick(r, REASONS);
      const age = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 86400000);
      RETURNS.push({ id: `RT-${String(n++).padStart(4, "0")}`, orderId: o.id, customerId: o.customerId, productId: it.productId, variantId: it.variantId, reason, createdAt: isoDaysAgo(Math.max(0, age - randInt(r, 2, 6)), 11), status: age < 5 ? "requested" : r() < 0.85 ? "completed" : "approved" });
    }
  }
}

/* ----------------------------- Campaigns ----------------------------- */
export const CAMPAIGNS: Campaign[] = [
  { id: "cp-01", name: "FW 아우터 얼리버드", type: "sale", startAt: isoDaysAgo(21), endAt: isoDaysAgo(7), status: "ended", productIds: ["p-aerno-coat", "p-still-balmacaan", "p-still-sherpa", "p-field-fleece", "p-half-trench"], segment: "all", discountRate: 0.1, impressions: 48200, clicks: 3110, carts: 412, orders: 168, revenue: 41200000, discountCost: 4580000, estMargin: 17600000, returns: 9, beforeRevenue: 33500000 },
  { id: "cp-02", name: "NOVE STUDIO 브랜드위크", type: "brand", startAt: isoDaysAgo(10), endAt: isoDaysAgo(-4), status: "running", productIds: ["p-nove-oxford", "p-nove-cord", "p-nove-balloon", "p-nove-stripe"], segment: "all", discountRate: 0.05, impressions: 31500, clicks: 2890, carts: 380, orders: 152, revenue: 13800000, discountCost: 690000, estMargin: 6100000, returns: 4, beforeRevenue: 9200000 },
  { id: "cp-03", name: "찜 상품 5% 리마인드", type: "segment", startAt: isoDaysAgo(6), endAt: isoDaysAgo(-1), status: "running", productIds: [], segment: "wish-no-buy", discountRate: 0.05, impressions: 4200, clicks: 780, carts: 143, orders: 61, revenue: 5900000, discountCost: 295000, estMargin: 2700000, returns: 2, beforeRevenue: 2100000 },
  { id: "cp-04", name: "데님 시즌 세일", type: "sale", startAt: isoDaysAgo(35), endAt: isoDaysAgo(24), status: "ended", productIds: ["p-plane-wide", "p-plane-semi", "p-plane-trucker"], segment: "all", discountRate: 0.15, impressions: 27600, clicks: 2040, carts: 311, orders: 133, revenue: 16100000, discountCost: 2840000, estMargin: 5100000, returns: 21, beforeRevenue: 12800000 },
  { id: "cp-05", name: "재입고 알림 고객 우선구매", type: "restock", startAt: isoDaysAgo(3), endAt: isoDaysAgo(-2), status: "running", productIds: ["p-nove-oxford", "p-current-hoodie"], segment: "restock-waiting", discountRate: 0, impressions: 640, clicks: 312, carts: 97, orders: 58, revenue: 4900000, discountCost: 0, estMargin: 2900000, returns: 1, beforeRevenue: 0 },
  { id: "cp-06", name: "AERNO 재구매 감사 쿠폰", type: "segment", startAt: isoDaysAgo(-1), endAt: isoDaysAgo(-10), status: "scheduled", productIds: ["p-aerno-coat", "p-aerno-sweat", "p-aerno-slacks"], segment: "cycle-due", discountRate: 0.07, impressions: 0, clicks: 0, carts: 0, orders: 0, revenue: 0, discountCost: 0, estMargin: 0, returns: 0, beforeRevenue: 0 },
  { id: "cp-07", name: "신규 입점 HALF MOON 런칭", type: "new", startAt: isoDaysAgo(18), endAt: isoDaysAgo(4), status: "ended", productIds: ["p-half-tweed", "p-half-pants", "p-half-blouse", "p-half-trench"], segment: "all", discountRate: 0.08, impressions: 19800, clicks: 1420, carts: 190, orders: 74, revenue: 11900000, discountCost: 1030000, estMargin: 5200000, returns: 5, beforeRevenue: 0 },
  { id: "cp-08", name: "SS 시즌오프 최종", type: "sale", startAt: isoDaysAgo(50), endAt: isoDaysAgo(38), status: "ended", productIds: ["p-nove-stripe", "p-plane-miniskirt"], segment: "all", discountRate: 0.3, impressions: 15400, clicks: 980, carts: 140, orders: 66, revenue: 3800000, discountCost: 1620000, estMargin: 620000, returns: 6, beforeRevenue: 2900000 },
];

/* ----------------------------- Rankings helper (static part) ----------------------------- */
export function productSalesStats(productId: string) {
  const vs = variantsOf(productId);
  return vs.reduce((acc, v) => ({ sales7d: acc.sales7d + v.sales7d, salesPrev7d: acc.salesPrev7d + v.salesPrev7d, sales30d: acc.sales30d + v.sales30d, stock: acc.stock + v.stock, views7d: acc.views7d + v.views7d, wishlist7d: acc.wishlist7d + v.wishlist7d, wishlistPrev7d: acc.wishlistPrev7d + v.wishlistPrev7d, cart7d: acc.cart7d + v.cart7d, restockRequests: acc.restockRequests + v.restockRequests, returns30d: acc.returns30d + v.returns30d, fitReturns30d: acc.fitReturns30d + v.fitReturns30d, incoming: acc.incoming + v.incoming }), { sales7d: 0, salesPrev7d: 0, sales30d: 0, stock: 0, views7d: 0, wishlist7d: 0, wishlistPrev7d: 0, cart7d: 0, restockRequests: 0, returns30d: 0, fitReturns30d: 0, incoming: 0 });
}

/* ----------------------------- Seed Actions ----------------------------- */
const C_S = productSalesStats(SCENARIO.C_PRODUCT);
const B_S = productSalesStats(SCENARIO.B_PRODUCT);
const C_DOS = C_S.stock <= 0 ? 0 : Math.round(C_S.stock / Math.max(0.1, C_S.sales30d / 30));
const C_VEL = Math.round(((C_S.sales7d - Math.max(1, C_S.salesPrev7d)) / Math.max(1, C_S.salesPrev7d)) * 100);
const B_RET = B_S.sales30d > 0 ? Math.round((B_S.returns30d / B_S.sales30d) * 100) : 0;
const B_FIT = B_S.returns30d > 0 ? Math.round((B_S.fitReturns30d / B_S.returns30d) * 100) : 0;

const A_V = VARIANT_BY_ID[SCENARIO.A_VARIANT];
export const SEED_ACTIONS: AXAction[] = [
  { id: "act-001", type: "restock", engine: "demand", automation: "L3", errorCost: "MID", title: "오버핏 옥스포드 셔츠 · 블랙 · M 재입고 검토", productId: SCENARIO.A_PRODUCT, variantId: SCENARIO.A_VARIANT, brandId: "b-nove", trigger: "관심 급상승 + 현재고 4개 + 재입고 알림 18건", reasons: [`최근 7일 판매 ${A_V.sales7d}개 (직전 7일 ${A_V.salesPrev7d}개, +${Math.round(((A_V.sales7d - Math.max(1, A_V.salesPrev7d)) / Math.max(1, A_V.salesPrev7d)) * 100)}%)`, "현재고 4개 · 예상 소진 2일 이내", `찜 ${A_V.wishlist7d}건 (직전 ${A_V.wishlistPrev7d}건)`, "재입고 알림 신청 18건 · 공급 리드타임 6일"], expectedImpact: "품절 매출손실 방지 · 재입고 알림 고객 18명 즉시 전환 기회", caution: "브랜드위크 종료 후 판매속도 둔화 가능성 확인", urgency: "high", owner: "md", ownerName: "박지원 MD", recommendedAt: isoDaysAgo(0, 8, 30), status: "recommended", statusHistory: [{ status: "recommended", at: isoDaysAgo(0, 8, 30), actor: "Demand Engine" }], quantity: 60 },
  { id: "act-002", type: "rebalance", engine: "demand", automation: "L3", errorCost: "MID", title: "옥스포드 셔츠 · 블랙 L → M 물량 재배분 검토", productId: SCENARIO.A_PRODUCT, variantId: variantId("p-nove-oxford", 0, "L"), brandId: "b-nove", trigger: "M 품절 임박, L 재고 여유", reasons: ["블랙 M 현재고 4개 vs 블랙 L 현재고 7개", "M 사이즈 재입고 신청 18건 · L 6건", "브랜드 창고 XL 재고 12개 보유"], expectedImpact: "재입고 전 단기 품절 완화", urgency: "mid", owner: "md", ownerName: "박지원 MD", recommendedAt: isoDaysAgo(0, 8, 32), status: "recommended", statusHistory: [{ status: "recommended", at: isoDaysAgo(0, 8, 32), actor: "Demand Engine" }] },
  { id: "act-003", type: "markdown", engine: "markdown", automation: "L3", errorCost: "MID", title: `울 블렌드 발마칸 코트 할인 검토 (재고 ${C_DOS}일분)`, productId: SCENARIO.C_PRODUCT, brandId: "b-still", trigger: `재고일수 ${C_DOS}일 · 시즌 종료까지 75일 · 판매속도 ${C_VEL}%`, reasons: [`옵션 합산 재고 ${C_S.stock}개 · 최근 30일 판매 ${C_S.sales30d}개`, `최근 7일 판매 ${C_S.sales7d}개 (직전 7일 ${C_S.salesPrev7d}개, ${C_VEL}%)`, "현재 할인율 10% · 원가율 44% → 추가 10%p 여유", `찜 증가 거의 없음 (주간 ${C_S.wishlist7d}건)`], expectedImpact: "시즌 내 소진율 60% → 85% 목표 · 마진 방어", caution: "20% 이상 할인 시 브랜드 정책 확인 필요", urgency: "mid", owner: "md", ownerName: "이도윤 MD", recommendedAt: isoDaysAgo(1, 9, 0), status: "confirmed", statusHistory: [{ status: "recommended", at: isoDaysAgo(1, 9, 0), actor: "Markdown Engine" }, { status: "confirmed", at: isoDaysAgo(1, 11, 20), actor: "이도윤 MD" }], discountRate: 0.2 },
  { id: "act-004", type: "fit-guide", engine: "fit", automation: "L3", errorCost: "MID", title: "와이드 스트레이트 데님 '허리 작게 나옴' 안내 강화", productId: SCENARIO.B_PRODUCT, brandId: "b-plane", trigger: `사이즈 관련 반품 비율 ${B_FIT}%`, reasons: [`최근 30일 반품 ${B_S.returns30d}건 중 사이즈 관련 ${B_S.fitReturns30d}건 (${B_FIT}%)`, `상품 반품률 ${B_RET}% (카테고리 평균 6%)`, "구매 사이즈 M·L에서 반품 집중", "핏 추천 신뢰도 낮음 (실측 대비 -1 사이즈 편차)"], expectedImpact: "사이즈 반품 -40% 목표 · 핏 추천 규칙 +1 사이즈 보정", urgency: "high", owner: "md", ownerName: "이도윤 MD", recommendedAt: isoDaysAgo(2, 10, 0), status: "in-progress", statusHistory: [{ status: "recommended", at: isoDaysAgo(2, 10, 0), actor: "Fit Engine" }, { status: "confirmed", at: isoDaysAgo(2, 15, 0), actor: "이도윤 MD" }, { status: "in-progress", at: isoDaysAgo(1, 9, 30), actor: "이도윤 MD" }] },
  { id: "act-005", type: "segment-campaign", engine: "repeat", automation: "L2", errorCost: "LOW", title: "AERNO 구매주기 도래 고객 42명 재구매 캠페인", brandId: SCENARIO.D_BRAND, segment: "cycle-due", trigger: "평균 구매주기 45일 도래 고객 42명", reasons: ["AERNO 2회 이상 구매 고객 중 42명이 40~52일 경과", "해당 세그먼트 과거 재구매 전환율 18%", "신상품(코듀로이·셰르파) 조회 증가와 겹침"], expectedImpact: "예상 재구매 7~9건 · 객단가 12만원 기준 약 90만원", urgency: "mid", owner: "md", ownerName: "박지원 MD", recommendedAt: isoDaysAgo(1, 8, 0), status: "recommended", statusHistory: [{ status: "recommended", at: isoDaysAgo(1, 8, 0), actor: "Repeat Engine" }] },
  { id: "act-006", type: "cart-reminder", engine: "repeat", automation: "L2", errorCost: "LOW", title: "장바구니 이탈 고객 63명 리마인드 검토", segment: "wish-no-buy", trigger: "장바구니 담은 뒤 48시간 미구매", reasons: ["48시간 이상 장바구니 유지 고객 63명", "이 중 41명은 찜도 함께 보유", "지난 리마인드 캠페인 전환율 9%"], expectedImpact: "예상 전환 5~6건", urgency: "low", owner: "ops", ownerName: "운영팀", recommendedAt: isoDaysAgo(0, 7, 50), status: "recommended", statusHistory: [{ status: "recommended", at: isoDaysAgo(0, 7, 50), actor: "Repeat Engine" }] },
  { id: "act-007", type: "restock", engine: "demand", automation: "L3", errorCost: "MID", title: "아카이브 그래픽 후디 · 블랙 · L 재입고", productId: "p-current-hoodie", variantId: variantId("p-current-hoodie", 0, "L"), brandId: "b-current", trigger: "품절 임박 · 판매속도 상승", reasons: ["현재고 6개 · 예상 소진 4일", "재입고 알림 신청 9건", "공급 리드타임 5일"], expectedImpact: "품절 손실 방지", urgency: "high", owner: "md", ownerName: "최서준 MD", recommendedAt: isoDaysAgo(3, 9, 0), status: "done", statusHistory: [{ status: "recommended", at: isoDaysAgo(3, 9, 0), actor: "Demand Engine" }, { status: "confirmed", at: isoDaysAgo(3, 10, 0), actor: "최서준 MD" }, { status: "in-progress", at: isoDaysAgo(2, 9, 0), actor: "최서준 MD" }, { status: "done", at: isoDaysAgo(0, 9, 10), actor: "최서준 MD", note: "40개 입고 완료 · 알림 발송" }], resultNote: "40개 입고 · 재입고 알림 9명 중 4명 구매", quantity: 40 },
  { id: "act-008", type: "markdown", engine: "markdown", automation: "L3", errorCost: "MID", title: "스트라이프 릴랙스 셔츠 시즌오프 할인", productId: "p-nove-stripe", brandId: "b-nove", trigger: "SS 시즌 종료 30일 전 · 재고 60일분", reasons: ["시즌 종료까지 30일", "재고일수 60일", "찜·조회 감소 추세"], expectedImpact: "시즌 내 소진", urgency: "low", owner: "md", ownerName: "박지원 MD", recommendedAt: isoDaysAgo(5, 9, 0), status: "hold", statusHistory: [{ status: "recommended", at: isoDaysAgo(5, 9, 0), actor: "Markdown Engine" }, { status: "hold", at: isoDaysAgo(4, 9, 0), actor: "박지원 MD", note: "브랜드위크 종료 후 재검토" }], discountRate: 0.25 },
  { id: "act-009", type: "fit-guide", engine: "fit", automation: "L3", errorCost: "MID", title: "에어 메쉬 러너 '발볼 좁음' 안내 · 5mm 업 추천", productId: "p-current-runner", brandId: "b-current", trigger: "사이즈 작음 반품 52%", reasons: ["반품 사유 중 '사이즈 작음' 52%", "리뷰 키워드 '발볼' 언급 증가"], expectedImpact: "사이즈 반품 감소", urgency: "mid", owner: "md", ownerName: "최서준 MD", recommendedAt: isoDaysAgo(6, 9, 0), status: "done", statusHistory: [{ status: "recommended", at: isoDaysAgo(6, 9, 0), actor: "Fit Engine" }, { status: "done", at: isoDaysAgo(3, 16, 0), actor: "최서준 MD", note: "상세 핏 안내 수정 완료" }], resultNote: "안내 변경 후 결과 비교 대기 (실증 준비)" },
  { id: "act-010", type: "restock", engine: "demand", automation: "L3", errorCost: "MID", title: "수피마 코튼 티셔츠 · 화이트 · M 재입고", productId: "p-unit-tee", variantId: variantId("p-unit-tee", 0, "M"), brandId: "b-unit", trigger: "정기 회전 재고 부족", reasons: ["예상 소진 5일", "재입고 리드타임 5일"], expectedImpact: "베이식 품절 방지", urgency: "mid", owner: "md", ownerName: "박지원 MD", recommendedAt: isoDaysAgo(2, 9, 0), status: "in-progress", statusHistory: [{ status: "recommended", at: isoDaysAgo(2, 9, 0), actor: "Demand Engine" }, { status: "in-progress", at: isoDaysAgo(1, 10, 0), actor: "박지원 MD" }], quantity: 120 },
  { id: "act-011", type: "segment-campaign", engine: "repeat", automation: "L2", errorCost: "LOW", title: "반품 후 재구매 감소 고객 케어 메시지", segment: "post-return-drop", trigger: "반품 경험 후 60일 미구매", reasons: ["반품 경험 고객 중 60일 미구매 27명", "이탈 위험 세그먼트"], expectedImpact: "이탈 방지", urgency: "low", owner: "ops", ownerName: "운영팀", recommendedAt: isoDaysAgo(4, 9, 0), status: "dismissed", statusHistory: [{ status: "recommended", at: isoDaysAgo(4, 9, 0), actor: "Repeat Engine" }, { status: "dismissed", at: isoDaysAgo(3, 9, 0), actor: "운영팀", note: "CS 직접 응대로 대체" }] },
  { id: "act-012", type: "rebalance", engine: "demand", automation: "L3", errorCost: "MID", title: "첼시 부츠 270 → 260 물량 재배분", productId: "p-object-chelsea", variantId: variantId("p-object-chelsea", 0, "260"), brandId: "b-object", trigger: "260 품절 임박, 270 과잉", reasons: ["260 현재고 3개 · 270 현재고 19개", "260 재입고 신청 5건"], expectedImpact: "단기 품절 완화", urgency: "mid", owner: "md", ownerName: "박지원 MD", recommendedAt: isoDaysAgo(1, 9, 40), status: "recommended", statusHistory: [{ status: "recommended", at: isoDaysAgo(1, 9, 40), actor: "Demand Engine" }] },
];

/* ----------------------------- Seed Evidence ----------------------------- */
export const SEED_EVIDENCE: EvidenceLog[] = [
  { id: "ev-001", type: "BASELINE", title: "Baseline 측정 지점 정의", detail: "구매전환율·찜→구매·재입고알림→구매·반품률·재고일수·MD 분석시간의 측정 지점을 정의했습니다. 실제 값은 Pilot 1~2주차에 측정합니다.", at: isoDaysAgo(14, 10), actor: "미래AI랩", source: "DEMO", status: "pilot-ready", kpiDelta: "BASELINE: REQUIRED / UNKNOWN" },
  { id: "ev-002", type: "ACTION", title: "그래픽 후디 블랙 L 재입고 승인·실행", detail: "Demand Engine 추천 → MD 승인 → 40개 입고 완료.", at: isoDaysAgo(0, 9, 10), actor: "최서준 MD", actionId: "act-007", productId: "p-current-hoodie", source: "DEMO", status: "demo" },
  { id: "ev-003", type: "CUSTOMER", title: "재입고 알림 9명 중 4명 구매 (Demo)", detail: "재입고 알림 발송 후 24시간 내 4건 구매. 시뮬레이션 값이며 실제 성과가 아닙니다.", at: isoDaysAgo(0, 9, 30), actor: "System", actionId: "act-007", productId: "p-current-hoodie", source: "SIMULATION", status: "demo", kpiDelta: "재입고 알림→구매 4/9 (SIMULATION)" },
  { id: "ev-004", type: "ACTION", title: "에어 메쉬 러너 핏 안내 수정", detail: "'발볼이 좁게 나와 5mm 크게 권장' 안내를 상품 상세 상단에 노출.", at: isoDaysAgo(3, 16), actor: "최서준 MD", actionId: "act-009", productId: "p-current-runner", source: "DEMO", status: "demo" },
  { id: "ev-005", type: "RISK", title: "와이드 스트레이트 데님 Fit Risk 상승", detail: "사이즈 작음 반품 비율 82%. 핏 안내 강화 Action 진행 중.", at: isoDaysAgo(2, 10), actor: "Fit Engine", actionId: "act-004", productId: SCENARIO.B_PRODUCT, source: "DEMO", status: "demo" },
  { id: "ev-006", type: "ADOPTION", title: "주간 Action 처리율 (Demo)", detail: "생성 12건 중 완료 2건·진행 2건·확인 1건·보류 1건·무시 1건. 실제 채택률은 Pilot에서 측정합니다.", at: isoDaysAgo(0, 7), actor: "System", source: "SIMULATION", status: "demo", kpiDelta: "Action Execution Rate 2/12 (SIMULATION)" },
  { id: "ev-007", type: "EFFICIENCY", title: "MD 주간 분석시간 측정 항목 준비", detail: "판매·재고·찜·반품을 화면별로 비교하던 시간을 Action Center 확인 시간과 비교하는 측정표를 준비했습니다.", at: isoDaysAgo(7, 10), actor: "미래AI랩", source: "DEMO", status: "pilot-ready" },
  { id: "ev-008", type: "REVENUE", title: "NOVE STUDIO 브랜드위크 캠페인 전후 비교 (Demo)", detail: "캠페인 전 주 매출 920만원 → 진행 중 1,380만원. 시뮬레이션 데이터입니다.", at: isoDaysAgo(1, 18), actor: "System", source: "SIMULATION", status: "demo", kpiDelta: "+50% (SIMULATION)" },
];

