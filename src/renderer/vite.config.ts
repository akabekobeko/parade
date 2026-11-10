import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// URL.pathname keeps the leading slash before a Windows drive letter
// ("/D:/..."), which breaks path resolution there - fileURLToPath does not.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  base: "./",
  define: {
    // Startup trace (README "Startup Trace"): compiled in by
    // `pnpm build:trace` only. Vite keeps NODE_ENV at production for any
    // mode other than development, so the trace build is a production build.
    __STARTUP_TRACE__: JSON.stringify(mode === "trace"),
  },
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
  build: {
    target: "chrome156",
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
}));
