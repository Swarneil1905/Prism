import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      colors: {
        bg: "#0C0C0E",
        surface: "#141416",
        "surface-raised": "#1C1C1F",
        indigo: "#6C63FF",
        "indigo-hover": "#7B73FF",
        "text-1": "#F2F1EE",
        "text-2": "#8A8884",
        "text-3": "#4A4946",
        green: "#34C97A",
        red: "#F04A4A",
        amber: "#F0A134",
        blue: "#4A9CF0",
      },
    },
  },
  plugins: [],
}
export default config
