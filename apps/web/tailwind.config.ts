import type { Config } from "tailwindcss";

// In Tailwind v4, theme customisation is done via @theme in globals.css.
// This file only exists for editor tooling compatibility.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
