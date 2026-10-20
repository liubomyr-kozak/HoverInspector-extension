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
    // <all_urls> rather than *://*/*: chrome.tabs.captureVisibleTab (MCP screenshots) accepts only <all_urls>
    // or activeTab. Chrome shows the same "all websites" permission for both.
    host_permissions: ["<all_urls>"],
    action: {
      default_icon: "icon/32.png",
    },
    permissions: ["activeTab", "scripting", "background", "storage", "unlimitedStorage", "alarms"],
    browser_specific_settings: {
      gecko: {
        id: "https://liubomyr-kozak.github.io/hover-inspector/",
      },
    },
  },
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  // Release zips are kept next to the earlier ones in archives/, named by version like in LinguaReef
  zip: {
    artifactTemplate: "../archives/{{packageVersion}}-{{browser}}.zip",
  },
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
  // Same modes as LinguaReef. WXT sets NODE_ENV to the mode: "production" is the store build,
  // "staging" is the local build of the installed extension (LinguaReef's local-prod: not minified,
  // with source maps). "development" belongs to the standalone page; see the scripts in package.json.
  vite: ({ mode }) => ({
    build: mode === "production" ? {} : { minify: false, sourcemap: true },
    plugins: [react(), Svgr()],
    resolve: {
      // The default react-toastify build injects its stylesheet (and :root variables) into the page's
      // <head>. Our toasts live in the shadow root, which gets the CSS separately (see content/app.tsx).
      alias: [{ find: /^react-toastify$/, replacement: "react-toastify/unstyled" }],
    },
  }),
  test: {
    environment: "jsdom", // <- додає window, document і т.д.
  },
} as UserConfig);
