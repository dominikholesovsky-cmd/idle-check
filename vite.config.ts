import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite"; // Opraveno na pojmenovaný import

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({
      preset: "vercel"
    }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      "@": "/src"
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router"]
  }
});