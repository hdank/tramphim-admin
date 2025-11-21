import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import node from "@astrojs/node";
import compress from "astro-compress";
import "dotenv/config";

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    tailwind(),
    compress({
      html: true,
      css: true,
      js: true,
      svg: true,
      img: false, 
      gzip: true,
      brotli: true,
    }),
  ],
  server: {
    port: 4446,
    host: true,
  },
});
