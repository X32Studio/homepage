import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
  site: "https://x32studio.com",
  integrations: [react()],
  vite: {
    plugins: [yaml()],
  },
});
