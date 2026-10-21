import { defineConfig } from "vite";
import { resolve } from "path";

// The Hover Inspector MCP server (mcp-server/) as one Node file with its dependencies bundled in, so an
// MCP client can start it with plain `node` and no install step: yarn mcp:build
export default defineConfig({
  mode: "production",
  // Not a web page: nothing from public/ belongs in the server folder
  publicDir: false,
  // ws loads its optional native addons in a try/require; bundled, that require resolves to an empty stub
  // and ws then calls functions that are not there. Tell ws to use its JavaScript implementation.
  define: {
    "process.env.WS_NO_BUFFER_UTIL": JSON.stringify("1"),
    "process.env.WS_NO_UTF_8_VALIDATE": JSON.stringify("1"),
  },
  build: {
    ssr: resolve(__dirname, "mcp-server/main.ts"),
    outDir: "dist/mcp-server",
    emptyOutDir: true,
    target: "node18",
    minify: false,
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "hover-inspector-mcp.mjs",
        banner: "#!/usr/bin/env node",
      },
    },
  },
  ssr: {
    target: "node",
    noExternal: true,
  },
});
