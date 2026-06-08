import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    nitro: true,
    server: { entry: "server" },
  },
});