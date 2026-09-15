import type { Config } from "tailwindcss";

/* ------------------------------------------------------------------
   토큰 색은 CSS 변수(var(--x))다. Tailwind v3는 var() 색에 붙은
   투명도 수식(`border-neutral-text2/40`)을 계산하지 못해 유틸리티를
   '조용히 만들지 않는다' — 호버·구분선 스타일이 통째로 죽는다.
   함수형 색 정의로 투명도가 오면 color-mix로 직접 섞어준다. (D-24)
------------------------------------------------------------------- */
const token = (name: string) =>
  // Tailwind는 런타임에 함수를 호출하지만 타입 정의는 문자열만 허용한다.
  ((({ opacityValue }: { opacityValue?: string }) => {
    const v = `var(${name})`;
    if (opacityValue === undefined) return v;
    const n = Number(opacityValue);
    if (!Number.isFinite(n)) return v; // bg-opacity-* 같은 레거시 경로는 원색 유지
    return `color-mix(in srgb, ${v} ${n * 100}%, transparent)`;
  }) as unknown) as string;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          shell: token("--theme-shell"),
          primary: token("--theme-primary"),
          secondary: token("--theme-secondary"),
          accent: token("--theme-accent"),
          highlight: token("--theme-highlight"),
          soft: token("--theme-soft"),
        },
        neutral: {
          canvas: token("--neutral-canvas"),
          surface: token("--neutral-surface"),
          raised: token("--neutral-surface-raised"),
          text: token("--neutral-text"),
          text2: token("--neutral-text-secondary"),
          border: token("--neutral-border"),
        },
        semantic: {
          success: token("--semantic-success"),
          warning: token("--semantic-warning"),
          error: token("--semantic-error"),
          info: token("--semantic-info"),
        },
        brand: {
          black: token("--brand-black"),
          white: "#FFFFFF",
          ivory: token("--brand-ivory"),
          accent: token("--brand-accent"),
        },
        sidebar: {
          text: token("--sidebar-text"),
          muted: token("--sidebar-muted"),
          label: token("--sidebar-label"),
        },
        icon: {
          t1: token("--icon-t1"), t2: token("--icon-t2"), t3: token("--icon-t3"), t4: token("--icon-t4"), t5: token("--icon-t5"),
          t6: token("--icon-t6"), t7: token("--icon-t7"), t8: token("--icon-t8"), t9: token("--icon-t9"), t10: token("--icon-t10"),
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.04), 0 1px 3px rgba(17,24,39,0.06)",
        raised: "0 4px 14px rgba(17,24,39,0.08)",
        lift: "0 10px 24px rgba(17,24,39,0.12)",
      },
      borderRadius: {
        card: "16px",
        cardlg: "20px",
      },
      transitionDuration: {
        fast: "160ms",
        normal: "200ms",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideRight: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "none" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 180ms ease-out both",
        fadeIn: "fadeIn 160ms ease-out both",
        slideUp: "slideUp 220ms ease-out both",
        slideLeft: "slideLeft 220ms ease-out both",
        slideRight: "slideRight 220ms ease-out both",
        scaleIn: "scaleIn 180ms ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
