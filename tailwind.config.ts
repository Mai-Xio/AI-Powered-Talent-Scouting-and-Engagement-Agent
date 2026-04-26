import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mist: "#edf2f4",
        cobalt: "#2563eb",
        spruce: "#0f766e",
        amberline: "#d97706",
        rosewood: "#be123c"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(23, 32, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
