import config from "./vite.standalone.config";

export default {
  test: {
    environment: "jsdom", // <- додає window, document і т.д.
  },
};
