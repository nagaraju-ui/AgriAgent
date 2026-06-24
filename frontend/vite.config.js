import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies the API to the FastAPI backend on :8000
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: { "/api": "http://localhost:8000" },
  },
  build: { outDir: "dist" },
});
