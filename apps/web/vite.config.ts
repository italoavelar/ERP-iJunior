import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": { target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8787", changeOrigin: false },
      "/api": { target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8787", changeOrigin: false }
    }
  }
});
