import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { isValidPort, MCP_BRIDGE_DEFAULT_PORT } from "../entrypoints/core/mcp/protocol";
import { ExtensionBridge } from "./extensionBridge";
import { registerTools } from "./tools";

/**
 * Hover Inspector MCP server. The agent's MCP client starts it (stdio); it listens on 127.0.0.1 for the
 * browser extension, which connects while "MCP bridge" is on in the toolbar menu (⋮) > Settings.
 *
 * Environment: HOVER_INSPECTOR_MCP_PORT (default 17345, must match the extension), and optionally
 * HOVER_INSPECTOR_EXTENSION_ID to accept only that extension build.
 */
const envPort = Number(process.env.HOVER_INSPECTOR_MCP_PORT);
const port = isValidPort(envPort) ? envPort : MCP_BRIDGE_DEFAULT_PORT;

const bridge = new ExtensionBridge({ port, extensionId: process.env.HOVER_INSPECTOR_EXTENSION_ID || undefined });
await bridge.start();
// stdout belongs to the MCP protocol; diagnostics go to stderr
process.stderr.write(
  bridge.error ? `[hover-inspector-mcp] ${bridge.error}\n` : `[hover-inspector-mcp] waiting for the extension on 127.0.0.1:${port}\n`,
);

const server = new McpServer(
  { name: "hover-inspector", version: "1.0.0" },
  {
    instructions:
      "Tools of the Hover Inspector browser extension, running in the user's own browser. Prefer them to " +
      "guessing: audit_design gives a page's real palette and type scale, CSS snapshots and compare_css_snapshots " +
      "show what changed in styles, take_screenshot shows the page, and the scenario tools read, save and replay " +
      "the user's browser automation. Tools that read a page open the Hover Inspector panel in that tab.",
  },
);
registerTools(server, bridge);
await server.connect(new StdioServerTransport());

const shutdown = () => {
  bridge.close().finally(() => process.exit(0));
};
process.stdin.on("close", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
