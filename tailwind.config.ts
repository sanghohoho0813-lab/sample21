import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          shell: "var(--theme-shell)",
          primary: "var(--theme-primary)",
          secondary: "var(--theme-secondary)",
          accent: "var(--theme-accent)",
          highlight: "var(--theme-highlight)",
          soft: "var(--theme-soft)",
        },
        neutral: {
          canvas: "var(--neutral-canvas)",
          surface: "var(--neutral-surface)",
          raised: "var(--neutral-surface-raised)",
          text: "var(--neutral-text)",
          text2: "var(--neutral-text-secondary)",
          border: "var(--neutral-border)",
        },
        semantic: {
          success: "var(--semantic-success)",
          warning: "var(--semantic-warning)",
          error: "var(--semantic-error)",
          info: "var(--semantic-info)",
        },
        brand: {
          black: "var(--brand-black)",
          white: "#FFFFFF",
          ivory: "var(--brand-ivory)",
          accent: "var(--brand-accent)",
        },
        sidebar: {
          text: "var(--sidebar-text)",
          muted: "var(--sidebar-muted)",
          label: "var(--sidebar-label)",
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
          "100%": { opacity: "1", transform: "translateY(0)" },
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
          "100%": { opacity: "1", transform: "scale(1)" },
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
