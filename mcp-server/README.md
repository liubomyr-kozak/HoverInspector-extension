# Hover Inspector MCP server

Lets an AI agent (Claude Code, Claude Desktop, Cursor, any MCP client) use the Hover Inspector extension
running in your own browser: the page's real palette and type scale, CSS snapshots and their diff,
screenshots, and the Automation scenarios (list, save, run, repeated-action patterns from live watching).

```
MCP client ──stdio──▶ mcp-server (Node) ◀──WebSocket 127.0.0.1:17345── extension service worker ──▶ tab
```

The MCP client starts the server. The server listens on 127.0.0.1 only and accepts only extension
origins (`chrome-extension://…`), so a web page can neither pose as the extension nor read the requests.
The extension connects to it while **Automation Scenarios → Settings → MCP bridge for AI agents** is on
(off by default) and retries every few seconds while no server runs.

## Set up

```bash
yarn install
yarn build        # the extension, load dist/chrome-mv3 in chrome://extensions
yarn mcp:build    # the server, one file: dist/mcp-server/hover-inspector-mcp.mjs
```

Add it to your agent, with the absolute path to your checkout:

```bash
claude mcp add hover-inspector -- node /path/to/HoverInspector-extension/dist/mcp-server/hover-inspector-mcp.mjs
```

Codex (`~/.codex/config.toml`):

```toml
[mcp_servers.hover-inspector]
command = "node"
args = ["/path/to/HoverInspector-extension/dist/mcp-server/hover-inspector-mcp.mjs"]
```

or in a JSON MCP config (Claude Desktop, Cursor `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "hover-inspector": {
      "command": "node",
      "args": ["/path/to/HoverInspector-extension/dist/mcp-server/hover-inspector-mcp.mjs"]
    }
  }
}
```

You never start the server by hand: the agent starts it when it starts and stops it when it exits. Each
person runs it on their own computer, next to their own browser; there is nothing to deploy. Then turn on
the MCP bridge in the extension. The `status` tool tells you whether it is connected.

Environment variables:

- `HOVER_INSPECTOR_MCP_PORT`: port to listen on (default `17345`). Set the same port in the extension.
- `HOVER_INSPECTOR_EXTENSION_ID`: accept only this extension id (see `chrome://extensions`).

## Tools

| Tool | What it returns | Needs the page |
| --- | --- | --- |
| `status` | connection, extension version | |
| `list_tabs` | tabs the extension can work in | |
| `take_screenshot` | PNG of the visible tab | |
| `get_page_info` | viewport facts and the Page Ruler checks | yes |
| `audit_design` | colours, type styles, spacing, radii, shadows, CSS variables, issues, theme | yes |
| `get_design_theme` | the theme imported into the Color Palette tool, colour history | |
| `list_css_snapshots` / `get_css_snapshot` | saved snapshots (`maxDepth` cuts the tree) | |
| `capture_css_snapshot` | saves a page or element (`selector` / `xpath`) snapshot | yes |
| `compare_css_snapshots` | added / removed / modified elements with style and position changes | |
| `list_scenarios` / `get_scenario` | saved Automation scenarios and their steps | |
| `save_scenario` | creates or updates a scenario | |
| `run_scenario` / `get_scenario_run` | plays a scenario in a tab, then its progress | yes |
| `get_live_watch_patterns` | repeated action sequences with ready steps | |

"Needs the page" tools switch Hover Inspector on in that tab (its panel opens there), because the code
that reads the page lives in the content script.

## Code

- `mcp-server/`: the Node server (`main.ts`, `extensionBridge.ts` for the socket, `tools.ts` for the tool list).
- `entrypoints/core/mcp/`: message types and guards shared by both ends.
- `entrypoints/background/mcpBridge/`: the extension's end: connection, request handlers.
- `entrypoints/content/mcp/contentTools.ts`: the page operations.

To add a capability: add a `BridgeMethod` (and a `ContentMethod` if it needs the page), handle it in
`background/mcpBridge/handlers.ts`, and register the tool in `mcp-server/tools.ts`.
