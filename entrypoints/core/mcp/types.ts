/**
 * Messages between the Hover Inspector MCP server (a local Node process started by an AI agent's MCP
 * client) and the extension's background service worker. They travel as JSON over a WebSocket that the
 * extension opens to 127.0.0.1 while the bridge is turned on.
 */

/** Every operation the extension answers. MCP tool names are derived from these values. */
export enum BridgeMethod {
  STATUS = "status",
  LIST_TABS = "list_tabs",
  TAKE_SCREENSHOT = "take_screenshot",
  GET_PAGE_INFO = "get_page_info",
  AUDIT_DESIGN = "audit_design",
  GET_DESIGN_THEME = "get_design_theme",
  LIST_CSS_SNAPSHOTS = "list_css_snapshots",
  GET_CSS_SNAPSHOT = "get_css_snapshot",
  CAPTURE_CSS_SNAPSHOT = "capture_css_snapshot",
  COMPARE_CSS_SNAPSHOTS = "compare_css_snapshots",
  LIST_SCENARIOS = "list_scenarios",
  GET_SCENARIO = "get_scenario",
  SAVE_SCENARIO = "save_scenario",
  RUN_SCENARIO = "run_scenario",
  GET_SCENARIO_RUN = "get_scenario_run",
  GET_LIVE_WATCH_PATTERNS = "get_live_watch_patterns",
}

/** Operations that need the page itself, so the background forwards them to the content script */
export enum ContentMethod {
  GET_PAGE_INFO = "get_page_info",
  AUDIT_DESIGN = "audit_design",
  CAPTURE_CSS_SNAPSHOT = "capture_css_snapshot",
  RUN_SCENARIO = "run_scenario",
  GET_SCENARIO_RUN = "get_scenario_run",
}

export type BridgeParams = Record<string, unknown>;

/** Server -> extension */
export interface BridgeRequest {
  type: "request";
  id: string;
  method: BridgeMethod;
  params: BridgeParams;
}

export interface BridgeSuccess {
  type: "response";
  id: string;
  ok: true;
  result: unknown;
}

export interface BridgeFailure {
  type: "response";
  id: string;
  ok: false;
  error: string;
}

/** Extension -> server, the answer to one request */
export type BridgeResponse = BridgeSuccess | BridgeFailure;

/** Extension -> server, first message after the socket opens */
export interface BridgeHello {
  type: "hello";
  protocol: string;
  extensionVersion: string;
}

/** Extension -> server, keeps the service worker (and the socket) alive while the bridge is on */
export interface BridgePing {
  type: "ping";
}

export type ExtensionToServerMessage = BridgeHello | BridgeResponse | BridgePing;

/** What the content script receives from the background */
export interface ContentCall {
  method: ContentMethod;
  params: BridgeParams;
}

export type ContentCallResult = { ok: true; result: unknown } | { ok: false; error: string };

/** Saved in browser.storage.local under MCP_BRIDGE_SETTINGS_KEY */
export interface McpBridgeSettings {
  enabled: boolean;
  port: number;
}

export enum McpBridgeState {
  OFF = "off",
  /** Turned on, no MCP server is listening yet: the extension keeps retrying */
  WAITING = "waiting",
  CONNECTED = "connected",
}

/** Written by the background under MCP_BRIDGE_STATUS_KEY so the settings panel can show it */
export interface McpBridgeStatus {
  state: McpBridgeState;
  port: number;
  updatedAt: number;
}
