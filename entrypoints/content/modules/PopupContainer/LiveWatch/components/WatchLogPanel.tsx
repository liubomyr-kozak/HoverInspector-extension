import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button, Input } from "antd";
import {
  IconDeviceFloppy,
  IconListCheck,
  IconPlayerPlayFilled,
  IconPlayerSkipForward,
  IconPlayerStopFilled,
  IconRefresh,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { ScenarioStatus, selectStatus } from "@entrypoints/content/store/automation/automation.slice";
import { saveScenarioWatcher } from "@entrypoints/content/store/automation/automation.saga.action";
import { ResizableModal } from "@entrypoints/shared/components/FloatingModal/ResizableModal";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { EmptyState } from "@entrypoints/shared/components/EmptyState";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { Scenario } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import { LIVE_WATCH } from "@entrypoints/content/modules/Launcher/LauncherIcons";
import { setLiveWatchEnabled, updateWatchPanel } from "../store";
import { DetectedPattern, LiveWatchSettings, WatchEvent, WatchLogItem, WatchLogMode } from "../types";
import { ReplayPhase, useLogReplay } from "../useLogReplay";
import { clearWatchLog, deleteWatchEvents, WatchLogSnapshot } from "../useWatchLog";
import { itemsToSteps, logItems, sourceIdsOf } from "../utils/smartLog";
import { EMPTY_SELECTION, ListSelection, moveFocus, pruneSelection, selectAll, selectedInOrder, selectRow } from "../utils/selection";
import { describeEventParts } from "../utils/patterns";
import { watchLogExport, watchLogFileName } from "../utils/exportLog";
import { RepeatsStrip } from "./RepeatsStrip";
import { TargetHighlight } from "./TargetHighlight";
import { WatchLogSettings } from "./WatchLogSettings";
import { WatchLogRow } from "./WatchLogRow";
import { Chip, FooterBar, ListViewport, LiveDot, Progress, ReplayBar, ROW_HEIGHT, StatusLine } from "./WatchLogPanel.styled";

interface WatchLogPanelProps {
  settings: LiveWatchSettings;
  log: WatchLogSnapshot;
  /** Whether this tab is being watched right now (not paused by recording or playback) */
  watching: boolean;
  /** Chains of steps the user repeats, offered under the list */
  patterns: DetectedPattern[];
  /** Docked under the list: the suggestion card, so live watching shows one window */
  children?: React.ReactNode;
}

/** Rows rendered above and below the visible ones, so fast scrolling shows no gaps */
const OVERSCAN = 8;

const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

const buttonIcon = (Icon: React.ComponentType<{ size?: number }>) => (
  <span className="flex items-center">
    <Icon size={14} />
  </span>
);

const scenarioTitle = (items: WatchLogItem[]) => {
  const labels = items.map((item) => item.event.label).filter(Boolean);
  const shown = labels.slice(0, 3).join(", ") + (labels.length > 3 ? "…" : "");
  return [shown || "Watched steps", window.location.hostname].filter(Boolean).join(" · ");
};

/**
 * The watch log: every action live watching noted, in a panel the user can drag and resize anywhere.
 * Smart view (merged, what a scenario needs) or raw view (every event). Rows are selected like files
 * (click, Shift+click, Ctrl/Cmd+click, arrows, Ctrl/Cmd+A) and the selection can be played right away,
 * across page loads, or saved as a scenario.
 */
export const WatchLogPanel: React.FC<WatchLogPanelProps> = ({ settings, log, watching, patterns, children }) => {
  const dispatch = useDispatch();
  const status = useSelector(selectStatus);
  const { replay, play, stop, provideValue, retry, skip, dismiss } = useLogReplay();

  const events = useMemo(() => log.events.slice(-settings.limit), [log.events, settings.limit]);
  const items = useMemo(() => logItems(events, settings.mode), [events, settings.mode]);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const [selection, setSelection] = useState<ListSelection>(EMPTY_SELECTION);
  const [hovered, setHovered] = useState<WatchEvent | null>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => setSelection((current) => pruneSelection(current, ids)), [ids]);

  const selected = useMemo(() => selectedInOrder(items, selection), [items, selection]);

  // "Review": the list shows only the selected rows, in the order they will play
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    if (!selected.length) setReviewing(false);
  }, [selected.length]);
  const shownItems = reviewing ? selected : items;
  const shownIds = useMemo(() => shownItems.map((item) => item.id), [shownItems]);

  // ---- windowed list

  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Follow new rows while the list is scrolled to the end
  const followRef = useRef(true);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => setViewportHeight(viewport.clientHeight));
    observer.observe(viewport);
    setViewportHeight(viewport.clientHeight);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport && followRef.current) viewport.scrollTop = viewport.scrollHeight;
  }, [shownItems.length, viewportHeight]);

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(shownItems.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);

  const scrollToRow = (id: string) => {
    const viewport = viewportRef.current;
    const index = shownIds.indexOf(id);
    if (!viewport || index < 0) return;
    const top = index * ROW_HEIGHT;
    if (top < viewport.scrollTop) viewport.scrollTop = top;
    else if (top + ROW_HEIGHT > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = top + ROW_HEIGHT - viewport.clientHeight;
  };

  const playingRowId = replay && replay.phase !== ReplayPhase.DONE ? replay.rowIds[replay.index] : undefined;
  useEffect(() => {
    if (playingRowId) scrollToRow(playingRowId);
  }, [playingRowId]);

  // ---- repeated chains: their latest round as log rows

  const rowOfEvent = useMemo(() => {
    const rows = new Map<string, string>();
    items.forEach((item) => item.sourceIds.forEach((id) => rows.set(id, item.id)));
    return rows;
  }, [items]);

  const patternRows = (pattern: DetectedPattern) => {
    const rows: string[] = [];
    pattern.events.forEach((event) => {
      const row = rowOfEvent.get(event.id);
      if (row && !rows.includes(row)) rows.push(row);
    });
    return rows;
  };

  const selectPattern = (pattern: DetectedPattern) => {
    const rows = patternRows(pattern);
    if (!rows.length) return;
    setSelection({ selected: new Set(rows), anchor: rows[0], focus: rows[rows.length - 1] });
    followRef.current = false;
    scrollToRow(rows[0]);
  };

  // Only chains still in the log the panel shows
  const shownPatterns = useMemo(() => patterns.filter((pattern) => patternRows(pattern).length > 0), [patterns, rowOfEvent]);

  // ---- actions

  const downloadLog = () => {
    const json = JSON.stringify(watchLogExport(log.events, log.values), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = watchLogFileName();
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const busy = !!replay && replay.phase !== ReplayPhase.DONE;

  const playSelected = () => {
    if (!selected.length) return;
    const rowIds: string[] = [];
    const steps = selected.flatMap((item) => {
      const itemSteps = itemsToSteps([item], log.values);
      itemSteps.forEach(() => rowIds.push(item.id));
      return itemSteps;
    });
    if (!steps.length) {
      toast.info("Nothing to play in the selected rows");
      return;
    }
    play(steps, rowIds);
  };

  const saveSelected = () => {
    if (!selected.length) return;
    if (status !== ScenarioStatus.IDLE) {
      toast.error("Finish recording or editing the current scenario first");
      return;
    }
    const scenario: Scenario = {
      title: scenarioTitle(selected),
      description: "Saved from live watching",
      tags: [],
      category: "",
      repeat: 1,
      data: itemsToSteps(selected, log.values),
    };
    dispatch(saveScenarioWatcher.getPayload({ scenario }));
    toast.success(`Saved ${plural(scenario.data.length, "step")} as a scenario`);
  };

  const deleteSelected = () => {
    if (!selected.length) return;
    deleteWatchEvents(sourceIdsOf(selected));
    setSelection(EMPTY_SELECTION);
  };

  // Closing the tool stops watching; the log stays for the next time
  const close = () => {
    stop();
    setLiveWatchEnabled(false);
  };

  const onRowClick = (event: React.MouseEvent, id: string) => {
    viewportRef.current?.focus();
    setSelection((current) => selectRow(current, shownIds, id, { range: event.shiftKey, toggle: event.ctrlKey || event.metaKey }));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const toggle = event.ctrlKey || event.metaKey;
    let next: ListSelection | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      next = moveFocus(selection, shownIds, event.key === "ArrowDown" ? 1 : -1, event.shiftKey);
    } else if (event.key === "Home" || event.key === "End") {
      next = moveFocus(selection, shownIds, event.key === "End" ? shownIds.length : -shownIds.length, event.shiftKey);
    } else if (toggle && event.key.toLowerCase() === "a") {
      next = selectAll(shownIds);
    } else if (event.key === "Escape" && selection.selected.size) {
      // Handled here, so the global Esc shortcut doesn't switch the extension off
      event.stopPropagation();
      next = EMPTY_SELECTION;
    } else if (event.key === " " && selection.focus) {
      next = selectRow(selection, shownIds, selection.focus, { toggle: true });
    } else if (event.key === "Enter") {
      playSelected();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      deleteSelected();
    } else {
      return;
    }
    event.preventDefault();
    if (next) {
      setSelection(next);
      if (next.focus) scrollToRow(next.focus);
    }
  };

  // Typing step without text: ask for it
  useEffect(() => {
    if (replay?.phase === ReplayPhase.WAITING_VALUE) setTyped("");
  }, [replay?.phase, replay?.index]);

  const title = (
    <FeatureTitle className="flex-1 min-w-0">
      <FeatureIcon icon={LIVE_WATCH.icon} size={18} />
      <FeatureTitleText title={LIVE_WATCH.title}>{LIVE_WATCH.title}</FeatureTitleText>
      <LiveDot $on={watching} role="img" aria-label={watching ? "Watching this tab" : "Paused"} title={watching ? "Watching this tab" : "Paused"} />
      <Chip $tone="muted" className="ml-auto normal-case">
        {plural(settings.mode === WatchLogMode.RAW ? events.length : items.length, settings.mode === WatchLogMode.RAW ? "event" : "step")}
      </Chip>
      <WatchLogSettings settings={settings} hasEvents={log.events.length > 0} busy={busy} onDownload={downloadLog} onClear={() => clearWatchLog()} />
    </FeatureTitle>
  );

  const current = replay ? replay.steps[replay.index] : undefined;
  const currentItem = playingRowId ? items.find((item) => item.id === playingRowId) : undefined;

  // Actions only for a selection; without one the footer says how to make one
  const footer = selected.length ? (
    <FooterBar>
      <span className="mr-auto whitespace-nowrap text-xs font-medium text-gray-600">{selected.length.toLocaleString()} selected</span>
      <IconButton
        label={reviewing ? "Show the whole log" : "Review the selected steps in play order"}
        size={26}
        active={reviewing}
        onClick={() => setReviewing(!reviewing)}
      >
        <IconListCheck size={16} aria-hidden="true" />
      </IconButton>
      <IconButton label="Delete the selected steps" size={26} disabled={busy} onClick={deleteSelected}>
        <IconTrash size={16} aria-hidden="true" />
      </IconButton>
      <Button
        size="small"
        icon={buttonIcon(IconDeviceFloppy)}
        disabled={busy}
        onClick={saveSelected}
        title="Save as scenario"
        aria-label="Save as scenario"
      >
        Save
      </Button>
      <Button size="small" type="primary" icon={buttonIcon(IconPlayerPlayFilled)} disabled={busy} onClick={playSelected}>
        Play
      </Button>
    </FooterBar>
  ) : (
    items.length > 0 && (
      <FooterBar>
        <span className="text-xs text-gray-500">Select steps to play or save them · Shift+click for a range</span>
      </FooterBar>
    )
  );

  return (
    <ResizableModal
      isOpen
      position="fixed"
      title={title}
      footer={footer}
      onClose={close}
      initialPosition={{ x: settings.panel.x, y: settings.panel.y }}
      initialSize={{ width: settings.panel.width, height: settings.panel.height }}
      onPositionChange={(x, y) => updateWatchPanel({ x, y })}
      onSizeChange={(width, height) => updateWatchPanel({ width, height })}
      minWidth={300}
      minHeight={260}
    >
      {hovered && hovered.origin === window.location.origin && hovered.xpath && (
        <TargetHighlight xpath={hovered.xpath} alternativeXpaths={hovered.alternativeXpaths} />
      )}
      {reviewing && (
        <StatusLine role="status">
          <IconListCheck size={14} className="flex-none text-blue-600" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Selected steps, in play order</span>
          <Button size="small" type="link" className="px-0" onClick={() => setReviewing(false)}>
            Show all
          </Button>
        </StatusLine>
      )}
      {!watching && (
        <StatusLine role="status">
          <LiveDot $on={false} aria-hidden="true" />
          <span className="min-w-0 truncate">Paused while a scenario records or plays</span>
        </StatusLine>
      )}
      <ListViewport
        ref={viewportRef}
        role="listbox"
        aria-multiselectable="true"
        aria-label="Watched actions"
        aria-activedescendant={selection.focus ? `hi-watch-row-${selection.focus}` : undefined}
        tabIndex={0}
        style={{ "--row-number-digits": String(shownItems.length).length } as React.CSSProperties}
        onKeyDown={onKeyDown}
        onScroll={(event) => {
          const viewport = event.currentTarget;
          setScrollTop(viewport.scrollTop);
          followRef.current = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - ROW_HEIGHT;
        }}
        onMouseLeave={() => setHovered(null)}
      >
        {!items.length && log.loaded && (
          <EmptyState
            icon={<LIVE_WATCH.icon size={28} aria-hidden="true" />}
            title="Nothing watched yet"
            description="Click, type and move between pages: every action shows up here."
            className="py-8"
          />
        )}
        <div style={{ height: shownItems.length * ROW_HEIGHT }} aria-hidden={!shownItems.length}>
          {shownItems.slice(first, last).map((item, offset) => {
            const index = first + offset;
            return (
              <WatchLogRow
                key={item.id}
                item={item}
                number={index + 1}
                top={index * ROW_HEIGHT}
                selected={selection.selected.has(item.id)}
                focused={selection.focus === item.id}
                playing={item.id === playingRowId}
                onClick={onRowClick}
                onHover={setHovered}
              />
            );
          })}
        </div>
      </ListViewport>
      <RepeatsStrip patterns={shownPatterns} onSelect={selectPattern} rowCount={(pattern) => patternRows(pattern).length} />
      {children}
      {replay && (
        <ReplayBar role="status" aria-live="polite">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-medium text-gray-800">
              {replay.phase === ReplayPhase.DONE
                ? `Played ${plural(replay.steps.length, "step")}`
                : replay.phase === ReplayPhase.FAILED
                  ? `Step ${replay.index + 1} didn't work`
                  : replay.phase === ReplayPhase.WAITING_VALUE
                    ? `What goes in "${currentItem?.event.label ?? "the field"}"?`
                    : `Playing step ${replay.index + 1} of ${replay.steps.length}${
                        currentItem ? ` · ${describeEventParts(currentItem.event).verb} ${currentItem.event.label}` : ""
                      }`}
            </span>
            {busy ? (
              <Button size="small" type="text" danger icon={buttonIcon(IconPlayerStopFilled)} onClick={stop}>
                Stop
              </Button>
            ) : (
              <IconButton label="Close" size={24} onClick={dismiss}>
                <IconX size={14} aria-hidden="true" />
              </IconButton>
            )}
          </div>
          {busy && <Progress $value={replay.index / Math.max(1, replay.steps.length)} aria-hidden="true" />}
          {replay.phase === ReplayPhase.FAILED && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 text-xs text-red-700">{replay.error || "The element was not found."}</span>
              <Button size="small" type="primary" icon={buttonIcon(IconRefresh)} onClick={retry}>
                Try again
              </Button>
              <Button size="small" icon={buttonIcon(IconPlayerSkipForward)} onClick={skip}>
                Skip
              </Button>
            </div>
          )}
          {replay.phase === ReplayPhase.WAITING_VALUE && current && (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                provideValue(typed);
              }}
            >
              <Input
                size="small"
                autoFocus
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                aria-label="Text to type"
                placeholder="Text to type"
              />
              <Button size="small" type="primary" htmlType="submit">
                Fill
              </Button>
              <Button size="small" icon={buttonIcon(IconPlayerSkipForward)} onClick={skip}>
                Skip
              </Button>
            </form>
          )}
        </ReplayBar>
      )}
    </ResizableModal>
  );
};
