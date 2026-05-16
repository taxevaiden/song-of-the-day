// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 4321,
      cors: true,
    },
  },
  site: "https://sotd.tacks.workers.dev",
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
