import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfigProvider, Radio } from "antd";
import { LoadingState } from "@entrypoints/shared/components/LoadingState";
import { toast } from "react-toastify";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCopy,
  IconFocus2,
  IconRefresh,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import {
  auditToCssVariables,
  isOnGrid,
  topClasses,
  type DesignAudit,
  type SpacingGrid,
  type DesignIssue,
  type IssueCategory,
  type ValueUsage,
} from "@entrypoints/shared/utils/designAudit";
import { usePalette } from "./ColorPaletteDefinition/PaletteContext";
import { matchTypeStyle, matchValue, summarize, type ThemeMatch } from "./ColorPaletteDefinition/utils/themeDiff";
import { MatchBadge } from "./ColorPaletteDefinition/tokenUi/MatchBadge";
import {
  shadowLabel,
  typeStyleLabel,
  useBordersDetail,
  useShadowsDetail,
  useSpacingDetail,
  useTypeDetail,
} from "./ColorPaletteDefinition/TokenTabs";
import { useColorUsageDetail } from "./ColorPaletteDefinition/ColorPaletteDefinition";
import { PALETTE_TAB_BAR_HEIGHT_VAR, type PaletteTab } from "./ColorPaletteDefinition/PaletteContext";
import { TokenDetailPanel } from "./ColorPaletteDefinition/tokenUi/TokenDetailPanel";
import {
  STICKY_CARD_TOP,
  useScrollParentHeight,
  useWidth,
  WIDE_MIN,
  type TokenEntry,
} from "./ColorPaletteDefinition/tokenUi/TokenTabLayout";

/**
 * A design-system style overview of the page (like a Storybook docs page: colours, type scale,
 * spacing, radii, shadows) with the inconsistencies found between those values.
 */

const SEVERITY_STYLE: Record<DesignIssue["severity"], { dot: string; label: string }> = {
  high: { dot: "bg-red-500", label: "High" },
  medium: { dot: "bg-amber-500", label: "Medium" },
  low: { dot: "bg-sky-500", label: "Low" },
};

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  accessibility: "Accessibility",
  color: "Colour",
  typography: "Type",
  spacing: "Spacing",
  radius: "Radius",
  shadow: "Shadow",
};

/** The part of the Overview a value was picked in: in a narrow panel its details open right there */
type OverviewArea = "issues" | "color" | "typography" | "spacing" | "radius" | "shadow";

/** A value picked in the Overview: its details open beside the list instead of in another tab */
interface OverviewSelection {
  area: OverviewArea;
  tab: PaletteTab;
  entry: TokenEntry;
  /** Where in the area: the issue card (its id) or the colour group (Text, Background, Border) */
  group?: string;
}

const sameSelection = (a: OverviewSelection | null, b: OverviewSelection) =>
  !!a && a.area === b.area && a.group === b.group && a.entry.id === b.entry.id;

const isColorValue = (value: string) => /^#[0-9A-F]{6,8}$/i.test(value);

/** "Where does this value come from": the custom properties that resolve to it and the classes that use it */
const sourceHint = (audit: DesignAudit, usage: { value: string; elements: Element[] }) => {
  const variables = audit.variables[usage.value] || [];
  const classes = topClasses(usage.elements);
  const parts: string[] = [];
  if (variables.length) parts.push(`Token: ${variables.map((v) => `var(${v})`).join(", ")}`);
  if (classes.length) parts.push(`Used by: ${classes.map((c) => `.${c}`).join(", ")}`);
  return { variables, title: parts.join("\n") };
};

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`, { autoClose: 1500 });
  } catch {
    toast.error("Couldn't copy to the clipboard");
  }
};

/** Cycles through an element list: each click highlights the next one */
const useElementCycler = () => {
  const highlight = useHighlightOverlay();
  const [positions, setPositions] = useState<Record<string, number>>({});

  const show = useCallback(
    (key: string, elements: Element[]) => {
      const alive = elements.filter((el) => el.isConnected);
      if (!alive.length) {
        toast.info("Those elements are no longer on the page. Rescan to refresh.");
        return;
      }
      const index = (positions[key] ?? -1) + 1;
      const next = index % alive.length;
      highlight.startHighlight(highlight.generateXPath(alive[next]));
      setPositions((p) => ({ ...p, [key]: next }));
    },
    [highlight, positions],
  );

  return { show, position: (key: string) => positions[key] };
};

const Section: React.FC<{
  title: string;
  count?: number;
  defaultOpen?: boolean;
  /** Theme status of the section's values: "12/30 ✓" next to the count */
  matches?: Array<ThemeMatch | null>;
  /** "Open the tab" link */
  onOpen?: () => void;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = true, matches, onOpen, children }) => {
  const summary = matches ? summarize(matches) : null;
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-4">
      <div className="flex items-center gap-2">
        <button
          className="flex-1 min-w-0 flex items-center gap-1 text-left text-[13px] font-semibold text-gray-800 py-1"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          {title}
          {count !== undefined && <span className="ml-1 text-xs font-normal text-gray-500">{count}</span>}
          {summary && summary.total > 0 && (
            <span
              className="ml-1 text-[11px] font-normal text-gray-600"
              title={`${summary.matched} of ${summary.total} values match the theme`}
            >
              · {summary.matched}/{summary.total} match the theme
            </span>
          )}
        </button>
        {onOpen && (
          <button type="button" onClick={onOpen} className="shrink-0 text-xs text-blue-700 hover:text-blue-900 hover:underline">
            Details
          </button>
        )}
      </div>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  // Darker green/amber than the usual status colours so the number keeps 4.5:1 on white
  const color = score >= 85 ? "#15803d" : score >= 60 ? "#b45309" : "#dc2626";
  const deg = Math.round((score / 100) * 360);
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: 56, height: 56, background: `conic-gradient(${color} ${deg}deg, #e5e7eb 0deg)` }}
      title="Consistency score: 100 minus a penalty per issue"
    >
      <div className="bg-white rounded-full flex items-center justify-center" style={{ width: 44, height: 44 }}>
        <span className="text-[15px] font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="text-[15px] font-semibold text-gray-800 tabular-nums">{value}</div>
    <div className="text-[11px] text-gray-600 leading-tight">{label}</div>
  </div>
);

const IssueCard: React.FC<{
  issue: DesignIssue;
  onShow: () => void;
  position?: number;
  /** Opens the value's details and shows its elements; false when the value is not in the scan (then it is copied) */
  onPick: (value: string) => boolean;
  selectedValue?: string;
  /** The details of a value picked in this card (narrow panel) */
  children?: React.ReactNode;
}> = ({ issue, onShow, position, onPick, selectedValue, children }) => {
  const pick = (value: string) => {
    if (!onPick(value)) copy(value, value);
  };
  const chipClass = (value: string) =>
    value === selectedValue ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100";
  const sev = SEVERITY_STYLE[issue.severity];
  return (
    <div className="border border-gray-200 rounded-md p-2.5 mb-2 bg-white">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${sev.dot}`} title={`${sev.label} severity`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-800 min-w-0">{issue.title}</span>
            <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-gray-500">
              {CATEGORY_LABEL[issue.category]}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 mb-0">{issue.detail}</p>
          {issue.values.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {issue.values.slice(0, 12).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => pick(value)}
                  aria-pressed={value === selectedValue}
                  title={`Show ${value} on the page and its details`}
                  className={`inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border text-gray-700 ${chipClass(value)}`}
                >
                  {isColorValue(value) && (
                    <span className="w-3 h-3 rounded-sm border border-gray-300" style={{ background: value }} />
                  )}
                  {value.length > 28 ? `${value.slice(0, 28)}…` : value}
                </button>
              ))}
              {issue.values.length > 12 && (
                <span className="text-[11px] text-gray-500 self-center">+{issue.values.length - 12} more</span>
              )}
            </div>
          )}
          {issue.pairs && issue.pairs.length > 0 && (
            <div className="flex flex-col gap-1 mt-1.5">
              {issue.pairs.map(([keep, drop]) => (
                <div key={`${keep}|${drop}`} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-700">
                  {[keep, drop].map((value, i) => (
                    <React.Fragment key={value}>
                      {i === 1 && <span className="text-gray-500">≈</span>}
                      <button
                        type="button"
                        onClick={() => pick(value)}
                        aria-pressed={value === selectedValue}
                        title={`Show ${value} on the page and its details`}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${chipClass(value)}`}
                      >
                        {isColorValue(value) && (
                          <span className="w-3 h-3 rounded-sm border border-gray-300" style={{ background: value }} />
                        )}
                        {value}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          )}
          {issue.elements.length > 0 && (
            <button
              onClick={onShow}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 rounded"
            >
              <IconFocus2 size={13} />
              {position === undefined
                ? `Show on page (${issue.elements.length})`
                : `Next element (${position + 1}/${issue.elements.length})`}
            </button>
          )}
        </div>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
};

const SwatchGrid: React.FC<{
  audit: DesignAudit;
  colors: ValueUsage[];
  matchOf: (value: string) => ThemeMatch | null;
  selectedValue?: string;
  onPick: (usage: ValueUsage) => void;
  /** Opens across the grid right after the selected swatch */
  inlinePanel?: React.ReactNode;
}> = ({ audit, colors, matchOf, selectedValue, onPick, inlinePanel }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))" }}>
    {colors.map((c) => {
      const source = sourceHint(audit, c);
      const match = matchOf(c.value);
      const selected = c.value === selectedValue;
      return (
        <React.Fragment key={c.value}>
        <button
          type="button"
          onClick={() => onPick(c)}
          aria-pressed={selected}
          title={`Show ${c.value} on the page and its details${source.title ? `\n${source.title}` : ""}`}
          className={`relative block rounded-md border overflow-hidden text-left ${
            selected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <span className="block w-full h-10" style={{ background: c.value }} />
          <MatchBadge match={match} className="absolute top-1 right-1" />
          <span className="block px-1.5 py-1">
            <span className="block text-[11px] font-mono text-gray-800 truncate">{c.value}</span>
            {(match?.status === "match" || source.variables.length > 0) && (
              <span className="block text-[10px] font-mono text-blue-700 truncate">
                {match?.status === "match" ? match.token : source.variables[0]}
              </span>
            )}
            <span className="block text-[10px] text-gray-600">
              {c.count} {c.count === 1 ? "use" : "uses"}
            </span>
          </span>
        </button>
        {selected && inlinePanel && <div style={{ gridColumn: "1 / -1" }}>{inlinePanel}</div>}
        </React.Fragment>
      );
    })}
  </div>
);

export const DesignOverview: React.FC = () => {
  const {
    audit,
    error,
    progress,
    rescan: scan,
    grid,
    setGrid: changeGrid,
    theme,
    openToken,
    rootFontSize,
  } = usePalette();
  const [filter, setFilter] = useState<IssueCategory | "all">("all");
  const cycler = useElementCycler();
  const highlight = useHighlightOverlay();
  const [selected, setSelected] = useState<OverviewSelection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const wide = useWidth(containerRef) >= WIDE_MIN;
  const scrollerHeight = useScrollParentHeight(containerRef);

  const colorDetail = useColorUsageDetail();
  const typeDetail = useTypeDetail();
  const spacingDetail = useSpacingDetail();
  const bordersDetail = useBordersDetail();
  const shadowsDetail = useShadowsDetail();

  /** Theme status of every value, by kind and value */
  const matches = useMemo(() => {
    if (!audit || !theme) return null;
    const ctx = { rootFontSize };
    const map = (kind: Parameters<typeof matchValue>[0], values: ValueUsage[]) =>
      new Map(values.map((v) => [v.value, matchValue(kind, v.value, theme, ctx)]));
    return {
      color: map("color", [...audit.colors.text, ...audit.colors.background, ...audit.colors.border]),
      spacing: map("spacing", audit.spacing),
      radius: map("radius", audit.radii),
      shadow: map("shadow", audit.shadows),
      type: new Map(audit.typography.map((t) => [t.key, matchTypeStyle(t, theme, rootFontSize).overall])),
    };
  }, [audit, theme, rootFontSize]);
  const matchOf = useCallback(
    (kind: "color" | "spacing" | "radius" | "shadow" | "type", value: string) => matches?.[kind].get(value) ?? null,
    [matches],
  );

  const detailOf = useCallback(
    (selection: OverviewSelection) => {
      switch (selection.tab) {
        case "color-palette":
          return colorDetail(selection.entry);
        case "typography":
          return typeDetail(selection.entry);
        case "spacing":
          return spacingDetail(selection.entry);
        case "borders":
          return bordersDetail(selection.entry);
        case "shadows":
          return shadowsDetail(selection.entry);
        default:
          return null;
      }
    },
    [colorDetail, typeDetail, spacingDetail, bordersDetail, shadowsDetail],
  );

  /** Opens the value's details here and scrolls the page to its first element; a second click closes them */
  const select = useCallback(
    (selection: OverviewSelection) => {
      if (sameSelection(selected, selection)) {
        setSelected(null);
        return;
      }
      setSelected(selection);
      const first = detailOf(selection)?.elements.find((element) => element.isConnected);
      if (first) highlight.startHighlight(highlight.generateXPath(first));
    },
    [selected, detailOf, highlight],
  );

  const entry = (id: string, value: string, label: string, count: number, match: ThemeMatch | null): TokenEntry => ({
    id,
    key: value,
    label,
    count,
    match,
  });

  /** An issue's value as a value of the scan (colour, spacing, radius, font size, shadow), or null */
  const issueSelection = (group: string, value: string): OverviewSelection | null => {
    if (!audit) return null;
    const find = (list: ValueUsage[]) => list.find((usage) => usage.value === value);
    const colors = [...audit.colors.text, ...audit.colors.background, ...audit.colors.border].filter((c) => c.value === value);
    if (colors.length) {
      const count = colors.reduce((sum, c) => sum + c.count, 0);
      return { area: "issues", group, tab: "color-palette", entry: entry(value, value, value, count, matchOf("color", value)) };
    }
    const spacing = find(audit.spacing);
    if (spacing) return { area: "issues", group, tab: "spacing", entry: entry(value, value, value, spacing.count, matchOf("spacing", value)) };
    const radius = find(audit.radii);
    if (radius) {
      return { area: "issues", group, tab: "borders", entry: entry(`radius:${value}`, value, value, radius.count, matchOf("radius", value)) };
    }
    const size = find(audit.fontSizes);
    if (size) {
      const match = theme ? matchValue("fontSize", value, theme, { rootFontSize }) : null;
      return { area: "issues", group, tab: "typography", entry: entry(`size:${value}`, value, value, size.count, match) };
    }
    const shadow = find(audit.shadows);
    if (shadow) return { area: "issues", group, tab: "shadows", entry: entry(value, value, value, shadow.count, matchOf("shadow", value)) };
    return null;
  };

  const detail = selected ? detailOf(selected) : null;

  // Bring the details into view when a value is picked; side by side the card is sticky and already in view
  useEffect(() => {
    if (!selected || wide) return;
    const frame = requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [selected, wide]);

  const panel = detail && (
    <div ref={detailRef} style={{ scrollMarginTop: STICKY_CARD_TOP }}>
      <TokenDetailPanel detail={detail} themeActive={!!theme} onClose={() => setSelected(null)} />
    </div>
  );
  /** The details under the area the value was picked in (narrow panel only) */
  const inlinePanel = (area: OverviewArea, group?: string) =>
    !wide && selected?.area === area && selected.group === group ? panel : null;
  const selectedIn = (area: OverviewArea, group?: string) =>
    selected?.area === area && selected.group === group ? selected.entry.key : undefined;

  const categories = useMemo(() => {
    if (!audit) return [];
    return [...new Set(audit.issues.map((i) => i.category))];
  }, [audit]);

  if (error) {
    return (
      <div ref={containerRef} role="alert" className="flex items-center gap-2 text-sm text-red-700">
        <IconAlertTriangle size={16} className="shrink-0" />
        <span className="flex-1">{error}</span>
        <Button size="small" onClick={scan}>
          Try again
        </Button>
      </div>
    );
  }

  if (!audit) {
    return (
      <div ref={containerRef}>
        <LoadingState inline label="Analysing the page…" progress={progress} progressUnit="elements" />
      </div>
    );
  }

  const issues = filter === "all" ? audit.issues : audit.issues.filter((i) => i.category === filter);
  const colorCount = new Set(
    [...audit.colors.text, ...audit.colors.background, ...audit.colors.border].map((c) => c.value),
  ).size;
  const maxSpacing = Math.max(...audit.spacing.map((s) => s.size ?? 0), 1);

  return (
    <div ref={containerRef} className={`text-gray-800 ${wide && panel ? "flex items-start gap-4" : ""}`}>
      <div className={wide && panel ? "flex-1 min-w-0" : undefined}>
      {/* Summary */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 mb-3">
        <ScoreBadge score={audit.score} />
        {/* Wraps to two rows in a narrow panel instead of breaking the labels */}
        <div
          className="flex-1 min-w-0 grid gap-x-1 gap-y-2"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(54px, 1fr))" }}
        >
          <Stat label="Colours" value={colorCount} />
          <Stat label="Type styles" value={audit.typography.length} />
          <Stat label="Spacing" value={audit.spacing.length} />
          <Stat label="Radii" value={audit.radii.length} />
          <Stat label="Shadows" value={audit.shadows.length} />
        </div>
      </div>
      {/* Compact controls (12px) to match the overview's small type */}
      <ConfigProvider theme={{ token: { fontSize: 12 } }}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-600 flex-1 min-w-[9rem]">
            {audit.scannedElements.toLocaleString()} elements scanned
            {audit.truncated ? ` (first ${audit.scannedElements.toLocaleString()} only)` : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600" id="design-overview-grid-label">
              Grid
            </span>
            {/* A radio group rather than antd's Segmented, which puts aria-selected on role-less divs */}
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              aria-labelledby="design-overview-grid-label"
              value={grid ?? audit.grid}
              onChange={(e) => changeGrid(e.target.value as SpacingGrid)}
              options={[
                { label: "4px", value: 4 },
                { label: "8px", value: 8 },
              ]}
            />
          </div>
          <Button
            size="small"
            icon={<IconCopy size={13} />}
            onClick={() => copy(auditToCssVariables(audit), "CSS variables")}
            title="Copy every value as CSS custom properties"
          >
            Copy as CSS variables
          </Button>
          <Button size="small" icon={<IconRefresh size={13} />} onClick={scan}>
            Rescan
          </Button>
        </div>
      </ConfigProvider>

      {/* Inconsistencies */}
      <Section title="Inconsistencies" count={audit.issues.length}>
        {audit.issues.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <IconCircleCheck size={16} /> No inconsistencies found.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mb-2">
              {(["all", ...categories] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  aria-pressed={filter === c}
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    filter === c
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {c === "all"
                    ? `All ${audit.issues.length}`
                    : `${CATEGORY_LABEL[c]} ${audit.issues.filter((i) => i.category === c).length}`}
                </button>
              ))}
            </div>
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                position={cycler.position(issue.id)}
                onShow={() => cycler.show(issue.id, issue.elements)}
                onPick={(value) => {
                  const selection = issueSelection(issue.id, value);
                  if (selection) select(selection);
                  return !!selection;
                }}
                selectedValue={selectedIn("issues", issue.id)}
              >
                {inlinePanel("issues", issue.id)}
              </IssueCard>
            ))}
          </>
        )}
      </Section>

      {/* Colours */}
      <Section
        title="Colours"
        count={colorCount}
        matches={matches ? [...matches.color.values()] : undefined}
        onOpen={() => openToken("color-palette", "")}
      >
        {(
          [
            ["Text", audit.colors.text],
            ["Background", audit.colors.background],
            ["Border", audit.colors.border],
          ] as const
        ).map(([label, colors]) =>
          colors.length ? (
            <div key={label} className="mb-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-600 mb-1">{label}</div>
              <SwatchGrid
                audit={audit}
                colors={colors}
                matchOf={(value) => matchOf("color", value)}
                selectedValue={selectedIn("color", label)}
                inlinePanel={inlinePanel("color", label)}
                onPick={(c) =>
                  select({
                    area: "color",
                    group: label,
                    tab: "color-palette",
                    entry: entry(c.value, c.value, c.value, c.count, matchOf("color", c.value)),
                  })
                }
              />
            </div>
          ) : null,
        )}
      </Section>

      {/* Typography */}
      <Section
        title="Type scale"
        count={audit.typography.length}
        matches={matches ? [...matches.type.values()] : undefined}
        onOpen={() => openToken("typography", "")}
      >
        <div className="mb-2 text-xs text-gray-500">
          Families: {audit.families.map((f) => `${f.value} (${f.count})`).join(", ") || "none"}
        </div>
        {audit.typography.slice(0, 40).map((t) => (
          <React.Fragment key={t.key}>
          <button
            type="button"
            onClick={() =>
              select({
                area: "typography",
                tab: "typography",
                entry: entry(`style:${t.key}`, t.key, typeStyleLabel(t), t.count, matchOf("type", t.key)),
              })
            }
            aria-pressed={selectedIn("typography") === t.key}
            className={`w-full text-left border-b border-gray-100 py-2 flex items-start gap-2 ${
              selectedIn("typography") === t.key ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
            title="Show this style on the page and its details"
          >
            <span className="flex-1 min-w-0">
            <div
              className="truncate text-gray-900"
              style={{
                fontFamily: t.family,
                fontSize: Math.min(t.size, 40),
                fontWeight: t.weight as any,
                lineHeight: 1.25,
              }}
            >
              The quick brown fox
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
              {typeStyleLabel(t)} · {t.familyName} · {t.count} {t.count === 1 ? "use" : "uses"}
              {t.size > 40 ? " (shown at 40px)" : ""}
            </div>
            </span>
            <MatchBadge match={matchOf("type", t.key)} className="mt-1" />
          </button>
          {selectedIn("typography") === t.key && inlinePanel("typography")}
          </React.Fragment>
        ))}
        {audit.typography.length > 40 && (
          <p className="text-xs text-gray-500 mt-1">+{audit.typography.length - 40} more styles</p>
        )}
      </Section>

      {/* Spacing */}
      <Section
        title="Spacing scale"
        count={audit.spacing.length}
        matches={matches ? [...matches.spacing.values()] : undefined}
        onOpen={() => openToken("spacing", "")}
      >
        <p className="text-xs text-gray-600 mb-2">
          Margins, paddings and gaps. Values off the {audit.grid}px grid are marked orange; a token name shows where a
          value matches a CSS variable on :root.
        </p>
        {audit.spacing.map((s) => {
          const off = !isOnGrid(s.size ?? 0, audit.grid);
          const source = sourceHint(audit, s);
          return (
            <React.Fragment key={s.value}>
            <button
              type="button"
              onClick={() =>
                select({ area: "spacing", tab: "spacing", entry: entry(s.value, s.value, s.value, s.count, matchOf("spacing", s.value)) })
              }
              aria-pressed={selectedIn("spacing") === s.value}
              className={`w-full flex items-center gap-2 py-0.5 ${selectedIn("spacing") === s.value ? "bg-blue-50" : "hover:bg-gray-50"}`}
              title={`Show ${s.value} on the page and its details${source.title ? `\n${source.title}` : ""}`}
            >
              <span
                className={`w-14 shrink-0 text-right text-[11px] font-mono ${off ? "text-orange-700" : "text-gray-700"}`}
              >
                {s.value}
              </span>
              {source.variables.length > 0 && (
                <span className="max-w-[35%] shrink-0 truncate text-[10px] font-mono text-blue-700">
                  {source.variables[0]}
                </span>
              )}
              <span className="flex-1 min-w-0">
                <span
                  className={`block h-2.5 rounded-sm ${off ? "bg-orange-400" : "bg-blue-400"}`}
                  style={{ width: `${Math.max(2, ((s.size ?? 0) / maxSpacing) * 100)}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-[10px] text-gray-600">{s.count}×</span>
              {matches && (
                <span className="w-4 shrink-0 flex justify-center">
                  <MatchBadge match={matchOf("spacing", s.value)} />
                </span>
              )}
            </button>
            {selectedIn("spacing") === s.value && inlinePanel("spacing")}
            </React.Fragment>
          );
        })}
        {!audit.spacing.length && <p className="text-xs text-gray-500">No spacing found.</p>}
      </Section>

      {/* Radii */}
      <Section
        title="Corner radii"
        count={audit.radii.length}
        defaultOpen={audit.radii.length > 0}
        matches={matches ? [...matches.radius.values()] : undefined}
        onOpen={() => openToken("borders", "")}
      >
        <div className="flex flex-wrap gap-3">
          {audit.radii.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() =>
                select({
                  area: "radius",
                  tab: "borders",
                  entry: entry(`radius:${r.value}`, r.value, r.value, r.count, matchOf("radius", r.value)),
                })
              }
              aria-pressed={selectedIn("radius") === r.value}
              className={`relative text-center rounded p-1 ${selectedIn("radius") === r.value ? "bg-blue-50" : ""}`}
              title={`Show ${r.value} on the page and its details${sourceHint(audit, r).title ? `\n${sourceHint(audit, r).title}` : ""}`}
            >
              <MatchBadge match={matchOf("radius", r.value)} className="absolute -top-1.5 -right-1.5" />
              <div
                className="w-12 h-12 bg-blue-50 border-2 border-blue-400 mx-auto"
                style={{ borderRadius: Math.min(r.size ?? 0, 24) }}
              />
              <div className="text-[11px] font-mono mt-1">{r.value}</div>
              <div className="text-[10px] text-gray-500">{r.count}×</div>
            </button>
          ))}
          {!audit.radii.length && <p className="text-xs text-gray-500">No rounded corners.</p>}
        </div>
        {inlinePanel("radius") && <div className="mt-2">{inlinePanel("radius")}</div>}
      </Section>

      {/* Shadows */}
      <Section
        title="Shadows"
        count={audit.shadows.length}
        defaultOpen={audit.shadows.length > 0}
        matches={matches ? [...matches.shadow.values()] : undefined}
        onOpen={() => openToken("shadows", "")}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
          {audit.shadows.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() =>
                select({ area: "shadow", tab: "shadows", entry: entry(s.value, s.value, s.value, s.count, matchOf("shadow", s.value)) })
              }
              aria-pressed={selectedIn("shadow") === s.value}
              className={`relative p-2 text-left rounded ${selectedIn("shadow") === s.value ? "bg-blue-50" : ""}`}
              title={`Show this shadow on the page and its details\n${s.value}`}
            >
              <MatchBadge match={matchOf("shadow", s.value)} className="absolute top-0 right-0 z-10" />
              <div className="h-12 rounded-md bg-white" style={{ boxShadow: s.value }} />
              <div className="text-[10px] font-mono text-gray-700 mt-2 truncate">{shadowLabel(s.value)}</div>
              <div className="text-[10px] text-gray-500">{s.count}×</div>
            </button>
          ))}
          {!audit.shadows.length && <p className="text-xs text-gray-500">No shadows.</p>}
        </div>
        {inlinePanel("shadow") && <div className="mt-2">{inlinePanel("shadow")}</div>}
      </Section>

      {audit.issues.some((i) => i.severity === "high") && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <IconAlertTriangle size={12} /> Contrast uses WCAG 2.1 AA: 4.5:1, or 3:1 for large text.
        </div>
      )}
      </div>
      {wide && panel && (
        // Stays in view under the sticky tab bar while the overview scrolls; scrolls itself when taller
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
  );
};

export default DesignOverview;
