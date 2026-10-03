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
  },
};
