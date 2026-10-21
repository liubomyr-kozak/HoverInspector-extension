import React, { useId, useState } from "react";
import styled from "styled-components";
import { InputNumber, Switch } from "antd";
import { IconPlugConnected } from "@tabler/icons-react";

import { tokens } from "@entrypoints/shared/styles/tokens";
import { McpBridgeState } from "@entrypoints/core/mcp/types";
import { isValidPort } from "@entrypoints/core/mcp/protocol";

import { useMcpBridge } from "./useMcpBridge";

const StatusDot = styled.span<{ $connected: boolean }>`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $connected }) => ($connected ? tokens.color.success : tokens.color.warning)};
`;

/**
 * Extension-wide setting in the launcher menu: turns the MCP bridge on or off, so AI agents (Claude Code,
 * Codex, Cursor...) running the Hover Inspector MCP server on this computer can use the extension's tools.
 */
export const McpBridgeSetting: React.FC = () => {
  const { settings, status, update } = useMcpBridge();
  const [portDraft, setPortDraft] = useState<number | null>(null);
  const labelId = useId();
  const hintId = useId();
  const portId = useId();
  const connected = settings.enabled && status.state === McpBridgeState.CONNECTED;

  const commitPort = () => {
    if (portDraft !== null && isValidPort(portDraft) && portDraft !== settings.port) {
      update({ port: portDraft }).catch((error) => console.error("Failed to save the MCP bridge port", error));
    }
    setPortDraft(null);
  };

  return (
    <div className="px-1 py-1">
      <div className="flex items-center gap-2">
        <IconPlugConnected size={16} className="flex-none text-gray-600" aria-hidden="true" />
        <span id={labelId} className="flex-1 text-sm font-medium text-gray-800">
          MCP bridge for AI agents
        </span>
        <Switch
          size="small"
          checked={settings.enabled}
          onChange={(enabled) =>
            update({ enabled }).catch((error) => console.error("Failed to save the MCP bridge setting", error))
          }
          aria-labelledby={labelId}
          aria-describedby={hintId}
        />
      </div>
      {/* Under the label, not under the switch, and narrow: the menu is wide and a full-width line is hard to read */}
      <p id={hintId} className="m-0 mt-0.5 max-w-[52ch] pl-6 text-xs leading-snug text-gray-500">
        Lets AI agents on this computer use palettes, snapshots, screenshots and scenarios. Local only
        (127.0.0.1), off by default.
      </p>

      {settings.enabled && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 pl-6 text-xs text-gray-600">
          <span className="flex min-w-0 items-center gap-1" role="status">
            <StatusDot $connected={connected} aria-hidden="true" />
            {connected ? "Connected to the MCP server" : "Waiting for the MCP server to start"}
          </span>
          <label htmlFor={portId} className="flex items-center gap-1">
            Port
            <InputNumber
              id={portId}
              size="small"
              min={1024}
              max={65535}
              precision={0}
              controls={false}
              className="w-20"
              value={portDraft ?? settings.port}
              onChange={(value) => setPortDraft(typeof value === "number" ? value : null)}
              onBlur={commitPort}
              onPressEnter={commitPort}
            />
          </label>
        </div>
      )}
    </div>
  );
};
