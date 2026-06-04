import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
});
