import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#16a34a",
        secondary: "#1e293b",
        "budolshap-primary": "#f43f5e",
        "budolshap-secondary": "#8b5cf6",
      },
    },
  },
  plugins: [],
};
export default config;
