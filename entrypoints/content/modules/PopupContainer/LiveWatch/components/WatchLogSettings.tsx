import React, { useId, useState } from "react";
import { Button, Popover, Segmented, Select } from "antd";
import { IconDownload, IconLock, IconSettings, IconTrash } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { shadowBody } from "@entrypoints/shared/utils/shadowBody";
import { usePopoverFocus } from "@entrypoints/shared/utils/usePopoverFocus";
import { restoreDismissedPatterns, updateLiveWatchSettings, WATCH_LIMIT_OPTIONS } from "../store";
import { LiveWatchSettings, WatchLogMode } from "../types";

interface WatchLogSettingsProps {
  settings: LiveWatchSettings;
  hasEvents: boolean;
  /** A replay is running: the log can't be cleared under it */
  busy: boolean;
  onDownload: () => void;
  onClear: () => void;
}

/**
 * Everything about the log itself (view, size, export, clearing, what is kept), behind one settings button
 * in the header like the other tools, so the panel shows only the log and the actions for a selection
 */
export const WatchLogSettings: React.FC<WatchLogSettingsProps> = ({ settings, hasEvents, busy, onDownload, onClear }) => {
  const [open, setOpen] = useState(false);
  const focus = usePopoverFocus(open, setOpen);
  const viewId = useId();
  const keepId = useId();
  const hidden = settings.dismissedPatterns.length;

  const content = (
    <div
      ref={focus.contentRef}
      onBlur={focus.onContentBlur}
      role="dialog"
      aria-label="Log settings"
      className="flex w-[280px] flex-col gap-3 p-1 text-sm text-gray-800"
    >
      <div className="flex items-center justify-between gap-2">
        <span id={viewId}>View</span>
        <Segmented
          size="small"
          value={settings.mode}
          onChange={(mode) => updateLiveWatchSettings({ mode: mode as WatchLogMode })}
          options={[
            { value: WatchLogMode.SMART, label: "Smart" },
            { value: WatchLogMode.RAW, label: "Every event" },
          ]}
          aria-labelledby={viewId}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span id={keepId}>Keep the last</span>
        <Select
          size="small"
          value={settings.limit}
          onChange={(limit) => updateLiveWatchSettings({ limit })}
          options={WATCH_LIMIT_OPTIONS.map((value) => ({ value, label: `${value.toLocaleString()} actions` }))}
          getPopupContainer={shadowBody}
          aria-labelledby={keepId}
          popupMatchSelectWidth={false}
        />
      </div>
      <div className="flex flex-wrap gap-2 border-0 border-t border-solid border-gray-200 pt-3">
        <Button size="small" icon={<IconDownload size={14} />} disabled={!hasEvents} onClick={onDownload}>
          Download JSON
        </Button>
        <Button size="small" danger icon={<IconTrash size={14} />} disabled={!hasEvents || busy} onClick={onClear}>
          Clear log
        </Button>
      </div>
      {hidden > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {hidden} {hidden === 1 ? "repeat" : "repeats"} hidden
          </span>
          <Button type="link" size="small" className="px-0" onClick={restoreDismissedPatterns}>
            Show all again
          </Button>
        </div>
      )}
      <p className="m-0 flex gap-1 text-xs leading-snug text-gray-500">
        <IconLock size={14} className="mt-px flex-none" aria-hidden="true" />
        <span>
          Kept only in this browser's extension storage, never sent anywhere. Typed text stays in memory until the
          browser closes. Password and card fields are never read.
        </span>
      </p>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight" open={open} onOpenChange={setOpen}>
      <IconButton
        ref={focus.triggerRef as React.Ref<HTMLButtonElement>}
        label="Log settings"
        size={28}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <IconSettings size={16} aria-hidden="true" />
      </IconButton>
    </Popover>
  );
};
