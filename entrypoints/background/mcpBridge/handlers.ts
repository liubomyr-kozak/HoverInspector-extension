import { browser } from "wxt/browser";

import { MCP_BRIDGE_PROTOCOL } from "@entrypoints/core/mcp/protocol";
import { BridgeMethod, ContentMethod, type BridgeParams } from "@entrypoints/core/mcp/types";

import { requireString } from "./params";
import { callContent, listTabs, takeScreenshot } from "./tabTools";
import {
  compareCssSnapshots,
  getCssSnapshot,
  getDesignTheme,
  getLiveWatchPatterns,
  getScenario,
  listCssSnapshots,
  listScenarios,
  readScenario,
  saveScenario,
} from "./storageTools";

type Handler = (params: BridgeParams) => Promise<unknown>;

const HANDLERS: Record<BridgeMethod, Handler> = {
  [BridgeMethod.STATUS]: async () => ({
    protocol: MCP_BRIDGE_PROTOCOL,
    extensionVersion: browser.runtime.getManifest().version,
    methods: Object.values(BridgeMethod),
  }),
  [BridgeMethod.LIST_TABS]: async () => ({ tabs: await listTabs() }),
  [BridgeMethod.TAKE_SCREENSHOT]: takeScreenshot,
  [BridgeMethod.GET_PAGE_INFO]: (params) => callContent(params, ContentMethod.GET_PAGE_INFO),
  [BridgeMethod.AUDIT_DESIGN]: (params) => callContent(params, ContentMethod.AUDIT_DESIGN),
  [BridgeMethod.GET_DESIGN_THEME]: getDesignTheme,
  [BridgeMethod.LIST_CSS_SNAPSHOTS]: listCssSnapshots,
  [BridgeMethod.GET_CSS_SNAPSHOT]: getCssSnapshot,
  [BridgeMethod.CAPTURE_CSS_SNAPSHOT]: (params) => callContent(params, ContentMethod.CAPTURE_CSS_SNAPSHOT),
  [BridgeMethod.COMPARE_CSS_SNAPSHOTS]: compareCssSnapshots,
  [BridgeMethod.LIST_SCENARIOS]: listScenarios,
  [BridgeMethod.GET_SCENARIO]: getScenario,
  [BridgeMethod.SAVE_SCENARIO]: saveScenario,
  // The page plays the scenario; it gets the saved version so an edit made through MCP is played as is
  [BridgeMethod.RUN_SCENARIO]: async (params) => {
    const scenarioId = requireString(params, "scenarioId");
    const scenario = await readScenario(scenarioId);
    return callContent({ ...params, scenarioId, scenario }, ContentMethod.RUN_SCENARIO);
  },
  [BridgeMethod.GET_SCENARIO_RUN]: (params) => callContent(params, ContentMethod.GET_SCENARIO_RUN),
  [BridgeMethod.GET_LIVE_WATCH_PATTERNS]: getLiveWatchPatterns,
};

export function handleBridgeRequest(method: BridgeMethod, params: BridgeParams): Promise<unknown> {
  return HANDLERS[method](params);
}
