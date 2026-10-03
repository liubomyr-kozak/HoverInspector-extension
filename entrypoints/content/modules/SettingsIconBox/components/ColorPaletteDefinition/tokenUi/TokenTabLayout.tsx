import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Switch } from "antd";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { LoadingState } from "@entrypoints/shared/components/LoadingState";
import { EmptyState } from "@entrypoints/shared/components/EmptyState";
import { summarize, type ThemeMatch } from "../utils/themeDiff";
import { PALETTE_TAB_BAR_HEIGHT_VAR, usePalette, type PaletteTab } from "../PaletteContext";
import { MatchBadge } from "./MatchBadge";
import { TokenDetailPanel, type TokenDetail } from "./TokenDetailPanel";

export interface TokenEntry {
  /** Unique within the tab */
  id: string;
  /** The value, as the Overview refers to it (#HEX, 16px, the raw shadow) */
  key: string;
  /** Main label: the value itself */
  label: string;
  /** Second line: the CSS variable or theme token that names the value */
  secondary?: string;
  /** Uses on the page */
  count: number;
  /** Rows and tiles: what the value looks like */
  preview?: React.ReactNode;
  /** Swatch layout: the colour */
  swatch?: string;
  match: ThemeMatch | null;
}

export interface TokenGroup {
  key: string;
  title: string;
  /** swatches: colour squares; tiles: a small grid of previews; rows: a compact list */
  layout: "swatches" | "tiles" | "rows";
  entries: TokenEntry[];
  /** One line under the title */
  hint?: string;
  /** Tiles: minimum tile width in px (default 92) */
  tileMin?: number;
}

/** Side by side above this width, otherwise the details open under the group of the selected value */
const WIDE_MIN = 600;
/** The panel body's padding: the tab bar sticks this far above the body's top edge, the card under it */
const PANEL_PADDING = 16;
const STICKY_CARD_TOP = `calc(var(${PALETTE_TAB_BAR_HEIGHT_VAR}, 0px) - ${PANEL_PADDING}px)`;

const useWidth = (ref: React.RefObject<HTMLElement | null>) => {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};

/** Height of the nearest scrolling ancestor (the panel body), so the sticky card fits in what is visible */
const useScrollParentHeight = (ref: React.RefObject<HTMLElement | null>) => {
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    let parent = ref.current?.parentElement ?? null;
    while (parent && !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) parent = parent.parentElement;
    if (!parent) return;
    const scroller = parent;
    setHeight(scroller.clientHeight);
    const observer = new ResizeObserver(() => setHeight(scroller.clientHeight));
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [ref]);
  return height;
};

const entryLabel = (entry: TokenEntry) =>
  `${entry.label}${entry.secondary ? `, ${entry.secondary}` : ""}, ${entry.count} ${entry.count === 1 ? "use" : "uses"}`;

const Swatch: React.FC<{ entry: TokenEntry; selected: boolean; onClick: () => void }> = ({ entry, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    aria-label={entryLabel(entry)}
    title={`${entry.label}${entry.secondary ? ` · ${entry.secondary}` : ""} · ${entry.count}×`}
    className={`relative w-12 h-12 rounded border transition-all duration-200 ${
      selected ? "border-gray-500 shadow-lg scale-105" : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
    }`}
    style={{ backgroundColor: entry.swatch }}
  >
    <MatchBadge match={entry.match} className="absolute -top-1.5 -right-1.5" />
  </button>
);

const Tile: React.FC<{ entry: TokenEntry; selected: boolean; onClick: () => void }> = ({ entry, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    aria-label={entryLabel(entry)}
    className={`relative flex flex-col items-center gap-1 rounded-md border p-2 text-center transition-colors ${
      selected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
    }`}
  >
    <MatchBadge match={entry.match} className="absolute top-1 right-1" />
    <div className="h-12 flex items-center justify-center">{entry.preview}</div>
    <div className="w-full truncate text-xs font-mono text-gray-900">{entry.label}</div>
    {entry.secondary && <div className="w-full truncate text-[11px] font-mono text-blue-700">{entry.secondary}</div>}
    <div className="text-[11px] text-gray-500">{entry.count}×</div>
  </button>
);

const Row: React.FC<{ entry: TokenEntry; selected: boolean; onClick: () => void }> = ({ entry, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    aria-label={entryLabel(entry)}
    className={`w-full flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
      selected ? "border-blue-300 bg-blue-50" : "border-transparent hover:border-gray-200 hover:bg-gray-50"
    }`}
  >
    {entry.preview && <span className="shrink-0 w-16 flex items-center overflow-hidden">{entry.preview}</span>}
    <span className="flex-1 min-w-0">
      <span className="block truncate text-[13px] font-mono text-gray-900">{entry.label}</span>
      {entry.secondary && <span className="block truncate text-[11px] font-mono text-blue-700">{entry.secondary}</span>}
    </span>
    <span className="shrink-0 text-[11px] text-gray-500 tabular-nums">{entry.count}×</span>
    <span className="shrink-0 w-4 flex justify-center">
      <MatchBadge match={entry.match} />
    </span>
  </button>
);

/**
 * The group's values; in a narrow panel the detail panel opens right after the selected value, across
 * the whole width (a full grid row, a full flex line)
 */
const GroupItems: React.FC<{
  group: TokenGroup;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  inlinePanel?: React.ReactNode;
}> = ({ group, selectedId, onSelect, inlinePanel }) => {
  const toggle = (id: string) => onSelect(selectedId === id ? null : id);
  const Item = group.layout === "swatches" ? Swatch : group.layout === "tiles" ? Tile : Row;
  const items = group.entries.map((entry) => (
    <React.Fragment key={entry.id}>
      <Item entry={entry} selected={entry.id === selectedId} onClick={() => toggle(entry.id)} />
      {inlinePanel && entry.id === selectedId && (
        <div className="w-full" style={{ gridColumn: "1 / -1", flexBasis: "100%" }}>
          {inlinePanel}
        </div>
      )}
    </React.Fragment>
  ));
  if (group.layout === "swatches") return <div className="flex flex-wrap gap-4 pt-1.5 pr-1.5">{items}</div>;
  if (group.layout === "tiles") {
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${group.tileMin ?? 92}px, 1fr))` }}>
        {items}
      </div>
    );
  }
  return <div className="flex flex-col gap-0.5">{items}</div>;
};

/** "12 of 30 values match the theme" and the "only mismatches" switch */
export const ThemeSummary: React.FC<{ matches: Array<ThemeMatch | null> }> = ({ matches }) => {
  const { theme, onlyMismatches, setOnlyMismatches } = usePalette();
  if (!theme) return null;
  const { matched, total } = summarize(matches);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700">
      <span className="flex-1 min-w-[10rem]">
        {total ? (
          <>
            <strong className="text-gray-900 tabular-nums">
              {matched} of {total}
            </strong>{" "}
            values match <span className="font-medium">{theme.name}</span>
          </>
        ) : (
          <>The theme has no tokens for these values.</>
        )}
      </span>
      {total > 0 && (
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <Switch size="small" checked={onlyMismatches} onChange={setOnlyMismatches} aria-label="Show only mismatches" />
          Only mismatches
        </label>
      )}
    </div>
  );
};

export interface TokenTabLayoutProps {
  tab: PaletteTab;
  icon: React.ReactNode;
  title: string;
  description: string;
  groups: TokenGroup[];
  /** Still scanning */
  loading?: boolean;
  loadingLabel?: string;
  emptyText: string;
  onRescan: () => void;
  getDetail: (entry: TokenEntry) => TokenDetail | null;
  error?: string | null;
  progress?: { done: number; total: number } | null;
}

/**
 * The layout every token tab shares: a header, the theme summary, groups of values (swatches, tiles or
 * rows) and the detail panel for the selected value.
 */
export const TokenTabLayout: React.FC<TokenTabLayoutProps> = ({
  tab,
  icon,
  title,
  description,
  groups,
  loading,
  loadingLabel = "Scanning the page…",
  emptyText,
  onRescan,
  getDetail,
  error,
  progress,
}) => {
  const { theme, onlyMismatches, focusRequest } = usePalette();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const wide = useWidth(containerRef) >= WIDE_MIN;
  const scrollerHeight = useScrollParentHeight(containerRef);

  const allEntries = useMemo(() => groups.flatMap((g) => g.entries), [groups]);
  const visibleGroups = useMemo(() => {
    if (!theme || !onlyMismatches) return groups;
    return groups
      .map((g) => ({ ...g, entries: g.entries.filter((e) => e.match && e.match.status !== "match") }))
      .filter((g) => g.entries.length);
  }, [groups, theme, onlyMismatches]);

  // The Overview asked to open a value in this tab
  useEffect(() => {
    if (!focusRequest || focusRequest.tab !== tab) return;
    const entry = allEntries.find((e) => e.key.toLowerCase() === focusRequest.key.toLowerCase());
    if (entry) setSelectedId(entry.id);
  }, [focusRequest, tab, allEntries]);

  const selected = allEntries.find((e) => e.id === selectedId) || null;
  const detail = selected ? getDetail(selected) : null;

  // Bring the details into view when a value is picked; side by side the card is sticky and already in view
  useEffect(() => {
    if (!selectedId || wide) return;
    const frame = requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [selectedId, wide]);

  const panel = detail && (
    // scrollMarginTop: scrolled into view below the sticky tab bar, not under it
    <div ref={detailRef} className={wide ? undefined : "my-1"} style={{ scrollMarginTop: STICKY_CARD_TOP }}>
      <TokenDetailPanel detail={detail} themeActive={!!theme} onClose={() => setSelectedId(null)} />
    </div>
  );
  const selectedGroupKey = selected ? visibleGroups.find((g) => g.entries.some((e) => e.id === selected.id))?.key : undefined;

  const header = (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-blue-600 shrink-0" aria-hidden>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="m-0 text-base font-semibold text-gray-800">{title}</h4>
        <p className="m-0 text-sm text-gray-600">{description}</p>
      </div>
      <Button size="small" icon={<IconRefresh size={14} />} onClick={onRescan} loading={loading}>
        Rescan
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-3">
        {header}
        <div role="alert" className="flex items-center gap-2 text-sm text-red-700">
          <IconAlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {header}
      {loading ? (
        <LoadingState inline label={loadingLabel} progress={progress} progressUnit="elements" />
      ) : !allEntries.length ? (
        <EmptyState title={emptyText} />
      ) : (
        <>
          <ThemeSummary matches={allEntries.map((e) => e.match)} />
          <div className={wide ? "flex items-start gap-6" : ""}>
            <div className={wide ? "flex-1 min-w-0 space-y-5" : "space-y-5"}>
              {visibleGroups.length === 0 && (
                <p className="text-sm text-green-700 m-0">Every value here matches the theme.</p>
              )}
              {visibleGroups.map((group) => (
                <div key={group.key}>
                  <h5 className="m-0 mb-2 text-sm font-semibold text-gray-800">
                    {group.title} <span className="ml-1 text-xs font-normal text-gray-500">{group.entries.length}</span>
                  </h5>
                  {group.hint && <p className="m-0 mb-2 text-xs text-gray-600">{group.hint}</p>}
                  <GroupItems
                    group={group}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    inlinePanel={!wide && group.key === selectedGroupKey ? panel : undefined}
                  />
                </div>
              ))}
            </div>
            {wide && panel && (
              // Stays in view under the sticky tab bar while the values scroll; scrolls itself when taller
              <div
                className="sticky self-start overflow-y-auto"
                style={{
                  flex: "0 0 300px",
                  maxWidth: "45%",
                  top: STICKY_CARD_TOP,
                  maxHeight: scrollerHeight ? `calc(${scrollerHeight}px - var(${PALETTE_TAB_BAR_HEIGHT_VAR}, 0px))` : undefined,
                }}
              >
                {panel}
              </div>
            )}
          </div>
          {!wide && panel && !selectedGroupKey && panel}
        </>
      )}
    </div>
  );
};
