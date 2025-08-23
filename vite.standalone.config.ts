import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  // Development mode with source maps
  mode: "development",
  build: {
    sourcemap: true,
    outDir: "dist-standalone",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "[name].[hash].js",
      },
    },
    // Use tsconfig.standalone.json for TypeScript compilation
    target: "es2015",
    minify: false,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "@assets": resolve(__dirname, "./assets"),
      "@components": resolve(__dirname, "./components"),
      "@composables": resolve(__dirname, "./composables"),
      "@entrypoints": resolve(__dirname, "./entrypoints"),
      "@hooks": resolve(__dirname, "./hooks"),
      "@modules": resolve(__dirname, "./modules"),
      "@utils": resolve(__dirname, "./utils"),
      "@src": resolve(__dirname, "./src"),
      "webextension-polyfill": resolve(__dirname, ".standalone/polyfills/standalone-browser.ts"),
      Browser: resolve(__dirname, ".standalone/polyfills/browser.ts"),
    },
  },
  plugins: [react(), svgr()],
  server: {
    port: 4400,
    open: true,
    host: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.standalone.json",
    },
    include: [
      "react",
      "react-dom",
      "browser",
      "chrome",
      "webextension-polyfill",
      "defineBackground",
      "defineContentScript",
      "createShadowRootUi",
      "playground",
      "src",
    ],
  },

  // Configure entry points
  // In Vite, we need to ensure the polyfills are loaded before the main entry
  // We'll do this by adding a script tag to the HTML template
  // or by importing the polyfills in the main entry
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    // Виключаємо webextension-polyfill в standalone режимі
    "webextension-polyfill": "undefined",
    Browser: "undefined",
  },
});
