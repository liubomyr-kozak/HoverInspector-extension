import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfigProvider, Segmented } from "antd";
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
  auditPageAsync,
  auditToCssVariables,
  isOnGrid,
  regradeAudit,
  SPACING_GRID,
  topClasses,
  type DesignAudit,
  type SpacingGrid,
  type DesignIssue,
  type IssueCategory,
  type ValueUsage,
} from "@entrypoints/shared/utils/designAudit";

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

const isColorValue = (value: string) => /^#[0-9A-F]{6,8}$/i.test(value);

// The user's grid choice follows them across sites (extension storage, never the page's localStorage)
const GRID_STORAGE_KEY = "designOverview.spacingGrid";
const loadGrid = async (): Promise<SpacingGrid> => {
  try {
    const value = (await browser.storage.local.get(GRID_STORAGE_KEY))[GRID_STORAGE_KEY];
    return value === 8 ? 8 : 4;
  } catch {
    return SPACING_GRID;
  }
};
const saveGrid = (grid: SpacingGrid) => browser.storage.local.set({ [GRID_STORAGE_KEY]: grid }).catch(() => undefined);

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

const Section: React.FC<{ title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title,
  count,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-4">
      <button
        className="w-full flex items-center gap-1 text-left text-[13px] font-semibold text-gray-800 py-1"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        {title}
        {count !== undefined && <span className="ml-1 text-xs font-normal text-gray-500">{count}</span>}
      </button>
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

const IssueCard: React.FC<{ issue: DesignIssue; onShow: () => void; position?: number }> = ({
  issue,
  onShow,
  position,
}) => {
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
                  key={value}
                  onClick={() => copy(value, value)}
                  title={`Copy ${value}`}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
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
                        onClick={() => copy(value, value)}
                        title={`Copy ${value}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100"
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
    </div>
  );
};

const SwatchGrid: React.FC<{
  audit: DesignAudit;
  colors: ValueUsage[];
  onShow: (usage: ValueUsage) => void;
}> = ({ audit, colors, onShow }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))" }}>
    {colors.map((c) => {
      const source = sourceHint(audit, c);
      return (
        <div key={c.value} className="rounded-md border border-gray-200 overflow-hidden bg-white">
          <button
            className="block w-full h-10"
            style={{ background: c.value }}
            onClick={() => onShow(c)}
            title={`Show elements using ${c.value}${source.title ? `\n${source.title}` : ""}`}
            aria-label={`Show elements using ${c.value}`}
          />
          <button
            className="w-full px-1.5 py-1 text-left hover:bg-gray-50"
            onClick={() => copy(c.value, c.value)}
            title={`Copy ${c.value}${source.title ? `\n${source.title}` : ""}`}
          >
            <div className="text-[11px] font-mono text-gray-800 truncate">{c.value}</div>
            {source.variables.length > 0 && (
              <div className="text-[10px] font-mono text-blue-700 truncate">{source.variables[0]}</div>
            )}
            <div className="text-[10px] text-gray-600">
              {c.count} {c.count === 1 ? "use" : "uses"}
            </div>
          </button>
        </div>
      );
    })}
  </div>
);

export const DesignOverview: React.FC = () => {
  const [audit, setAudit] = useState<DesignAudit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [filter, setFilter] = useState<IssueCategory | "all">("all");
  const [grid, setGrid] = useState<SpacingGrid | null>(null);
  const cycler = useElementCycler();
  const scanRef = useRef<AbortController | null>(null);
  const gridRef = useRef<SpacingGrid>(SPACING_GRID);

  // Chunked scan: the page stays responsive and large pages are scanned past the old 6000-element cap
  const scan = useCallback(() => {
    scanRef.current?.abort();
    const controller = new AbortController();
    scanRef.current = controller;
    setAudit(null);
    setError(null);
    setProgress(null);
    auditPageAsync(document.body, {
      grid: gridRef.current,
      signal: controller.signal,
      onProgress: (done, total) => !controller.signal.aborted && setProgress({ done, total }),
    })
      .then((result) => !controller.signal.aborted && setAudit(result))
      .catch((e) => {
        if (controller.signal.aborted) return;
        console.error("Design audit failed:", e);
        setError("Couldn't analyse this page.");
      });
  }, []);

  // Load the remembered grid first, then scan with it
  useEffect(() => {
    let cancelled = false;
    loadGrid().then((saved) => {
      if (cancelled) return;
      gridRef.current = saved;
      setGrid(saved);
      scan();
    });
    return () => {
      cancelled = true;
      scanRef.current?.abort();
    };
  }, [scan]);

  const changeGrid = (value: SpacingGrid) => {
    gridRef.current = value;
    setGrid(value);
    saveGrid(value);
    // Only the issues depend on the grid: recompute them, no rescan
    setAudit((current) => (current ? regradeAudit(current, value) : current));
  };

  const categories = useMemo(() => {
    if (!audit) return [];
    return [...new Set(audit.issues.map((i) => i.category))];
  }, [audit]);

  if (error) {
    return (
      <div role="alert" className="flex items-center gap-2 text-sm text-red-700">
        <IconAlertTriangle size={16} className="shrink-0" />
        <span className="flex-1">{error}</span>
        <Button size="small" onClick={scan}>
          Try again
        </Button>
      </div>
    );
  }

  if (!audit) {
    return <LoadingState inline label="Analysing the page…" progress={progress} progressUnit="elements" />;
  }

  const issues = filter === "all" ? audit.issues : audit.issues.filter((i) => i.category === filter);
  const colorCount = new Set(
    [...audit.colors.text, ...audit.colors.background, ...audit.colors.border].map((c) => c.value),
  ).size;
  const maxSpacing = Math.max(...audit.spacing.map((s) => s.size ?? 0), 1);

  return (
    <div className="text-gray-800">
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
            <Segmented<SpacingGrid>
              size="small"
              aria-labelledby="design-overview-grid-label"
              value={grid ?? audit.grid}
              onChange={changeGrid}
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
              />
            ))}
          </>
        )}
      </Section>

      {/* Colours */}
      <Section title="Colours" count={colorCount}>
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
                onShow={(c) => cycler.show(`${label}-${c.value}`, c.elements)}
              />
            </div>
          ) : null,
        )}
      </Section>

      {/* Typography */}
      <Section title="Type scale" count={audit.typography.length}>
        <div className="mb-2 text-xs text-gray-500">
          Families: {audit.families.map((f) => `${f.value} (${f.count})`).join(", ") || "none"}
        </div>
        {audit.typography.slice(0, 40).map((t) => (
          <button
            key={t.key}
            onClick={() => cycler.show(t.key, t.elements)}
            className="w-full text-left border-b border-gray-100 py-2 hover:bg-gray-50 block"
            title="Show elements with this style"
          >
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
              {t.size}px{t.size > 40 ? " (shown at 40px)" : ""} · {t.weight} · lh {t.lineHeight} · {t.familyName} ·{" "}
              {t.count} {t.count === 1 ? "use" : "uses"}
            </div>
          </button>
        ))}
        {audit.typography.length > 40 && (
          <p className="text-xs text-gray-500 mt-1">+{audit.typography.length - 40} more styles</p>
        )}
      </Section>

      {/* Spacing */}
      <Section title="Spacing scale" count={audit.spacing.length}>
        <p className="text-xs text-gray-600 mb-2">
          Margins, paddings and gaps. Values off the {audit.grid}px grid are marked orange; a token name shows where a
          value matches a CSS variable on :root.
        </p>
        {audit.spacing.map((s) => {
          const off = !isOnGrid(s.size ?? 0, audit.grid);
          const source = sourceHint(audit, s);
          return (
            <button
              key={s.value}
              onClick={() => cycler.show(`space-${s.value}`, s.elements)}
              className="w-full flex items-center gap-2 py-0.5 hover:bg-gray-50"
              title={`Show elements with this spacing${source.title ? `\n${source.title}` : ""}`}
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
            </button>
          );
        })}
        {!audit.spacing.length && <p className="text-xs text-gray-500">No spacing found.</p>}
      </Section>

      {/* Radii */}
      <Section title="Corner radii" count={audit.radii.length} defaultOpen={audit.radii.length > 0}>
        <div className="flex flex-wrap gap-3">
          {audit.radii.map((r) => (
            <button
              key={r.value}
              onClick={() => cycler.show(`radius-${r.value}`, r.elements)}
              className="text-center"
              title={`Show elements with this radius${sourceHint(audit, r).title ? `\n${sourceHint(audit, r).title}` : ""}`}
            >
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
      </Section>

      {/* Shadows */}
      <Section title="Shadows" count={audit.shadows.length} defaultOpen={audit.shadows.length > 0}>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
          {audit.shadows.map((s, i) => (
            <button
              key={s.value}
              onClick={() => cycler.show(`shadow-${i}`, s.elements)}
              className="p-2 text-left"
              title={s.value}
            >
              <div className="h-12 rounded-md bg-white" style={{ boxShadow: s.value }} />
              <div className="text-[10px] text-gray-500 mt-2">
                shadow-{i + 1} · {s.count}×
              </div>
            </button>
          ))}
          {!audit.shadows.length && <p className="text-xs text-gray-500">No shadows.</p>}
        </div>
      </Section>

      {audit.issues.some((i) => i.severity === "high") && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <IconAlertTriangle size={12} /> Contrast uses WCAG 2.1 AA: 4.5:1, or 3:1 for large text.
        </div>
      )}
    </div>
  );
};

export default DesignOverview;
