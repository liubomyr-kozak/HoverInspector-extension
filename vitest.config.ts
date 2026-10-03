import { resolve } from "path";

export default {
  resolve: {
    alias: {
      "@entrypoints": resolve(__dirname, "./entrypoints"),
      "@": resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "jsdom", // <- додає window, document і т.д.
    // Vendored react-rnd tests are written for AVA + Enzyme (React 16) and can't run on React 19
    exclude: ["**/node_modules/**", "**/dist/**", "**/.output/**", "entrypoints/shared/components/ReactRnd/index.test.tsx"],
  },
};
