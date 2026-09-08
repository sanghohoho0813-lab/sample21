export type ThemeId =
  | "deep-navy"
  | "navy-gold"
  | "emerald-gold"
  | "forest-sage"
  | "deep-teal"
  | "onyx-gold"
  | "burgundy-slate"
  | "plum-indigo"
  | "steel-platinum";

export interface ThemeDef {
  id: ThemeId;
  no: string;
  name: string;
  shell: string;
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  soft: string;
}

/** Unified v3.0 Canonical 9 Theme × 6 Color */
export const THEMES: ThemeDef[] = [
  { id: "deep-navy", no: "01", name: "Deep Navy Blue", shell: "#0B1830", primary: "#2457D6", secondary: "#1687A7", accent: "#17A889", highlight: "#E7C873", soft: "#DCE8F7" },
  { id: "navy-gold", no: "02", name: "Navy Gold", shell: "#111A2D", primary: "#2847A7", secondary: "#A37A28", accent: "#D0A84B", highlight: "#F0D995", soft: "#EFE8D7" },
  { id: "emerald-gold", no: "03", name: "Emerald Gold", shell: "#11332B", primary: "#0E7663", secondary: "#2C9277", accent: "#B4862A", highlight: "#E8CE88", soft: "#E2F0EA" },
  { id: "forest-sage", no: "04", name: "Forest Sage", shell: "#17352C", primary: "#356E58", secondary: "#73977E", accent: "#A58E4D", highlight: "#D9D2AA", soft: "#E5ECE5" },
  { id: "deep-teal", no: "05", name: "Deep Teal", shell: "#08323A", primary: "#087A83", secondary: "#1597A3", accent: "#D2704C", highlight: "#E9B59B", soft: "#DDEDEF" },
  { id: "onyx-gold", no: "06", name: "Onyx Gold", shell: "#15171C", primary: "#343942", secondary: "#6A717C", accent: "#B89032", highlight: "#E0C76F", soft: "#E6E8EC" },
  { id: "burgundy-slate", no: "07", name: "Burgundy Slate", shell: "#3A1724", primary: "#7A2C49", secondary: "#667085", accent: "#A85C72", highlight: "#E6B6A5", soft: "#EEE4E8" },
  { id: "plum-indigo", no: "08", name: "Plum Indigo", shell: "#291A3D", primary: "#573F91", secondary: "#4E63A8", accent: "#8B5AA6", highlight: "#C4B0E6", soft: "#E9E5F3" },
  { id: "steel-platinum", no: "09", name: "Steel Platinum", shell: "#24303B", primary: "#44647A", secondary: "#6D8899", accent: "#4C9AAA", highlight: "#C9D6DE", soft: "#E7EDF1" },
];

export const DEFAULT_THEME: ThemeId = "deep-navy";
export const MORFIT_BRAND_BLUE = "#315CF5";

export function themeById(id: string | undefined | null): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Sidebar / module icon accents (Unified §SIDEBAR ICON COLOR SYSTEM) */
export const ICON_ACCENTS = {
  overview: "#5B8DEF",
  operations: "#3AAFA9",
  sales: "#D79A43",
  customer: "#A66BBE",
  ai: "#7376D9",
  evidence: "#3C9A75",
  risk: "#D66A5E",
  settings: "#718096",
} as const;
