import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#102D4E",
        brand: {
          50: "#EEF8FC",
          100: "#D9EFF8",
          500: "#1683B5",
          600: "#0E6E9C",
          700: "#0B5A82",
        },
        canvas: "#F4F7FA",
      },
      boxShadow: {
        card: "0 8px 30px rgba(25, 52, 79, 0.06)",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
