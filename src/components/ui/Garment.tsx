/* ------------------------------------------------------------------
   Garment — 실사진이 들어오기 전까지 상품 이미지 자리에 그리는 '스튜디오 컷'.
   상품명·카테고리로 실루엣(코트·셔츠·팬츠·스니커즈…)을 고르고 상품 색으로 칠한다.
   글자만 있는 그라데이션보다 목록에서 상품을 '보고' 고를 수 있게 하는 것이 목적이다.
   실사진이 등록되면(src/lib/assets.ts) 이 컴포넌트는 그려지지 않는다.
------------------------------------------------------------------- */
import type { CategoryId } from "@/lib/types";

export type GarmentKind =
  | "coat"
  | "jacket"
  | "vest"
  | "shirt"
  | "tee"
  | "hoodie"
  | "pants"
  | "skirt"
  | "dress"
  | "shoe"
  | "boot"
  | "bag"
  | "cap"
  | "belt"
  | "scarf"
  | "socks";

/** 상품명 키워드 → 실루엣. 순서가 중요하다('스웻셔츠'는 셔츠가 아니라 스웻) */
export function garmentKind(name: string, category: CategoryId): GarmentKind {
  const has = (...ks: string[]) => ks.some((k) => name.includes(k));
  switch (category) {
    case "outer":
      if (has("베스트")) return "vest";
      if (has("코트", "트렌치")) return "coat";
      return "jacket";
    case "top":
      if (has("후디")) return "hoodie";
      if (has("스웻", "티셔츠", "니트", "가디건")) return "tee";
      return "shirt";
    case "bottom":
      return "pants";
    case "dress":
      return has("스커트") ? "skirt" : "dress";
    case "shoes":
      return has("부츠") ? "boot" : "shoe";
    case "bag":
      return "bag";
    case "acc":
      if (has("캡", "모자")) return "cap";
      if (has("벨트")) return "belt";
      if (has("머플러", "스카프")) return "scarf";
      return "socks";
  }
}

/* viewBox 0 0 100 120 — 몸판(fill) + 디테일 선(stroke) */
const BODY: Record<GarmentKind, string> = {
  tee: "M30 22 L42 16 Q50 23 58 16 L70 22 L86 38 L76 48 L70 42 L70 100 L30 100 L30 42 L24 48 L14 38 Z",
  shirt: "M30 22 L42 15 L50 23 L58 15 L70 22 L80 34 L88 84 L79 86 L71 48 L71 102 L29 102 L29 48 L21 86 L12 84 L20 34 Z",
  hoodie:
    "M30 24 L40 18 Q38 4 50 4 Q62 4 60 18 L70 24 L80 36 L88 86 L79 88 L71 50 L71 102 L29 102 L29 50 L21 88 L12 86 L20 36 Z",
  coat: "M32 18 L44 14 L50 30 L56 14 L68 18 L80 30 L87 94 L78 96 L72 54 L75 114 L25 114 L28 54 L22 96 L13 94 L20 30 Z",
  jacket: "M31 20 L43 15 L50 30 L57 15 L69 20 L81 32 L87 84 L78 86 L72 52 L72 92 L28 92 L28 52 L22 86 L13 84 L19 32 Z",
  vest: "M34 16 L44 14 L50 28 L56 14 L66 16 Q66 30 75 34 L73 94 L27 94 L25 34 Q34 30 34 16 Z",
  pants: "M31 12 L69 12 L73 112 L56 112 L50 46 L44 112 L27 112 Z",
  skirt: "M36 26 L64 26 L80 100 Q50 106 20 100 Z",
  dress: "M40 10 L46 10 Q50 17 54 10 L60 10 L62 32 L58 42 L77 112 Q50 117 23 112 L42 42 L38 32 Z",
  shoe: "M12 84 Q13 66 28 62 L44 60 Q54 52 63 60 L82 70 Q93 74 91 84 Z",
  boot: "M30 28 L53 28 L55 68 L80 74 Q91 78 89 88 L28 88 Z",
  bag: "M22 50 L78 50 L82 106 Q50 110 18 106 Z",
  cap: "M20 74 Q20 40 50 38 Q80 40 80 74 Z",
  belt: "M8 54 L92 54 L92 66 L8 66 Z",
  scarf: "M38 12 L62 12 L63 70 L72 110 L57 112 L50 74 L43 112 L28 110 L37 70 Z",
  socks: "M24 18 L42 18 L42 74 Q42 84 34 88 L22 96 Q14 98 14 90 Q14 84 22 80 L24 76 Z",
};

const DETAIL: Partial<Record<GarmentKind, string>> = {
  tee: "M42 16 Q50 26 58 16 M30 92 L70 92 M24 48 L30 42 M76 48 L70 42",
  shirt: "M42 15 L46 27 L50 23 L54 27 L58 15 M50 25 L50 102 M21 86 L29 82 M79 86 L71 82",
  hoodie: "M40 18 Q50 26 60 18 M47 24 L46 36 M53 24 L54 36 M36 74 L64 74 L66 92 L34 92 Z M29 96 L71 96",
  coat: "M44 14 L39 38 L50 30 M56 14 L61 38 L50 30 M50 30 L50 114 M33 76 L41 76 M59 76 L67 76",
  jacket: "M43 15 L39 36 L50 30 M57 15 L61 36 L50 30 M50 30 L50 92 M33 66 L41 66 M59 66 L67 66 M28 86 L72 86",
  vest: "M50 28 L50 94 M32 52 L44 52 M56 52 L68 52 M31 70 L44 70 M56 70 L69 70",
  pants: "M31 20 L69 20 M40 20 L40 30 M50 20 L50 46 M36 28 Q40 34 44 30",
  skirt: "M36 32 L64 32 M42 32 L36 102 M50 32 L50 104 M58 32 L64 102",
  dress: "M46 10 Q50 20 54 10 M42 42 L58 42",
  shoe: "M30 64 L36 74 M38 61 L44 72 M46 58 L51 68 M12 84 L91 84",
  boot: "M30 40 L53 40 M28 82 L89 82",
  bag: "M36 50 Q36 22 50 22 Q64 22 64 50 M22 62 L78 62",
  cap: "M50 38 L50 74 M34 44 Q40 60 38 74 M66 44 Q60 60 62 74 M18 74 Q50 68 94 78 Q62 86 18 78 Z",
  belt: "M60 50 L74 50 L74 70 L60 70 Z M64 60 L80 60",
  scarf: "M37 70 L63 70 M43 112 L42 118 M47 113 L46 119 M57 112 L58 118 M62 111 L64 117",
  socks: "M24 30 L42 30 M24 36 L42 36 M60 24 L78 24 L78 72 Q78 82 70 86 L58 92 Q50 94 50 86 Q50 80 58 76 L60 72 Z",
};

/** 밝은 색 위에서는 어두운 선, 어두운 색 위에서는 밝은 선 */
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 165;
};

export function Garment({
  kind,
  color,
  shade,
  id,
  zoom = 1,
}: {
  kind: GarmentKind;
  color: string;
  shade: string;
  id: string;
  zoom?: number;
}) {
  const light = isLight(color);
  const gid = `g-${id}`;
  return (
    <svg
      viewBox="0 0 100 120"
      className="absolute inset-0 m-auto h-[78%] w-[78%] transition-transform duration-300"
      style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: "50% 28%" } : undefined}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <radialGradient id={`${gid}-s`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="116" rx="34" ry="3.2" fill={`url(#${gid}-s)`} />
      <path
        d={BODY[kind]}
        fill={`url(#${gid})`}
        stroke={light ? "rgba(17,17,17,0.18)" : "rgba(0,0,0,0.25)"}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {DETAIL[kind] && (
        <path
          d={DETAIL[kind]}
          fill="none"
          stroke={light ? "rgba(17,17,17,0.22)" : "rgba(255,255,255,0.28)"}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {(kind === "shirt" || kind === "coat") &&
        [44, 60, 76, 92].map((y) => (
          <circle
            key={y}
            cx={kind === "coat" ? 53 : 52.4}
            cy={y}
            r="1"
            fill={light ? "rgba(17,17,17,0.3)" : "rgba(255,255,255,0.35)"}
          />
        ))}
    </svg>
  );
}
