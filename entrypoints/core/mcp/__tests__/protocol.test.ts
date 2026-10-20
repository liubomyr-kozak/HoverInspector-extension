import { describe, expect, it } from "vitest";

import {
  isBridgeRequest,
  isBridgeResponse,
  isContentCall,
  MCP_BRIDGE_DEFAULT_PORT,
  normalizeBridgeSettings,
  normalizeBridgeStatus,
  parseFrame,
} from "../protocol";
import { McpBridgeState } from "../types";

describe("bridge message guards", () => {
  it("accepts a well-formed request for a known method", () => {
    expect(isBridgeRequest({ type: "request", id: "1", method: "list_tabs", params: {} })).toBe(true);
  });

  it("rejects unknown methods, missing ids and non-object params", () => {
    expect(isBridgeRequest({ type: "request", id: "1", method: "eval", params: {} })).toBe(false);
    expect(isBridgeRequest({ type: "request", id: "", method: "list_tabs", params: {} })).toBe(false);
    expect(isBridgeRequest({ type: "request", id: "1", method: "list_tabs", params: [] })).toBe(false);
    expect(isBridgeRequest(null)).toBe(false);
  });

  it("tells responses apart by ok", () => {
    expect(isBridgeResponse({ type: "response", id: "1", ok: true, result: null })).toBe(true);
    expect(isBridgeResponse({ type: "response", id: "1", ok: false, error: "x" })).toBe(true);
    expect(isBridgeResponse({ type: "response", id: "1", ok: false })).toBe(false);
    expect(isBridgeResponse({ type: "response", id: "1", ok: true })).toBe(false);
  });

  it("only forwards page methods to the content script", () => {
    expect(isContentCall({ method: "audit_design", params: {} })).toBe(true);
    expect(isContentCall({ method: "save_scenario", params: {} })).toBe(false);
  });

  it("parses JSON frames and ignores anything else", () => {
    expect(parseFrame('{"type":"ping"}')).toEqual({ type: "ping" });
    expect(parseFrame("not json")).toBeUndefined();
  });
});

describe("normalizeBridgeSettings", () => {
  it("is off on the default port when nothing is stored", () => {
    expect(normalizeBridgeSettings(undefined)).toEqual({ enabled: false, port: MCP_BRIDGE_DEFAULT_PORT });
  });

  it("keeps a valid port and falls back for privileged or broken ones", () => {
    expect(normalizeBridgeSettings({ enabled: true, port: 18000 })).toEqual({ enabled: true, port: 18000 });
    expect(normalizeBridgeSettings({ enabled: "yes", port: 80 })).toEqual({ enabled: false, port: MCP_BRIDGE_DEFAULT_PORT });
    expect(normalizeBridgeSettings({ enabled: true, port: 17345.5 }).port).toBe(MCP_BRIDGE_DEFAULT_PORT);
  });

  it("reads an unknown status as off", () => {
    expect(normalizeBridgeStatus({ state: "exploded" }).state).toBe(McpBridgeState.OFF);
    expect(normalizeBridgeStatus({ state: "connected", port: 18000, updatedAt: 5 })).toEqual({
      state: McpBridgeState.CONNECTED,
      port: 18000,
      updatedAt: 5,
    });
  });
});
