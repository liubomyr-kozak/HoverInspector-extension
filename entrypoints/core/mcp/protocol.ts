import {
  BridgeMethod,
  ContentMethod,
  McpBridgeState,
  type BridgeHello,
  type BridgeParams,
  type BridgeRequest,
  type BridgeResponse,
  type ContentCall,
  type ExtensionToServerMessage,
  type McpBridgeSettings,
  type McpBridgeStatus,
} from "./types";

/** Both sides refuse to talk to a peer that speaks another version */
export const MCP_BRIDGE_PROTOCOL = "hover-inspector-mcp/1";
export const MCP_BRIDGE_DEFAULT_PORT = 17345;
export const MCP_BRIDGE_SETTINGS_KEY = "mcpBridge";
export const MCP_BRIDGE_STATUS_KEY = "mcpBridgeStatus";
/** Below Chrome's 30 s idle limit, so an open bridge keeps the service worker running */
export const MCP_BRIDGE_PING_MS = 20_000;
/** Larger messages are refused instead of parsed (a full-page snapshot is a few MB) */
export const MCP_BRIDGE_MAX_MESSAGE_BYTES = 64 * 1024 * 1024;

const BRIDGE_METHODS = new Set<string>(Object.values(BridgeMethod));
const CONTENT_METHODS = new Set<string>(Object.values(ContentMethod));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isBridgeParams = (value: unknown): value is BridgeParams => isRecord(value);

export function isBridgeRequest(value: unknown): value is BridgeRequest {
  return (
    isRecord(value) &&
    value.type === "request" &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.method === "string" &&
    BRIDGE_METHODS.has(value.method) &&
    isRecord(value.params)
  );
}

export function isBridgeResponse(value: unknown): value is BridgeResponse {
  if (!isRecord(value) || value.type !== "response" || typeof value.id !== "string") return false;
  return value.ok === true ? "result" in value : value.ok === false && typeof value.error === "string";
}

export function isBridgeHello(value: unknown): value is BridgeHello {
  return (
    isRecord(value) &&
    value.type === "hello" &&
    typeof value.protocol === "string" &&
    typeof value.extensionVersion === "string"
  );
}

export function isExtensionMessage(value: unknown): value is ExtensionToServerMessage {
  return isBridgeHello(value) || isBridgeResponse(value) || (isRecord(value) && value.type === "ping");
}

export function isContentCall(value: unknown): value is ContentCall {
  return (
    isRecord(value) && typeof value.method === "string" && CONTENT_METHODS.has(value.method) && isRecord(value.params)
  );
}

/** Parses one socket frame; anything that is not JSON comes back as undefined */
export function parseFrame(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export const isValidPort = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1024 && value <= 65535;

/** The bridge is off until the user turns it on; a stored value of the wrong shape counts as off */
export function normalizeBridgeSettings(raw: unknown): McpBridgeSettings {
  if (!isRecord(raw)) return { enabled: false, port: MCP_BRIDGE_DEFAULT_PORT };
  return {
    enabled: raw.enabled === true,
    port: isValidPort(raw.port) ? raw.port : MCP_BRIDGE_DEFAULT_PORT,
  };
}

/** Readable message from anything thrown */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

export function normalizeBridgeStatus(raw: unknown): McpBridgeStatus {
  const states = Object.values(McpBridgeState) as string[];
  if (!isRecord(raw) || typeof raw.state !== "string" || !states.includes(raw.state)) {
    return { state: McpBridgeState.OFF, port: MCP_BRIDGE_DEFAULT_PORT, updatedAt: 0 };
  }
  return {
    state: raw.state as McpBridgeState,
    port: isValidPort(raw.port) ? raw.port : MCP_BRIDGE_DEFAULT_PORT,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}
