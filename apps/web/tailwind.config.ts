import type { Config } from "tailwindcss";
import sharedPreset from "@salary-mgmt/config/tailwind";

const config: Config = {
  presets: [sharedPreset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
