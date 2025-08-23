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
    <div className="max-h-96 overflow-auto p-4 space-y-4">
      {visibleGroups.map((group, groupIndex) => (
        <div key={group.type} className={`rounded-lg border ${group.borderColor} ${group.bgColor}`}>
          {/* Group Header */}
          <div className={`px-3 py-2 border-b ${group.borderColor} ${group.textColor} font-semibold text-sm`}>
            {group.title} ({group.items.length})
          </div>

          {/* Group Items */}
          <div className="p-3 space-y-2">
            {group.items.map((item, itemIndex) => (
              <div key={`${groupIndex}-${itemIndex}`} className="font-mono text-xs">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 mr-2 min-w-0 break-all">{item.key}:</span>

                  {group.type === "modified" && typeof item.value === "object" && item.value.old && item.value.new ? (
                    <div className="flex-1 min-w-0">
                      {(() => {
                        const diff = compareProperties(item.value.old, item.value.new);
                        const hasComplexDiff =
                          Object.keys(diff.unchanged).length > 0 || Object.keys(diff.changed).length > 0;

                        if (hasComplexDiff) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {/* Left Column - Old Values */}
                              <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                                <div className="text-red-700 text-xs font-semibold mb-1">Snapshot 1</div>
                                <div className="space-y-1">
                                  {/* Changed properties first - show old values */}
                                  {Object.entries(diff.changed).map(([key, value]) => {
                                    const oldParsed = parseComplexProperty(item.value.old);
                                    const oldVal = oldParsed[key];
                                    return oldVal ? (
                                      <div key={key} className="text-red-700 text-xs bg-red-100 px-1 rounded">
                                        <span className="font-medium">{key}:</span> {oldVal}
                                      </div>
                                    ) : null;
                                  })}
                                  {/* Unchanged properties at bottom - minimal styling */}
                                  {Object.entries(diff.unchanged).map(([key, value]) => (
                                    <div key={key} className="text-gray-400 text-xs opacity-50">
                                      <span className="font-normal">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right Column - New Values */}
                              <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                                <div className="text-green-700 text-xs font-semibold mb-1">Snapshot 2</div>
                                <div className="space-y-1">
                                  {/* Changed properties first - show new values */}
                                  {Object.entries(diff.changed).map(([key, value]) => (
                                    <div key={key} className="text-green-700 text-xs bg-green-100 px-1 rounded">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  ))}
                                  {/* Unchanged properties at bottom - minimal styling */}
                                  {Object.entries(diff.unchanged).map(([key, value]) => (
                                    <div key={key} className="text-gray-400 text-xs opacity-50">
                                      <span className="font-normal">{key}:</span> {value}
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
                              <div className="bg-red-100 border border-red-200 rounded px-2 py-1 mb-1">
                                <span className="text-red-700 text-xs font-semibold">Old: </span>
                                <span className="break-all">{formatValue(item.value.old)}</span>
                              </div>
                              <div className="bg-green-100 border border-green-200 rounded px-2 py-1">
                                <span className="text-green-700 text-xs font-semibold">New: </span>
                                <span className="break-all">{formatValue(item.value.new)}</span>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <span className="flex-1 min-w-0 break-all text-gray-600">{formatValue(item.value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
