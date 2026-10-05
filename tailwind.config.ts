import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bis: {
          50: "#fef2f2",
          100: "#fde3e3",
          200: "#fbcaca",
          300: "#f7a3a3",
          400: "#ef6f6f",
          500: "#e34545",
          600: "#d11f1f",
          700: "#af1818",
          800: "#91191b",
          900: "#791b1d",
          950: "#410a0b",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c8",
          400: "#8591a8",
          500: "#66728c",
          600: "#515b73",
          700: "#424a5d",
          800: "#39404f",
          900: "#333844",
          950: "#0f1116",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 17 22 / 0.04), 0 1px 3px 0 rgb(15 17 22 / 0.04)",
        lift: "0 4px 16px -4px rgb(15 17 22 / 0.10), 0 2px 6px -2px rgb(15 17 22 / 0.06)",
        panel: "0 8px 32px -12px rgb(15 17 22 / 0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.32s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.24s ease-out both",
        "pulse-soft": "pulse-soft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
