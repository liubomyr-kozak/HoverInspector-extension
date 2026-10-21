import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { errorMessage } from "../entrypoints/core/mcp/protocol";
import { BridgeMethod, type BridgeParams } from "../entrypoints/core/mcp/types";
import { StepType } from "../entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import type { ExtensionBridge } from "./extensionBridge";

const tabId = z
  .number()
  .int()
  .nonnegative()
  .optional()
  .describe("Browser tab id from list_tabs. Default: the active tab of the last focused window.");

const step = z.object({
  type: z.nativeEnum(StepType).refine((type) => type !== StepType.NOT_SET, "Pick a step type"),
  xpath: z.string().optional().describe("XPath of the target element (every step type that acts on an element)"),
  alternativeXpaths: z.array(z.string()).optional().describe("Fallback XPaths tried when xpath matches nothing"),
  value: z
    .string()
    .optional()
    .describe(
      "input/select: the text or option; keyPress: a combo such as 'Enter' or 'Control+a'; navigate/redirect: the URL; " +
        "wait: milliseconds; code: JavaScript; notification/confirmation: the message",
    ),
  delay: z.number().nonnegative().optional().describe("notification: auto-close time in ms"),
});

const asText = (value: unknown): CallToolResult => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

const failure = (error: unknown): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: errorMessage(error) }],
});

interface Screenshot {
  data: string;
  mimeType: string;
  url: string;
  title: string;
  tabId: number;
}

const isScreenshot = (value: unknown): value is Screenshot =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Screenshot).data === "string" &&
  typeof (value as Screenshot).mimeType === "string";

/**
 * Every Hover Inspector capability as an MCP tool. Each tool is one request to the extension; the
 * descriptions are what the agent reads to decide which tool to use, so they say what comes back.
 */
export function registerTools(server: McpServer, bridge: ExtensionBridge) {
  const forward = (method: BridgeMethod) => async (params: BridgeParams) => {
    try {
      return asText(await bridge.call(method, params));
    } catch (error) {
      return failure(error);
    }
  };
  const readOnly = { readOnlyHint: true, openWorldHint: false } as const;

  server.registerTool(
    BridgeMethod.STATUS,
    {
      title: "Connection status",
      description: "Checks that the Hover Inspector browser extension is connected and returns its version and methods.",
      annotations: readOnly,
    },
    async () => {
      try {
        return asText({ port: bridge.port, ...((await bridge.call(BridgeMethod.STATUS, {})) as object) });
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    BridgeMethod.LIST_TABS,
    {
      title: "List tabs",
      description: "Lists the open browser tabs Hover Inspector can work in (id, title, URL, active, inspector on).",
      annotations: readOnly,
    },
    () => forward(BridgeMethod.LIST_TABS)({}),
  );

  server.registerTool(
    BridgeMethod.TAKE_SCREENSHOT,
    {
      title: "Screenshot",
      description:
        "Captures the visible part of a tab as a PNG image. A background tab is brought to the front first unless activate is false.",
      inputSchema: { tabId, activate: z.boolean().optional() },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async (params) => {
      try {
        const shot = await bridge.call(BridgeMethod.TAKE_SCREENSHOT, params);
        if (!isScreenshot(shot)) throw new Error("The extension returned no image");
        return {
          content: [
            { type: "image", data: shot.data, mimeType: shot.mimeType },
            { type: "text", text: JSON.stringify({ tabId: shot.tabId, url: shot.url, title: shot.title }) },
          ],
        };
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    BridgeMethod.GET_PAGE_INFO,
    {
      title: "Page info",
      description:
        "Viewport facts of a page (sizes, device pixel ratio, zoom, root font size, scrollbar) and the Page Ruler checks " +
        "(viewport meta, horizontal overflow, small tap targets, small input fonts). Opens the Hover Inspector panel in the tab.",
      inputSchema: { tabId },
      annotations: readOnly,
    },
    forward(BridgeMethod.GET_PAGE_INFO),
  );

  server.registerTool(
    BridgeMethod.AUDIT_DESIGN,
    {
      title: "Design audit and palette",
      description:
        "Scans a page like the Color Palette & Typography tool: text, background and border colours with usage counts, " +
        "type styles, font families and sizes, spacing, radii, shadows, CSS variables, design issues with a score, and " +
        "the palette as a theme (colors, typography, spacing, radii, shadows) plus a :root CSS variables sheet. Use it " +
        "instead of guessing a site's palette. Opens the Hover Inspector panel in the tab.",
      inputSchema: { tabId, grid: z.union([z.literal(4), z.literal(8)]).optional().describe("Spacing grid in px") },
      annotations: readOnly,
    },
    forward(BridgeMethod.AUDIT_DESIGN),
  );

  server.registerTool(
    BridgeMethod.GET_DESIGN_THEME,
    {
      title: "Saved design theme",
      description:
        "The design theme the user imported into Hover Inspector (colors, typography, spacing, radii, shadows, borders " +
        "as token maps), the spacing grid, and the colour picker history. theme is null when none was imported.",
      annotations: readOnly,
    },
    () => forward(BridgeMethod.GET_DESIGN_THEME)({}),
  );

  server.registerTool(
    BridgeMethod.LIST_CSS_SNAPSHOTS,
    {
      title: "List CSS snapshots",
      description: "Lists the saved CSS snapshots (id, title, URL, time, element count, viewport).",
      annotations: readOnly,
    },
    () => forward(BridgeMethod.LIST_CSS_SNAPSHOTS)({}),
  );

  server.registerTool(
    BridgeMethod.GET_CSS_SNAPSHOT,
    {
      title: "Get a CSS snapshot",
      description:
        "One saved CSS snapshot: a tree of elements with tag, id, classes, XPath variants, bounds and the computed " +
        "styles that differ from browser defaults. Full-page snapshots are large: pass maxDepth to cut the tree.",
      inputSchema: { id: z.string(), maxDepth: z.number().int().nonnegative().optional() },
      annotations: readOnly,
    },
    forward(BridgeMethod.GET_CSS_SNAPSHOT),
  );

  server.registerTool(
    BridgeMethod.CAPTURE_CSS_SNAPSHOT,
    {
      title: "Capture a CSS snapshot",
      description:
        "Captures the computed styles of the whole page, or of one element (selector or xpath), and saves it to the " +
        "CSS Snapshot list. Returns its id for compare_css_snapshots. Opens the Hover Inspector panel in the tab.",
      inputSchema: {
        tabId,
        selector: z.string().optional().describe("CSS selector of one element"),
        xpath: z.string().optional().describe("XPath of one element"),
        title: z.string().optional(),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    forward(BridgeMethod.CAPTURE_CSS_SNAPSHOT),
  );

  server.registerTool(
    BridgeMethod.COMPARE_CSS_SNAPSHOTS,
    {
      title: "Compare CSS snapshots",
      description:
        "Diffs two saved snapshots (before, after) like the Snapshot Compare view: added, removed and modified " +
        "elements with style, attribute and position changes, and a summary. Use it for visual regression checks.",
      inputSchema: {
        beforeId: z.string(),
        afterId: z.string(),
        limit: z.number().int().positive().optional().describe("Most elements listed per group, default 100"),
        positionThreshold: z.number().nonnegative().optional().describe("Ignore moves smaller than this, px"),
        comparePositions: z.boolean().optional(),
        compareAttributes: z.boolean().optional(),
        ignoreProperties: z.array(z.string()).optional(),
      },
      annotations: readOnly,
    },
    forward(BridgeMethod.COMPARE_CSS_SNAPSHOTS),
  );

  server.registerTool(
    BridgeMethod.LIST_SCENARIOS,
    {
      title: "List automation scenarios",
      description: "Lists the saved Automation Scenarios (id, title, description, step count and types, tags).",
      annotations: readOnly,
    },
    () => forward(BridgeMethod.LIST_SCENARIOS)({}),
  );

  server.registerTool(
    BridgeMethod.GET_SCENARIO,
    {
      title: "Get a scenario",
      description: "One saved scenario with all its steps (type, xpath, value...).",
      inputSchema: { id: z.string() },
      annotations: readOnly,
    },
    forward(BridgeMethod.GET_SCENARIO),
  );

  server.registerTool(
    BridgeMethod.SAVE_SCENARIO,
    {
      title: "Save a scenario",
      description:
        "Creates a scenario (leave id out) or updates one (id from list_scenarios; fields left out keep their value). " +
        "It appears in the user's Automation Scenarios list and can be run with run_scenario. Reuse XPaths from " +
        "get_live_watch_patterns, get_scenario or snapshots rather than inventing them.",
      inputSchema: {
        id: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        steps: z.array(step).optional(),
        tags: z.array(z.string()).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    forward(BridgeMethod.SAVE_SCENARIO),
  );

  server.registerTool(
    BridgeMethod.RUN_SCENARIO,
    {
      title: "Run a scenario",
      description:
        "Plays a saved scenario in a tab, like the panel's play button: it clicks, types and navigates on that page. " +
        "Returns right away; poll get_scenario_run for progress.",
      inputSchema: { scenarioId: z.string(), tabId, startFromStep: z.number().int().nonnegative().optional() },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    },
    forward(BridgeMethod.RUN_SCENARIO),
  );

  server.registerTool(
    BridgeMethod.GET_SCENARIO_RUN,
    {
      title: "Scenario run progress",
      description: "Whether a scenario is playing in the tab, its status, current step, progress and error.",
      inputSchema: { tabId },
      annotations: readOnly,
    },
    forward(BridgeMethod.GET_SCENARIO_RUN),
  );

  server.registerTool(
    BridgeMethod.GET_LIVE_WATCH_PATTERNS,
    {
      title: "Repeated action patterns",
      description:
        "Action sequences the user repeated, found by Automation live watching (it must be on in the extension), " +
        "each with its site, ready scenario steps and whether it is already saved. A starting point for save_scenario. " +
        "Typed text is not shared, so input steps have no value. origin (e.g. https://example.com) limits it to one site.",
      inputSchema: { limit: z.number().int().min(1).max(20).optional(), origin: z.string().optional() },
      annotations: readOnly,
    },
    forward(BridgeMethod.GET_LIVE_WATCH_PATTERNS),
  );
}
