import { CSSDiff, convertElementDiffToCSSDiff } from "../../../../utils/cssParser.ts";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DiffContainer,
  ListContainer,
  VirtualListContainer,
  VirtualListContent,
  EmptyState
} from "./components/styled";
import { DiffHeader } from "./components/DiffHeader";
import { SearchBar } from "./components/SearchBar";
import { PropertyLegend } from "./components/PropertyLegend";
import { PropertyRow } from "./components/PropertyRow";

// --- Types ---------------------------------------------------------------------------------------------------------

interface DiffPopupProps {
  diff: CSSDiff | null;
  leftNode?: any;
  rightNode?: any;
}
interface PropertyRow {
  property: string;
  value1: string | null;
  value2: string | null;
  changeType: ChangeKind;
}
type ChangeKind = "added" | "removed" | "modified" | "unchanged";

// --- Helpers (pure, easily testable) -------------------------------------------------------------------------------
function buildPropertyRows(diff: CSSDiff | null): PropertyRow[] {
  if (!diff) return [];
  const rows: PropertyRow[] = [];
  const allProps = new Set([...Object.keys(diff.added), ...Object.keys(diff.removed), ...Object.keys(diff.modified)]);
  allProps.forEach((prop) => {
    let changeType: ChangeKind = "unchanged";
    let value1: string | null = null;
    let value2: string | null = null;
    if (prop in diff.added) {
      changeType = "added";
      value2 = diff.added[prop];
    } else if (prop in diff.removed) {
      changeType = "removed";
      value1 = diff.removed[prop];
    } else if (prop in diff.modified) {
      changeType = "modified";
      value1 = diff.modified[prop].old;
      value2 = diff.modified[prop].new;
    }
    rows.push({ property: prop, value1, value2, changeType });
  });
  rows.sort((a, b) => a.property.localeCompare(b.property));
  return rows;
}

function analyzeSelector(selector: string) {
  const trimmed = selector.trim();
  if (trimmed.startsWith("#")) return { type: "id", specificity: 100, icon: <span>#</span> };
  if (trimmed.startsWith(".")) return { type: "class", specificity: 10, icon: <span>•</span> };
  if (trimmed.includes(":")) return { type: "pseudo", specificity: 1, icon: <span>:</span> };
  return { type: "element", specificity: 1, icon: <span>⚛</span> };
}


// --- Virtual list hook ---------------------------------------------------------------------------------------------
function useVirtualRows<T>(rows: T[], rowHeight = 36, overscan = 6) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);
  const totalHeight = rows.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(
    rows.length,
    Math.ceil((scrollTop + (containerRef.current?.clientHeight || 0)) / rowHeight) + overscan,
  );
  const visible = rows.slice(start, end);
  const offsetY = start * rowHeight;
  return { containerRef, onScroll, totalHeight, visible, offsetY, range: { start, end } };
}

// --- Component -----------------------------------------------------------------------------------------------------
export const DiffPopup: React.FC<DiffPopupProps> = React.memo(({ diff, leftNode, rightNode }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showChildStyles, setShowChildStyles] = useState(false);
  const [childStyleDiff, setChildStyleDiff] = useState<CSSDiff | null>(null);
  const [filters, setFilters] = useState<{ added: boolean; removed: boolean; modified: boolean }>({
    added: true,
    removed: true,
    modified: true,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use child style diff when in child style mode, otherwise use original diff
  const activeDiff = showChildStyles ? childStyleDiff : diff;

  const hasChanges =
    activeDiff && Object.keys(activeDiff.added).length + Object.keys(activeDiff.removed).length + Object.keys(activeDiff.modified).length > 0;
  const selectorInfo = useMemo(() => (activeDiff ? analyzeSelector(activeDiff.selector) : null), [activeDiff]);

  const allRows = useMemo(() => buildPropertyRows(activeDiff), [activeDiff]);

  // Filter rows (skip unchanged already) + search
  const filteredRows = useMemo(() => {
    const activeKinds = new Set<ChangeKind>();
    if (filters.added) activeKinds.add("added");
    if (filters.removed) activeKinds.add("removed");
    if (filters.modified) activeKinds.add("modified");
    const q = search.trim().toLowerCase();
    return allRows.filter(
      (r) =>
        r.changeType !== "unchanged" && activeKinds.has(r.changeType) && (!q || r.property.toLowerCase().includes(q)),
    );
  }, [allRows, filters, search]);

  // Group child style properties by base property name when child styles mode is active
  const groupedChildRows = useMemo(() => {
    if (!showChildStyles) return filteredRows;
    const map = new Map<string, { v1: Set<string>; v2: Set<string>; change: ChangeKind }>();
    const priority = (c: ChangeKind) => (c === "modified" ? 3 : c === "removed" ? 2 : c === "added" ? 1 : 0);
    filteredRows.forEach((row) => {
      const key = row.property; // already simplified in child diff generation
      if (!map.has(key)) {
        map.set(key, { v1: new Set(), v2: new Set(), change: row.changeType });
      }
      const entry = map.get(key)!;
      // Split aggregated values ("a | b") back into individual parts for unique listing
      if (row.value1) row.value1.split("|").map((s) => s.trim()).filter(Boolean).forEach((v) => entry.v1.add(v));
      if (row.value2) row.value2.split("|").map((s) => s.trim()).filter(Boolean).forEach((v) => entry.v2.add(v));
      if (priority(row.changeType) > priority(entry.change)) entry.change = row.changeType;
    });
    return Array.from(map.entries())
      .map<PropertyRow>(([property, data]) => ({
        property,
        value1: data.v1.size ? Array.from(data.v1).join(" | ") : null,
        value2: data.v2.size ? Array.from(data.v2).join(" | ") : null,
        changeType: data.change,
      }))
      .sort((a, b) => a.property.localeCompare(b.property));
  }, [filteredRows, showChildStyles]);

  const displayedRows = showChildStyles ? groupedChildRows : filteredRows;

  const total = useMemo(
    () => ({
      added: activeDiff ? Object.keys(activeDiff.added).length : 0,
      removed: activeDiff ? Object.keys(activeDiff.removed).length : 0,
      modified: activeDiff ? Object.keys(activeDiff.modified).length : 0,
    }),
    [activeDiff],
  );

  const totalsAll = total.added + total.removed + total.modified;

  const { containerRef: listRef, onScroll, totalHeight, visible, offsetY } = useVirtualRows(displayedRows, 40);
  const virtualizationEnabled = displayedRows.length > 150; // threshold

  const copy = useCallback(async (txt: string, key: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  }, []);

  const copyAll = useCallback(() => {
    if (!activeDiff) return;
    let out = `/* ${activeDiff.selector} */\n`;
    Object.entries(activeDiff.removed).forEach(([p, v]) => {
      out += `/* - ${p}: ${v}; */\n`;
    });
    Object.entries(activeDiff.added).forEach(([p, v]) => {
      out += `${p}: ${v};\n`;
    });
    Object.entries(activeDiff.modified).forEach(([p, v]) => {
      out += `${p}: ${v.new}; /* was: ${v.old} */\n`;
    });
    copy(out, "all");
  }, [activeDiff, copy]);

  const copyAsJSON = useCallback(() => {
    if (!activeDiff) return;
    
    const designTokens = {
      selector: activeDiff.selector,
      timestamp: new Date().toISOString(),
      changes: {
        added: activeDiff.added,
        removed: activeDiff.removed,
        modified: Object.fromEntries(
          Object.entries(activeDiff.modified).map(([prop, change]) => [
            prop,
            { from: change.old, to: change.new }
          ])
        )
      },
      summary: {
        total: Object.keys(activeDiff.added).length + Object.keys(activeDiff.removed).length + Object.keys(activeDiff.modified).length,
        added: Object.keys(activeDiff.added).length,
        removed: Object.keys(activeDiff.removed).length,
        modified: Object.keys(activeDiff.modified).length
      }
    };
    
    copy(JSON.stringify(designTokens, null, 2), "json");
  }, [activeDiff, copy]);

  const copyAsYAML = useCallback(() => {
    if (!activeDiff) return;
    
    let yaml = `selector: "${activeDiff.selector}"\n`;
    yaml += `timestamp: "${new Date().toISOString()}"\n`;
    yaml += `changes:\n`;
    
    if (Object.keys(activeDiff.added).length > 0) {
      yaml += `  added:\n`;
      Object.entries(activeDiff.added).forEach(([prop, value]) => {
        yaml += `    ${prop}: "${value}"\n`;
      });
    }
    
    if (Object.keys(activeDiff.removed).length > 0) {
      yaml += `  removed:\n`;
      Object.entries(activeDiff.removed).forEach(([prop, value]) => {
        yaml += `    ${prop}: "${value}"\n`;
      });
    }
    
    if (Object.keys(activeDiff.modified).length > 0) {
      yaml += `  modified:\n`;
      Object.entries(activeDiff.modified).forEach(([prop, change]) => {
        yaml += `    ${prop}:\n`;
        yaml += `      from: "${change.old}"\n`;
        yaml += `      to: "${change.new}"\n`;
      });
    }
    
    yaml += `summary:\n`;
    yaml += `  total: ${Object.keys(activeDiff.added).length + Object.keys(activeDiff.removed).length + Object.keys(activeDiff.modified).length}\n`;
    yaml += `  added: ${Object.keys(activeDiff.added).length}\n`;
    yaml += `  removed: ${Object.keys(activeDiff.removed).length}\n`;
    yaml += `  modified: ${Object.keys(activeDiff.modified).length}\n`;
    
    copy(yaml, "yaml");
  }, [activeDiff, copy]);

  const checkChildStyles = useCallback(() => {
    if (!leftNode || !rightNode) {
      console.warn("No element data available for child style checking");
      return;
    }
    
    // Toggle functionality - if already showing child styles, go back to original
    if (showChildStyles) {
      setShowChildStyles(false);
      setChildStyleDiff(null);
      return;
    }
    
    // Collect all child styles from both nodes
    const leftChildStyles: Record<string, string> = {};
    const rightChildStyles: Record<string, string> = {};
    
    // Helper function to recursively collect styles from children
    const collectChildStyles = (node: any, styles: Record<string, string>, prefix: string = "") => {
      if (!node || !node.children) return;
      
      node.children.forEach((child: any, index: number) => {
        const childPrefix = `${prefix}child[${index}]`;
        
        // Collect styles from this child
        if (child.styles) {
          Object.entries(child.styles).forEach(([prop, value]) => {
            styles[`${childPrefix}.${prop}`] = String(value);
          });
        }
        
        // Collect inline styles
        if (child.inlineStyles) {
          Object.entries(child.inlineStyles).forEach(([prop, value]) => {
            styles[`${childPrefix}.inline.${prop}`] = String(value);
          });
        }
        
        // Recursively collect from grandchildren
        collectChildStyles(child, styles, `${childPrefix}.`);
      });
    };
    
    collectChildStyles(leftNode, leftChildStyles);
    collectChildStyles(rightNode, rightChildStyles);
    
    // Check if there are any child styles to compare
    const hasChildStyles = Object.keys(leftChildStyles).length > 0 || Object.keys(rightChildStyles).length > 0;
    if (!hasChildStyles) {
      return;
    }
    
    // Create CSS diff from collected child styles
    const childDiff = convertElementDiffToCSSDiff(
      leftChildStyles, 
      rightChildStyles, 
      `${diff?.selector || 'Element'} > Children`
    );
    
    
    setChildStyleDiff(childDiff);
    setShowChildStyles(true);
  }, [leftNode, rightNode, showChildStyles, diff]);

  // Keyboard: Esc closes (emit custom event parent may capture)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        containerRef.current?.dispatchEvent(new CustomEvent("diff-popup:close", { bubbles: true }));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!hasChanges) return null;

  return (
    <DiffContainer
      ref={containerRef}
      aria-label="CSS differences"
      role="region"
    >
      <DiffHeader
        selector={diff!.selector}
        selectorInfo={selectorInfo}
        totalsAll={totalsAll}
        totals={total}
        filters={filters}
        showSearch={showSearch}
        copied={copied}
        showChildStyles={showChildStyles}
        hasNodes={!!(leftNode && rightNode)}
        onSearchToggle={() => setShowSearch((s) => !s)}
        onCopyAll={copyAll}
        onCopyAsJSON={copyAsJSON}
        onCopyAsYAML={copyAsYAML}
        onChildStylesToggle={checkChildStyles}
        onFilterChange={setFilters}
      />
      
      <SearchBar
        showSearch={showSearch}
        search={search}
        onSearchChange={setSearch}
      />

      <ListContainer
        ref={listRef as any}
        onScroll={virtualizationEnabled ? onScroll : undefined}
        aria-label="Changed properties list"
      >
        <PropertyLegend />
        
        <VirtualListContainer $height={virtualizationEnabled ? totalHeight : undefined}>
          <VirtualListContent
            $virtualized={virtualizationEnabled}
            $offsetY={offsetY}
          >
            {(virtualizationEnabled ? visible : displayedRows).map((row, index) => (
              <PropertyRow
                key={row.property}
                row={row}
                index={index}
                copied={copied}
                onCopy={copy}
              />
            ))}
            {displayedRows.length === 0 && (
              <EmptyState>
                No properties match filters
              </EmptyState>
            )}
          </VirtualListContent>
        </VirtualListContainer>
      </ListContainer>
    </DiffContainer>
  );
});

DiffPopup.displayName = "DiffPopup";
