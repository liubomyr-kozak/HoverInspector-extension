// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { MCP_BRIDGE_PROTOCOL } from "../../entrypoints/core/mcp/protocol";
import { BridgeMethod } from "../../entrypoints/core/mcp/types";
import { ExtensionBridge, isAllowedOrigin, NOT_CONNECTED_HINT } from "../extensionBridge";

const EXTENSION_ORIGIN = "chrome-extension://abcdefghijklmnop";
let port = 27345;
const bridges: ExtensionBridge[] = [];
const sockets: WebSocket[] = [];

async function startBridge(options: { extensionId?: string; connectWaitMs?: number } = {}) {
  port += 1;
  const bridge = new ExtensionBridge({ port, connectWaitMs: 200, requestTimeoutMs: 1000, ...options });
  bridges.push(bridge);
  await bridge.start();
  return bridge;
}

/** A stand-in for the extension: answers every request with the method name and params */
function connectExtension(origin = EXTENSION_ORIGIN, protocol = MCP_BRIDGE_PROTOCOL) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
  sockets.push(socket);
  socket.on("open", () => socket.send(JSON.stringify({ type: "hello", protocol, extensionVersion: "9.9.9" })));
  socket.on("message", (data) => {
    const request = JSON.parse(data.toString());
    socket.send(JSON.stringify({ type: "response", id: request.id, ok: true, result: { echo: request.method, params: request.params } }));
  });
  return socket;
}

const closed = (socket: WebSocket) => new Promise<number>((resolve) => socket.on("close", (code) => resolve(code)));

afterEach(async () => {
  sockets.splice(0).forEach((socket) => socket.terminate());
  await Promise.all(bridges.splice(0).map((bridge) => bridge.close()));
});

describe("isAllowedOrigin", () => {
  it("accepts extension origins and refuses web pages", () => {
    expect(isAllowedOrigin(EXTENSION_ORIGIN)).toBe(true);
    expect(isAllowedOrigin("moz-extension://1234")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(false);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
  });

  it("accepts only the pinned extension id when one is set", () => {
    expect(isAllowedOrigin(EXTENSION_ORIGIN, "abcdefghijklmnop")).toBe(true);
    expect(isAllowedOrigin("chrome-extension://other", "abcdefghijklmnop")).toBe(false);
  });
});

describe("ExtensionBridge", () => {
  it("forwards a call to the connected extension and returns its result", async () => {
    const bridge = await startBridge({ connectWaitMs: 2000 });
    connectExtension();
    const result = await bridge.call(BridgeMethod.LIST_TABS, { a: 1 });
    expect(result).toEqual({ echo: "list_tabs", params: { a: 1 } });
    expect(bridge.extensionVersion).toBe("9.9.9");
  });

  it("explains how to connect when no extension shows up", async () => {
    const bridge = await startBridge();
    await expect(bridge.call(BridgeMethod.STATUS, {})).rejects.toThrow(NOT_CONNECTED_HINT);
  });

  it("refuses a web page posing as the extension", async () => {
    const bridge = await startBridge();
    const socket = connectExtension("https://evil.example");
    await new Promise((resolve) => socket.on("error", resolve));
    expect(bridge.connected).toBe(false);
  });

  it("closes a connection that speaks another protocol version", async () => {
    const bridge = await startBridge();
    const socket = connectExtension(EXTENSION_ORIGIN, "hover-inspector-mcp/0");
    expect(await closed(socket)).toBe(1008);
    expect(bridge.connected).toBe(false);
  });

  it("returns the extension's error message", async () => {
    const bridge = await startBridge({ connectWaitMs: 2000 });
    const socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin: EXTENSION_ORIGIN });
    sockets.push(socket);
    socket.on("open", () => socket.send(JSON.stringify({ type: "hello", protocol: MCP_BRIDGE_PROTOCOL, extensionVersion: "1" })));
    socket.on("message", (data) => {
      const request = JSON.parse(data.toString());
      socket.send(JSON.stringify({ type: "response", id: request.id, ok: false, error: "No scenario with id" }));
    });
    await expect(bridge.call(BridgeMethod.GET_SCENARIO, { id: "sc_x" })).rejects.toThrow("No scenario with id");
  });

  it("reports a taken port on every call instead of crashing", async () => {
    const first = await startBridge();
    const second = new ExtensionBridge({ port: first.port });
    bridges.push(second);
    await second.start();
    expect(second.error).toMatch(/already in use/);
    await expect(second.call(BridgeMethod.STATUS, {})).rejects.toThrow(/already in use/);
  });
});
