import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { brand: { DEFAULT: "#0b7568", dark: "#07594f", pale: "#e9f5f2" }, ink: "#102a2a" }, boxShadow: { soft: "0 18px 50px rgba(16,42,42,.08)" } } }, plugins: [require("@tailwindcss/forms")] };
export default config;
