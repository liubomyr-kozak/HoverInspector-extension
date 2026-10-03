import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  auditPage,
  auditToCssVariables,
  isOnGrid,
  SPACING_GRID,
  type DesignAudit,
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
  low: { dot: "bg-sky-400", label: "Low" },
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
  const color = score >= 85 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
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
    <div className="text-[15px] font-semibold text-gray-800">{value}</div>
    <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
  </div>
);

const IssueCard: React.FC<{ issue: DesignIssue; onShow: () => void; position?: number }> = ({ issue, onShow, position }) => {
  const sev = SEVERITY_STYLE[issue.severity];
  return (
    <div className="border border-gray-200 rounded-md p-2.5 mb-2 bg-white">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${sev.dot}`} title={`${sev.label} severity`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-800 truncate">{issue.title}</span>
            <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
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
                      {i === 1 && <span className="text-gray-400">≈</span>}
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
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
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
  colors: ValueUsage[];
  onShow: (usage: ValueUsage) => void;
}> = ({ colors, onShow }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))" }}>
    {colors.map((c) => (
      <div key={c.value} className="rounded-md border border-gray-200 overflow-hidden bg-white">
        <button
          className="block w-full h-10"
          style={{ background: c.value }}
          onClick={() => onShow(c)}
          title={`Show elements using ${c.value}`}
          aria-label={`Show elements using ${c.value}`}
        />
        <button
          className="w-full px-1.5 py-1 text-left hover:bg-gray-50"
          onClick={() => copy(c.value, c.value)}
          title="Copy"
        >
          <div className="text-[11px] font-mono text-gray-800 truncate">{c.value}</div>
          <div className="text-[10px] text-gray-500">{c.count} {c.count === 1 ? "use" : "uses"}</div>
        </button>
      </div>
    ))}
  </div>
);

export const DesignOverview: React.FC = () => {
  const [audit, setAudit] = useState<DesignAudit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<IssueCategory | "all">("all");
  const cycler = useElementCycler();

  const scan = useCallback(() => {
    setAudit(null);
    setError(null);
    // Let the loading state paint before the synchronous page scan
    setTimeout(() => {
      try {
        setAudit(auditPage());
      } catch (e) {
        console.error("Design audit failed:", e);
        setError("Couldn't analyse this page.");
      }
    }, 30);
  }, []);

  useEffect(scan, [scan]);

  const categories = useMemo(() => {
    if (!audit) return [];
    return [...new Set(audit.issues.map((i) => i.category))];
  }, [audit]);

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}{" "}
        <button className="underline" onClick={scan}>
          Try again
        </button>
      </div>
    );
  }

  if (!audit) return <p className="text-sm text-gray-500">Analysing the page…</p>;

  const issues = filter === "all" ? audit.issues : audit.issues.filter((i) => i.category === filter);
  const colorCount = new Set([...audit.colors.text, ...audit.colors.background, ...audit.colors.border].map((c) => c.value)).size;
  const maxSpacing = Math.max(...audit.spacing.map((s) => s.size ?? 0), 1);

  return (
    <div className="text-gray-800">
      {/* Summary */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 mb-4">
        <ScoreBadge score={audit.score} />
        <div className="flex-1 grid grid-cols-5 gap-1">
          <Stat label="Colours" value={colorCount} />
          <Stat label="Type styles" value={audit.typography.length} />
          <Stat label="Spacing" value={audit.spacing.length} />
          <Stat label="Radii" value={audit.radii.length} />
          <Stat label="Shadows" value={audit.shadows.length} />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500 flex-1">
          {audit.scannedElements} elements scanned{audit.truncated ? " (first 6000 only)" : ""}
        </span>
        <button
          onClick={() => copy(auditToCssVariables(audit), "CSS variables")}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
          title="Copy every value as CSS custom properties"
        >
          <IconCopy size={13} /> Copy as CSS variables
        </button>
        <button
          onClick={scan}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
        >
          <IconRefresh size={13} /> Rescan
        </button>
      </div>

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
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    filter === c ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c === "all" ? `All ${audit.issues.length}` : `${CATEGORY_LABEL[c]} ${audit.issues.filter((i) => i.category === c).length}`}
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
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{label}</div>
              <SwatchGrid colors={colors} onShow={(c) => cycler.show(`${label}-${c.value}`, c.elements)} />
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
        <p className="text-xs text-gray-500 mb-2">
          Margins, paddings and gaps. Values off the {SPACING_GRID}px grid are marked orange.
        </p>
        {audit.spacing.map((s) => {
          const off = !isOnGrid(s.size ?? 0);
          return (
            <button
              key={s.value}
              onClick={() => cycler.show(`space-${s.value}`, s.elements)}
              className="w-full flex items-center gap-2 py-0.5 hover:bg-gray-50"
              title="Show elements with this spacing"
            >
              <span className={`w-14 shrink-0 text-right text-[11px] font-mono ${off ? "text-orange-600" : "text-gray-700"}`}>
                {s.value}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className={`block h-2.5 rounded-sm ${off ? "bg-orange-400" : "bg-blue-400"}`}
                  style={{ width: `${Math.max(2, ((s.size ?? 0) / maxSpacing) * 100)}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right text-[10px] text-gray-500">{s.count}×</span>
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
              title="Show elements with this radius"
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
