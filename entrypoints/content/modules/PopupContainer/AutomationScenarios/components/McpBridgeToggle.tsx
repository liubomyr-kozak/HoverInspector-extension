import React, { useId, useState } from "react";
import styled from "styled-components";
import { InputNumber, Switch } from "antd";
import { IconLock, IconPlugConnected } from "@tabler/icons-react";

import { tokens } from "@entrypoints/shared/styles/tokens";
import { McpBridgeState } from "@entrypoints/core/mcp/types";
import { isValidPort } from "@entrypoints/core/mcp/protocol";

import { useMcpBridge } from "../hooks/useMcpBridge";

const Box = styled.div`
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.surfaceMuted};
  padding: 10px 12px;
`;

const StatusDot = styled.span<{ $connected: boolean }>`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $connected }) => ($connected ? tokens.color.success : tokens.color.warning)};
`;

/**
 * Turns the MCP bridge on or off: AI agents (Claude Code, Cursor...) running the Hover Inspector MCP server
 * on this computer can then read palettes, snapshots and scenarios and use the page tools.
 */
export const McpBridgeToggle: React.FC = () => {
  const { settings, status, update } = useMcpBridge();
  const [portDraft, setPortDraft] = useState<number | null>(null);
  const labelId = useId();
  const portId = useId();
  const connected = settings.enabled && status.state === McpBridgeState.CONNECTED;

  const commitPort = () => {
    if (portDraft !== null && isValidPort(portDraft) && portDraft !== settings.port) {
      update({ port: portDraft }).catch((error) => console.error("Failed to save the MCP bridge port", error));
    }
    setPortDraft(null);
  };

  return (
    <Box>
      <div className="flex items-center gap-2">
        <IconPlugConnected size={16} className="flex-none text-gray-600" aria-hidden="true" />
        <span id={labelId} className="flex-1 font-medium text-gray-800">
          MCP bridge for AI agents
        </span>
        <Switch
          size="small"
          checked={settings.enabled}
          onChange={(enabled) =>
            update({ enabled }).catch((error) => console.error("Failed to save the MCP bridge setting", error))
          }
          aria-labelledby={labelId}
        />
      </div>
      <p className="m-0 mt-1 text-xs text-gray-600">
        Lets an AI agent on this computer use Hover Inspector through the MCP server: read the design palette and
        snapshots, compare snapshots, take screenshots, and list, save and run scenarios. Off by default.
      </p>

      {settings.enabled && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600">
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

      <p className="m-0 mt-2 flex gap-1 text-xs text-gray-600">
        <IconLock size={14} className="flex-none mt-px" aria-hidden="true" />
        <span>
          The extension only connects to 127.0.0.1, and the server only accepts the extension. While it is on, the
          agent can open the panel in a tab and read that page.
        </span>
      </p>
    </Box>
  );
};
