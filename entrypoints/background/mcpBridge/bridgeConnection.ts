import { browser } from "wxt/browser";

import {
  errorMessage,
  isBridgeRequest,
  MCP_BRIDGE_MAX_MESSAGE_BYTES,
  MCP_BRIDGE_PING_MS,
  MCP_BRIDGE_PROTOCOL,
  MCP_BRIDGE_SETTINGS_KEY,
  MCP_BRIDGE_STATUS_KEY,
  normalizeBridgeSettings,
  parseFrame,
} from "@entrypoints/core/mcp/protocol";
import {
  McpBridgeState,
  type BridgeRequest,
  type ExtensionToServerMessage,
  type McpBridgeSettings,
  type McpBridgeStatus,
} from "@entrypoints/core/mcp/types";

import { handleBridgeRequest } from "./handlers";

/**
 * The extension's end of the MCP bridge. The MCP server (mcp-server/, started by the agent's MCP client)
 * listens on 127.0.0.1; while the user has the bridge on, the service worker connects to it, answers
 * its requests and reconnects when the server restarts. Off by default: nothing listens or connects
 * until the user turns it on in the toolbar menu's Settings.
 */

const RECONNECT_ALARM = "hover-inspector-mcp-bridge";
/** chrome.alarms' minimum period; wakes a stopped service worker to look for the server again */
const RECONNECT_ALARM_MINUTES = 0.5;
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10_000];

let settings: McpBridgeSettings = normalizeBridgeSettings(undefined);
let socket: WebSocket | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryIndex = 0;
let lastState: McpBridgeState | null = null;

function writeStatus(state: McpBridgeState) {
  if (state === lastState) return;
  lastState = state;
  const status: McpBridgeStatus = { state, port: settings.port, updatedAt: Date.now() };
  browser.storage.local.set({ [MCP_BRIDGE_STATUS_KEY]: status }).catch(() => undefined);
}

function send(message: ExtensionToServerMessage) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

async function answer(request: BridgeRequest) {
  try {
    const result = await handleBridgeRequest(request.method, request.params);
    send({ type: "response", id: request.id, ok: true, result });
  } catch (error) {
    send({ type: "response", id: request.id, ok: false, error: errorMessage(error) });
  }
}

function onFrame(event: MessageEvent) {
  if (typeof event.data !== "string" || event.data.length > MCP_BRIDGE_MAX_MESSAGE_BYTES) return;
  const message = parseFrame(event.data);
  if (isBridgeRequest(message)) {
    void answer(message);
  } else if (typeof message === "object" && message !== null && "id" in message && typeof message.id === "string") {
    send({ type: "response", id: message.id, ok: false, error: "Unknown request" });
  }
}

function stopTimers() {
  if (pingTimer) clearInterval(pingTimer);
  if (retryTimer) clearTimeout(retryTimer);
  pingTimer = null;
  retryTimer = null;
}

function disconnect() {
  stopTimers();
  const current = socket;
  socket = null;
  current?.close();
}

function scheduleRetry() {
  if (!settings.enabled || retryTimer) return;
  const delay = RETRY_DELAYS_MS[Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)];
  retryIndex += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, delay);
}

function connect() {
  if (!settings.enabled || socket) return;
  writeStatus(McpBridgeState.WAITING);

  // Loopback only: the server never listens on another interface and the extension never connects to one
  const current = new WebSocket(`ws://127.0.0.1:${settings.port}`);
  socket = current;

  current.addEventListener("open", () => {
    if (socket !== current) return;
    retryIndex = 0;
    send({ type: "hello", protocol: MCP_BRIDGE_PROTOCOL, extensionVersion: browser.runtime.getManifest().version });
    // Socket traffic keeps the MV3 service worker running while an agent is connected
    pingTimer = setInterval(() => send({ type: "ping" }), MCP_BRIDGE_PING_MS);
    writeStatus(McpBridgeState.CONNECTED);
  });
  current.addEventListener("message", onFrame);
  // A failed connection fires "error" and then "close"; the retry starts from "close"
  current.addEventListener("close", () => {
    if (socket !== current) return;
    socket = null;
    stopTimers();
    if (!settings.enabled) return;
    writeStatus(McpBridgeState.WAITING);
    scheduleRetry();
  });
}

async function applySettings(next: McpBridgeSettings) {
  const portChanged = next.port !== settings.port;
  settings = next;
  if (!settings.enabled) {
    disconnect();
    writeStatus(McpBridgeState.OFF);
    await browser.alarms.clear(RECONNECT_ALARM);
    return;
  }
  if (portChanged) disconnect();
  retryIndex = 0;
  await browser.alarms.create(RECONNECT_ALARM, { periodInMinutes: RECONNECT_ALARM_MINUTES });
  connect();
}

/** Call once from the background entrypoint */
export function registerMcpBridge() {
  browser.storage.local
    .get(MCP_BRIDGE_SETTINGS_KEY)
    .then((stored) => applySettings(normalizeBridgeSettings(stored[MCP_BRIDGE_SETTINGS_KEY])))
    .catch((error) => console.error("[mcp bridge] Failed to read the settings", error));

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[MCP_BRIDGE_SETTINGS_KEY]) return;
    applySettings(normalizeBridgeSettings(changes[MCP_BRIDGE_SETTINGS_KEY].newValue)).catch((error) =>
      console.error("[mcp bridge] Failed to apply the settings", error),
    );
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== RECONNECT_ALARM || !settings.enabled || socket) return;
    retryIndex = 0;
    connect();
  });
}
