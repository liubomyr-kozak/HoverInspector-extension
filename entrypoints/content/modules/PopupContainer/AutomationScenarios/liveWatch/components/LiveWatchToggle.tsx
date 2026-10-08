import React, { useId, useState } from "react";
import styled from "styled-components";
import { Button, Switch } from "antd";
import { IconEye, IconLock } from "@tabler/icons-react";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { clearWatchEvents, setLiveWatchEnabled, useLiveWatchSettings, useStoredWatchEventCount } from "../store";
import { WATCH_EVENT_LIMIT } from "../utils/patterns";
import { LiveWatchLog } from "./LiveWatchLog";

interface LiveWatchToggleProps {
  /** One row for the minimized Automation menu: the switch and a one-line hint */
  compact?: boolean;
}

const Box = styled.div`
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.surfaceMuted};
  padding: 10px 12px;
`;

/**
 * Turns live watching on or off, and says plainly what it keeps and where, so nobody has to guess
 */
export const LiveWatchToggle: React.FC<LiveWatchToggleProps> = ({ compact }) => {
  const { enabled } = useLiveWatchSettings();
  const storedCount = useStoredWatchEventCount();
  const labelId = useId();
  const [logOpen, setLogOpen] = useState(false);

  const toggleRow = (
    <div className="flex items-center gap-2">
      <IconEye size={16} className="flex-none text-gray-600" aria-hidden="true" />
      <span id={labelId} className="flex-1 font-medium text-gray-800">
        Live watching
      </span>
      <Switch size="small" checked={enabled} onChange={setLiveWatchEnabled} aria-labelledby={labelId} />
    </div>
  );

  if (compact) {
    return (
      <div className="py-1">
        {toggleRow}
        <p className="m-0 mt-1 text-xs text-gray-500">Suggests repeated steps as scenarios. Data stays in this browser.</p>
      </div>
    );
  }

  return (
    <Box>
      {toggleRow}
      <p className="m-0 mt-1 text-xs text-gray-600">
        Notices steps you repeat on a site and offers to replay them, do them step by step, or save them as a
        scenario. It also offers to finish a scenario you started by hand and shows the scenarios that use a field
        you click. Off by default.
      </p>
      <p className="m-0 mt-2 flex gap-1 text-xs text-gray-600">
        <IconLock size={14} className="flex-none mt-px" aria-hidden="true" />
        <span>
          Only your last {WATCH_EVENT_LIMIT} actions are kept, in this browser's extension storage. Nothing is sent
          anywhere. Typed text is not stored: it stays in memory for the open page, unless you save a scenario with it.
          Password and card fields are never read.
        </span>
      </p>
      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
        <span>{storedCount} actions stored</span>
        <Button type="link" size="small" className="px-0" aria-expanded={logOpen} onClick={() => setLogOpen(!logOpen)}>
          {logOpen ? "Hide log" : "Show log"}
        </Button>
        {storedCount > 0 && (
          <Button type="link" size="small" className="px-0" onClick={() => clearWatchEvents()}>
            Clear
          </Button>
        )}
      </div>
      {logOpen && <LiveWatchLog />}
    </Box>
  );
};
