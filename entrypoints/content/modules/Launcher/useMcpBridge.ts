import { useCallback, useEffect, useState } from "react";
import { browser } from "wxt/browser";

import {
  MCP_BRIDGE_SETTINGS_KEY,
  MCP_BRIDGE_STATUS_KEY,
  normalizeBridgeSettings,
  normalizeBridgeStatus,
} from "@entrypoints/core/mcp/protocol";
import type { McpBridgeSettings, McpBridgeStatus } from "@entrypoints/core/mcp/types";

/**
 * The MCP bridge settings and the connection state the background reports, kept in sync with
 * browser.storage.local so every open panel shows the same state.
 */
export function useMcpBridge() {
  const [settings, setSettings] = useState<McpBridgeSettings>(() => normalizeBridgeSettings(undefined));
  const [status, setStatus] = useState<McpBridgeStatus>(() => normalizeBridgeStatus(undefined));

  useEffect(() => {
    let active = true;
    browser.storage.local
      .get([MCP_BRIDGE_SETTINGS_KEY, MCP_BRIDGE_STATUS_KEY])
      .then((stored) => {
        if (!active) return;
        setSettings(normalizeBridgeSettings(stored[MCP_BRIDGE_SETTINGS_KEY]));
        setStatus(normalizeBridgeStatus(stored[MCP_BRIDGE_STATUS_KEY]));
      })
      .catch((error) => console.error("Failed to read the MCP bridge settings", error));

    const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area !== "local") return;
      if (changes[MCP_BRIDGE_SETTINGS_KEY]) setSettings(normalizeBridgeSettings(changes[MCP_BRIDGE_SETTINGS_KEY].newValue));
      if (changes[MCP_BRIDGE_STATUS_KEY]) setStatus(normalizeBridgeStatus(changes[MCP_BRIDGE_STATUS_KEY].newValue));
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => {
      active = false;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const update = useCallback(
    (change: Partial<McpBridgeSettings>) => {
      const next = normalizeBridgeSettings({ ...settings, ...change });
      setSettings(next);
      return browser.storage.local.set({ [MCP_BRIDGE_SETTINGS_KEY]: next });
    },
    [settings],
  );

  return { settings, status, update };
}
