import React, { useId } from "react";
import styled from "styled-components";
import { Button, Switch } from "antd";
import { IconEye, IconList, IconLock } from "@tabler/icons-react";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { restoreDismissedPatterns, setLiveWatchEnabled, updateWatchPanel, useLiveWatchSettings } from "../store";
import { clearWatchLog, useWatchLog } from "../useWatchLog";

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
  const { enabled, limit, panel, dismissedPatterns } = useLiveWatchSettings();
  const storedCount = useWatchLog().events.length;
  const labelId = useId();

  // Watching continues while the log is hidden: the log can be shown again from here
  const showLog = enabled && !panel.open && (
    <Button size="small" type="link" className="px-0" icon={<IconList size={14} />} onClick={() => updateWatchPanel({ open: true })}>
      Show the log
    </Button>
  );

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
        <p className="m-0 mt-1 text-xs text-gray-500">
          Logs your clicks, typing and pages, and suggests repeated steps. Data stays in this browser.
        </p>
        {showLog}
      </div>
    );
  }

  return (
    <Box>
      {toggleRow}
      <p className="m-0 mt-1 text-xs text-gray-600">
        Logs every click, typing, choice, key and page change in a panel you can move anywhere. Select steps in the
        log (Shift+click for a range, Ctrl/Cmd+click to add) to play them again or save them as a scenario. It also
        notices steps you repeat, offers to finish a scenario you started by hand and shows the scenarios that use a
        field you click. Off by default.
      </p>
      <p className="m-0 mt-2 flex gap-1 text-xs text-gray-600">
        <IconLock size={14} className="flex-none mt-px" aria-hidden="true" />
        <span>
          Only your last {limit.toLocaleString()} actions are kept, in this browser's extension storage. Nothing is
          sent anywhere. Typed text is kept in memory only and is gone when the browser closes, unless you save a
          scenario with it. Password and card fields are never read.
        </span>
      </p>
      {storedCount > 0 && (
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>{storedCount} actions stored</span>
          <Button type="link" size="small" className="px-0" onClick={() => clearWatchLog()}>
            Clear
          </Button>
        </div>
      )}
      {dismissedPatterns.length > 0 && (
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>
            {dismissedPatterns.length} {dismissedPatterns.length === 1 ? "suggestion" : "suggestions"} hidden
          </span>
          <Button type="link" size="small" className="px-0" onClick={restoreDismissedPatterns}>
            Show all again
          </Button>
        </div>
      )}
      {showLog}
    </Box>
  );
};
