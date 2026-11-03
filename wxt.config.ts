import { defineConfig, UserConfig } from "wxt";

import Svgr from "vite-plugin-svgr";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Hover inspector",
    short_name: "Inspector",
    description:
      "Inspector is the tool which mimic display dimension between selected and hover element. It would be good for designers, QA",
    homepage_url: "https://github.com/liubomyr-kozak/HoverInspector-extension",
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
  // Release zips go to archives/ (git-ignored), named by version
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
  // WXT sets NODE_ENV to the mode: "production" is the store build, "staging" is the local build of
  // the installed extension (not minified, with source maps). "development" belongs to the standalone page; see the scripts in package.json.
  vite: ({ mode }) => ({
    build: mode === "production" ? {} : { minify: false, sourcemap: true },
    // React (and its hot reload) comes from @wxt-dev/module-react; adding react() here too injects the
    // refresh preamble twice and the dev server fails with "inWebWorker has already been declared".
    plugins: [Svgr()],
    resolve: {
      // The default react-toastify build injects its stylesheet (and :root variables) into the page's
      // <head>. Our toasts live in the shadow root, which gets the CSS separately (see content/app.tsx).
      alias: [{ find: /^react-toastify$/, replacement: "react-toastify/unstyled" }],
    },
  }),
  test: {
    environment: "jsdom", // provides window, document, etc.
  },
} as UserConfig);
