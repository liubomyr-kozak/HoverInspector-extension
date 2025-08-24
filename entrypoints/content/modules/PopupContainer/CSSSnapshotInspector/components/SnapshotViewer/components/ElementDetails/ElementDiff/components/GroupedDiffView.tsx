import React from "react";
import type { CSSDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/utils/cssParser.ts";

interface GroupedDiffViewProps {
  diff: CSSDiff | null;
  search: string;
}

interface DiffGroup {
  title: string;
  type: "added" | "removed" | "modified";
  items: Array<{ key: string; value: string | { old: string; new: string } }>;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

interface ParsedProperty {
  [key: string]: string;
}

interface PropertyDiff {
  unchanged: ParsedProperty;
  changed: ParsedProperty;
}

const formatValue = (value: any): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

// Parse complex property values like "top: 210px; left: 1533px; width: 139px; height: 54px;"
const parseComplexProperty = (value: string): ParsedProperty => {
  const parsed: ParsedProperty = {};

  if (typeof value !== "string") {
    return parsed;
  }

  // Handle CSS-like properties (key: value; format)
  const cssMatches = value.match(/(\w+[-\w]*)\s*:\s*([^;]+);?/g);
  if (cssMatches) {
    cssMatches.forEach((match) => {
      const [, key, val] = match.match(/(\w+[-\w]*)\s*:\s*([^;]+);?/) || [];
      if (key && val) {
        parsed[key.trim()] = val.trim();
      }
    });
    return parsed;
  }

  // Handle other formats if needed
  return parsed;
};

// Compare two parsed properties and identify differences
const compareProperties = (oldValue: string, newValue: string): PropertyDiff => {
  const oldParsed = parseComplexProperty(oldValue);
  const newParsed = parseComplexProperty(newValue);

  const unchanged: ParsedProperty = {};
  const changed: ParsedProperty = {};

  // If parsing failed, treat as simple strings
  if (Object.keys(oldParsed).length === 0 || Object.keys(newParsed).length === 0) {
    return {
      unchanged: {},
      changed: { value: newValue },
    };
  }

  // Compare all properties
  const allKeys = new Set([...Object.keys(oldParsed), ...Object.keys(newParsed)]);

  allKeys.forEach((key) => {
    const oldVal = oldParsed[key];
    const newVal = newParsed[key];

    if (oldVal === newVal) {
      unchanged[key] = newVal || oldVal;
    } else {
      changed[key] = newVal || oldVal;
    }
  });

  return { unchanged, changed };
};

const filterBySearch = (items: Array<{ key: string; value: any }>, search: string) => {
  if (!search.trim()) return items;
  const searchLower = search.toLowerCase();
  return items.filter(
    (item) =>
      item.key.toLowerCase().includes(searchLower) || formatValue(item.value).toLowerCase().includes(searchLower),
  );
};

export const GroupedDiffView: React.FC<GroupedDiffViewProps> = ({ diff, search }) => {
  if (!diff) return null;

  const groups: DiffGroup[] = [];

  const copyText = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {}
  };

  const Highlight = ({
    text,
    query,
    context = "neutral",
  }: {
    text: string;
    query: string;
    context?: "neutral" | "added" | "removed";
  }) => {
    if (!query?.trim()) return <>{text}</>;
    const q = query.toLowerCase();
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    const cls =
      context === "neutral"
        ? "rounded px-0.5 bg-amber-200/70 text-amber-950 ring-1 ring-amber-300/60"
        : "rounded px-0.5 bg-white/70 text-current ring-1 ring-amber-300/60";
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q ? (
            <mark key={i} className={cls}>
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          ),
        )}
      </>
    );
  };

  // Added properties group
  const addedItems = Object.entries(diff.added).map(([key, value]) => ({ key, value }));
  if (addedItems.length > 0) {
    groups.push({
      title: "Added",
      type: "added",
      items: filterBySearch(addedItems, search),
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
    });
  }

  // Removed properties group
  const removedItems = Object.entries(diff.removed).map(([key, value]) => ({ key, value }));
  if (removedItems.length > 0) {
    groups.push({
      title: "Removed",
      type: "removed",
      items: filterBySearch(removedItems, search),
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
    });
  }

  // Modified properties group
  const modifiedItems = Object.entries(diff.modified).map(([key, value]) => ({ key, value }));
  if (modifiedItems.length > 0) {
    groups.push({
      title: "Modified",
      type: "modified",
      items: filterBySearch(modifiedItems, search),
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
    });
  }

  // Filter out groups with no items after search
  const visibleGroups = groups.filter((group) => group.items.length > 0);

  if (visibleGroups.length === 0) {
    return <div className="p-4 text-gray-500 text-center">No matching properties found</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {visibleGroups.map((group, groupIndex) => (
        <div
          key={group.type}
          className={`rounded-xl border ${group.borderColor} ${group.bgColor} shadow-sm hover:shadow-md transition-shadow`}
        >
          {/* Group Header */}
          <div
            className={`px-3 py-2 border-b ${group.borderColor} ${group.textColor} font-semibold text-sm flex items-center justify-between sticky top-[-15px] z-10 backdrop-blur-sm bg-white/60`}
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  group.type === "added"
                    ? "inline-flex h-2 w-2 rounded-full bg-green-500"
                    : group.type === "removed"
                      ? "inline-flex h-2 w-2 rounded-full bg-red-500"
                      : "inline-flex h-2 w-2 rounded-full bg-blue-500"
                }
              />
              <span>
                {group.title} ({group.items.length})
              </span>
            </div>
            {search?.trim() && <span className="text-xs text-gray-500">filtered by “{search}”</span>}
          </div>

          {/* Group Items */}
          <div className="p-3 space-y-2">
            {group.items.map((item, itemIndex) => (
              <div key={`${groupIndex}-${itemIndex}`} className="font-mono text-xs">
                <div className="flex items-start gap-2 rounded-lg border border-black/5 bg-white/60 px-2 py-1 hover:bg-white/80">
                  <span className="font-semibold text-gray-800 mr-1 min-w-0 break-all">
                    <Highlight text={`${item.key}`} query={search} context="neutral" />:
                  </span>

                  {group.type === "modified" &&
                  typeof item.value === "object" &&
                  (item.value as any).old &&
                  (item.value as any).new ? (
                    <div className="flex-1 min-w-0">
                      {(() => {
                        const modifiedVal = item.value as { old: string; new: string };
                        const diff = compareProperties(modifiedVal.old, modifiedVal.new);
                        const hasComplexDiff =
                          Object.keys(diff.unchanged).length > 0 || Object.keys(diff.changed).length > 0;

                        if (hasComplexDiff) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {/* Left Column - Old Values */}
                              <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                <div className="text-red-700 text-[11px] font-semibold mb-1">Snapshot 1</div>
                                <div className="space-y-1">
                                  {/* Changed properties first - show old values */}
                                  {Object.entries(diff.changed).map(([key, value]) => {
                                    const oldParsed = parseComplexProperty(modifiedVal.old);
                                    const oldVal = oldParsed[key];
                                    return oldVal ? (
                                      <div key={key} className="text-red-800 text-xs bg-red-100 px-1 rounded">
                                        <span className="font-medium">
                                          <Highlight text={`${key}:`} query={search} context="removed" />
                                        </span>{" "}
                                        <Highlight text={`${oldVal}`} query={search} context="removed" />
                                      </div>
                                    ) : null;
                                  })}
                                  {/* Unchanged properties at bottom - minimal styling */}
                                  {Object.entries(diff.unchanged).map(([key, value]) => (
                                    <div key={key} className="text-gray-500 text-[11px] opacity-60">
                                      <span className="font-normal">
                                        <Highlight text={`${key}:`} query={search} context="neutral" />
                                      </span>{" "}
                                      <Highlight text={`${value}`} query={search} context="neutral" />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right Column - New Values */}
                              <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                                <div className="text-green-700 text-[11px] font-semibold mb-1">Snapshot 2</div>
                                <div className="space-y-1">
                                  {/* Changed properties first - show new values */}
                                  {Object.entries(diff.changed).map(([key, value]) => (
                                    <div key={key} className="text-green-800 text-xs bg-green-100 px-1 rounded">
                                      <span className="font-medium">
                                        <Highlight text={`${key}:`} query={search} context="added" />
                                      </span>{" "}
                                      <Highlight text={`${value}`} query={search} context="added" />
                                    </div>
                                  ))}
                                  {/* Unchanged properties at bottom - minimal styling */}
                                  {Object.entries(diff.unchanged).map(([key, value]) => (
                                    <div key={key} className="text-gray-500 text-[11px] opacity-60">
                                      <span className="font-normal">
                                        <Highlight text={`${key}:`} query={search} context="neutral" />
                                      </span>{" "}
                                      <Highlight text={`${value}`} query={search} context="neutral" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Fallback to original layout for simple values
                          return (
                            <div>
                              <div className="bg-red-100 border border-red-200 rounded-lg px-2 py-1 mb-1">
                                <span className="text-red-700 text-[11px] font-semibold">Old: </span>
                                <span className="break-all">
                                  <Highlight
                                    text={`${formatValue(modifiedVal.old)}`}
                                    query={search}
                                    context="removed"
                                  />
                                </span>
                              </div>
                              <div className="bg-green-100 border border-green-200 rounded-lg px-2 py-1">
                                <span className="text-green-700 text-[11px] font-semibold">New: </span>
                                <span className="break-all">
                                  <Highlight text={`${formatValue(modifiedVal.new)}`} query={search} context="added" />
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <pre className="flex-1 min-w-0 break-all text-gray-700">
                      <Highlight text={`${formatValue(item.value)}`} query={search} context="neutral" />
                    </pre>
                  )}

                  <button
                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy"
                    onClick={() =>
                      copyText(
                        `${item.key}: ${
                          typeof item.value === "object" && (item.value as any).old !== undefined
                            ? `${formatValue((item.value as any).old)} -> ${formatValue((item.value as any).new)}`
                            : formatValue(item.value)
                        }`,
                      )
                    }
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
