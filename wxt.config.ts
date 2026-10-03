import { defineConfig, UserConfig } from "wxt";

import react from "@vitejs/plugin-react";
import Svgr from "vite-plugin-svgr";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Hover inspector",
    short_name: "Inspector",
    description:
      "Inspector is the tool which mimic display dimension between selected and hover element. It would be good for designers, QA",
    update_url: "https://clients2.google.com/service/update2/crx",
    manifest_version: 3,
    host_permissions: ["*://*/*"],
    action: {
      default_icon: "icon/32.png",
    },
    permissions: ["activeTab", "scripting", "background", "storage", "unlimitedStorage"],
    web_accessible_resources: [
      {
        resources: [
          "icon-16.png",
          "icon-16-active.png",
          "icon-32.png",
          "icon-32-active.png",
          "icon-64.png",
          "icon-64-active.png",
          "icon-128.png",
          "icon-128-active.png",
        ],
        matches: [],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: "https://liubomyr-kozak.github.io/hover-inspector/",
      },
    },
  },
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  alias: {
    "@": "./",
    "@assets": "./assets",
    "@components": "./components",
    "@composables": "./composables",
    "@entrypoints": "./entrypoints",
    "@hooks": "./hooks",
    "@modules": "./modules",
    "@utils": "./utils",
  },
  vite: () => ({
    plugins: [react(), Svgr()],
  }),
  test: {
    environment: "jsdom", // <- додає window, document і т.д.
  },
} as UserConfig);
