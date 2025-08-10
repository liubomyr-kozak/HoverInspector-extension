import React from "react";
import { IconPlus, IconMinus, IconArrowsExchange, IconCopy, IconCheck } from "@tabler/icons-react";

// Types reused across DiffPopup and parts
export type ChangeKind = "added" | "removed" | "modified" | "unchanged";

export interface PropertyRow {
  property: string;
  value1: string | null;
  value2: string | null;
  changeType: ChangeKind;
}

// Central palette + icon mapping
const iconSize = 14;
export const changeStyles: Record<ChangeKind, { icon: React.ReactNode }> = {
  added: { icon: <IconPlus size={iconSize} className="text-green-600" /> },
  removed: { icon: <IconMinus size={iconSize} className="text-red-600" /> },
  modified: { icon: <IconArrowsExchange size={iconSize} className="text-blue-600" /> },
  unchanged: { icon: null },
};

export interface Palette {
  bg: string;
  border: string;
  color: string;
  badgeOld: string;
  badgeNew: string;
}

export const getPalette = (kind: ChangeKind): Palette => {
  switch (kind) {
    case "added":
      return { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46", badgeOld: "#f1f5f9", badgeNew: "#d1fae5" };
    case "removed":
      return { bg: "#fff1f2", border: "#fecdd3", color: "#881337", badgeOld: "#ffe4e6", badgeNew: "#f1f5f9" };
    case "modified":
      return { bg: "#eff6ff", border: "#bfdbfe", color: "#1e3a8a", badgeOld: "#fee2e2", badgeNew: "#dcfce7" };
    default:
      return { bg: "#f1f5f9", border: "#e2e8f0", color: "#334155", badgeOld: "#e2e8f0", badgeNew: "#e2e8f0" };
  }
};

// Filter toggle button component
interface FilterToggleButtonProps {
  kind: Exclude<ChangeKind, "unchanged">;
  active: boolean;
  count: number;
  onToggle: () => void;
}
export const FilterToggleButton: React.FC<FilterToggleButtonProps> = ({ kind, active, count, onToggle }) => {
  const { labelBg, labelBorder, labelColor } = ((): any => {
    if (kind === "added") return { labelBg: "#ecfdf5", labelBorder: "#a7f3d0", labelColor: "#065f46" };
    if (kind === "removed") return { labelBg: "#fff1f2", labelBorder: "#fecdd3", labelColor: "#881337" };
    return { labelBg: "#eff6ff", labelBorder: "#bfdbfe", labelColor: "#1e3a8a" };
  })();
  return (
    <button
      aria-pressed={active}
      onClick={onToggle}
      style={{
        background: active ? labelBg : "#ffffff",
        border: `1px solid ${labelBorder}`,
        color: labelColor,
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
        opacity: active ? 1 : 0.55,
      }}
      title={`${kind} (${count})`}
    >
      {kind === "added" && <IconPlus size={12} />}
      {kind === "removed" && <IconMinus size={12} />}
      {kind === "modified" && <IconArrowsExchange size={12} />}
      <span style={{ textTransform: "capitalize" }}>{kind}</span>
      <span style={{ fontWeight: 500, opacity: 0.7 }}>{count}</span>
    </button>
  );
};

// Snapshot value cell
interface SnapshotValueCellProps {
  kind: ChangeKind;
  variant: "old" | "new"; // snapshot 1 old vs snapshot 2 new
  value: string | null;
}
const badgeFor = (kind: ChangeKind, variant: "old" | "new") => {
  if (kind === "added" && variant === "old") return { label: "None", bg: "#94a3b8" };
  if (kind === "added" && variant === "new") return { label: "New", bg: "#16a34a" };
  if (kind === "removed" && variant === "old") return { label: "Was", bg: "#f43f5e" };
  if (kind === "removed" && variant === "new") return { label: "None", bg: "#94a3b8" };
  if (kind === "modified" && variant === "old") return { label: "Old", bg: "#f59e0b" };
  if (kind === "modified" && variant === "new") return { label: "New", bg: "#16a34a" };
  return null;
};
export const SnapshotValueCell: React.FC<SnapshotValueCellProps & { palette: Palette }> = ({ kind, variant, value, palette }) => {
  const bg = variant === "old" ? palette.badgeOld : palette.badgeNew;
  const badge = badgeFor(kind, variant);
  return (
    <div
      style={{
        background: value ? bg : "#f8fafc",
        border: "1px solid #cbd5e1",
        borderRadius: 4,
        padding: "4px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        minHeight: 32,
      }}
      title={value || (variant === "old" ? "No value in snapshot 1" : "No value in snapshot 2")}
    >
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: kind === "removed" && variant === "old" ? "line-through" : undefined,
          opacity: kind === "modified" && variant === "old" && value ? 0.75 : 1,
          color: kind === "removed" && variant === "new" ? "#94a3b8" : undefined,
          fontWeight: kind !== "removed" && variant === "new" && (kind === "added" || kind === "modified") ? 600 : 400,
        }}
      >
        {value || "—"}
      </span>
      {badge && (
        <span
          style={{
            fontSize: 9,
            background: badge.bg,
            color: "#ffffff",
            padding: "2px 4px",
            borderRadius: 3,
          }}
        >
          {badge.label}
        </span>
      )}
    </div>
  );
};

// Property diff row component
interface PropertyDiffRowProps {
  row: PropertyRow;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}
export const PropertyDiffRow: React.FC<PropertyDiffRowProps> = ({ row, copied, onCopy }) => {
  const palette = getPalette(row.changeType);
  const oldVal = row.value1;
  const newVal = row.value2;
  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        borderRadius: 6,
        padding: "6px 8px",
        display: "grid",
        gridTemplateColumns: "min-content 160px 1fr 1fr 40px",
        alignItems: "stretch",
        gap: 8,
        fontSize: 11,
        fontFamily: "monospace",
      }}
    >
      <div style={{ paddingTop: 2 }}>{changeStyles[row.changeType].icon}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row.property}>
          {row.property}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 0.3,
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          {row.changeType}
        </div>
      </div>
      <SnapshotValueCell kind={row.changeType} variant="old" value={oldVal} palette={palette} />
      <SnapshotValueCell kind={row.changeType} variant="new" value={newVal} palette={palette} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <button
          aria-label="Copy property"
            onClick={() => {
              const v = newVal || oldVal;
              if (v) onCopy(`${row.property}: ${v};`, row.property);
            }}
          style={{
            background: copied === row.property ? "#16a34a" : "#f1f5f9",
            color: copied === row.property ? "#ffffff" : "#334155",
            border: "1px solid #cbd5e1",
            borderRadius: 4,
            padding: 4,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {copied === row.property ? <IconCheck size={14} /> : <IconCopy size={14} />}
        </button>
      </div>
    </div>
  );
};

// Grouped display for child styles mode where a property may have multiple aggregated values separated by " | "
interface GroupedChildPropertyProps {
  row: PropertyRow;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}
export const GroupedChildProperty: React.FC<GroupedChildPropertyProps> = ({ row, copied, onCopy }) => {
  const palette = getPalette(row.changeType);
  const splitVals = (v: string | null) => (v ? v.split('|').map(s => s.trim()).filter(Boolean) : []);
  const oldValues = splitVals(row.value1);
  const newValues = splitVals(row.value2);
  // De-duplicate while preserving order
  const dedupe = (arr: string[]) => Array.from(new Set(arr));
  const oldUnique = dedupe(oldValues);
  const newUnique = dedupe(newValues);
  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        borderRadius: 6,
        padding: '8px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ paddingTop: 2 }}>{changeStyles[row.changeType].icon}</div>
        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }} title={row.property}>{row.property}</div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.3, color: '#64748b', textTransform: 'uppercase' }}>{row.changeType}</div>
        <button
          aria-label="Copy property"
          onClick={() => {
            const representative = (newUnique[0] || oldUnique[0]);
            if (representative) onCopy(`${row.property}: ${representative};`, row.property);
          }}
          style={{
            background: copied === row.property ? '#16a34a' : '#f1f5f9',
            color: copied === row.property ? '#ffffff' : '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            padding: 4,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          {copied === row.property ? <IconCheck size={14} /> : <IconCopy size={14} />}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#475569' }}>Snapshot 1</div>
          {oldUnique.length === 0 && <div style={{ opacity: 0.6 }}>—</div>}
          {oldUnique.map((val, i) => (
            <div key={i} style={{
              background: palette.badgeOld,
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 24,
              textDecoration: row.changeType === 'removed' ? 'line-through' : undefined,
              opacity: row.changeType === 'modified' ? 0.85 : 1
            }} title={val}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#475569' }}>Snapshot 2</div>
          {newUnique.length === 0 && <div style={{ opacity: 0.6 }}>—</div>}
          {newUnique.map((val, i) => (
            <div key={i} style={{
              background: palette.badgeNew,
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 24,
              fontWeight: row.changeType !== 'removed' ? 600 : 400
            }} title={val}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
