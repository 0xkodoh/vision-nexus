/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: "#07090e",
          900: "#0d1117",
          850: "#121720",
          800: "#161c26",
          750: "#1c2431",
          700: "#222c3c",
          600: "#334155",
          500: "#475569",
        },
        signal: {
          pass: "#10b981",
          "pass-glow": "#00ff9d",
          alarm: "#ef4444",
          "alarm-glow": "#ff3344",
          warn: "#f59e0b",
          "warn-glow": "#ffaa00",
          cyan: "#06b6d4",
          "cyan-glow": "#22d3ee",
          aws: "#ff9900",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 4s linear infinite",
        "radar-sweep": "radar 3s linear infinite",
        "glow-alarm": "glowAlarm 1.5s ease-in-out infinite alternate",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        glowAlarm: {
          "0%": { boxShadow: "0 0 10px rgba(239, 68, 68, 0.3)" },
          "100%": { boxShadow: "0 0 25px rgba(255, 51, 68, 0.8), inset 0 0 15px rgba(255, 51, 68, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};
