import React, { useMemo, useState } from "react";
import { StylePropertiesProps } from "../../types";
import { IconChevronDown, IconChevronRight, IconArrowsLeftRight, IconEye } from "@tabler/icons-react";

/**
 * Component for displaying CSS properties
 */
export const StyleProperties: React.FC<StylePropertiesProps> = ({ selectedElementStyles }) => {
  if (selectedElementStyles.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <p
          style={{
            color: "#666",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          No significant styles found for this element.
        </p>
      </div>
    );
  }

  // Define category matchers for use-case grouping
  const categories = useMemo(
    () => [
      {
        key: "layout",
        title: "Layout & Display",
        color: "#1d4ed8",
        match: (p: string) =>
          [
            "display",
            "visibility",
            "float",
            "clear",
            "overflow",
            "overflow-x",
            "overflow-y",
            "contain",
            "isolation",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
    ],
    [],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Array<[string, any]>>();
    const customVars: Array<[string, any]> = [];
    const other: Array<[string, any]> = [];

    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, []);
      return map.get(key)!;
    };

    for (const [prop, val] of selectedElementStyles) {
      if (prop.startsWith("--")) {
        customVars.push([prop, val]);
        continue;
      }
      const cat = categories.find((c) => c.match(prop));
      if (cat) {
        ensure(cat.key).push([prop, val]);
      } else {
        other.push([prop, val]);
      }
    }

    return { map, customVars, other };
  }, [selectedElementStyles, categories]);

  const Section = ({ title, color, items }: { title: string; color: string; items: Array<[string, any]> }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!items || items.length === 0) return null;

    return (
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <IconChevronDown size={14} color="#64748b" /> : <IconChevronRight size={14} color="#64748b" />}
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{title}</span>
          <span
            style={{
              fontSize: 11,
              color: "#64748b",
              background: "#e2e8f0",
              borderRadius: 999,
              padding: "1px 6px",
            }}
          >
            {items.length}
          </span>
        </div>
        {isExpanded && (
          <div style={{ padding: 10 }}>
            {items.map(([property, value]) => (
              <div key={property} style={{ marginBottom: 6 }}>
                <span style={{ color, fontWeight: 600 }}>{property}:</span>
                <span style={{ marginLeft: 6, color: "#334155" }}>{String(value)};</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ElementDetailsSection = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [abDiffMode, setAbDiffMode] = useState(false);
    const [snapshotA, setSnapshotA] = useState<Array<[string, any]>>(selectedElementStyles);
    const [snapshotB, setSnapshotB] = useState<Array<[string, any]>>([]);

    // Get element selector info (this would come from props in a real implementation)
    const elementSelector = "#elementSelector"; // Placeholder - would be dynamic

    // Helper function to create grouped styles for a snapshot
    const createGroupedStyles = (styles: Array<[string, any]>) => {
      const map = new Map<string, Array<[string, any]>>();
      const customVars: Array<[string, any]> = [];
      const other: Array<[string, any]> = [];

      const ensure = (key: string) => {
        if (!map.has(key)) map.set(key, []);
        return map.get(key)!;
      };

      for (const [prop, val] of styles) {
        if (prop.startsWith("--")) {
          customVars.push([prop, val]);
          continue;
        }
        const cat = categories.find((c) => c.match(prop));
        if (cat) {
          ensure(cat.key).push([prop, val]);
        } else {
          other.push([prop, val]);
        }
      }

      return { map, customVars, other };
    };

    // Create comparison data
    const groupedA = createGroupedStyles(snapshotA);
    const groupedB = createGroupedStyles(snapshotB);

    // Helper function to get diff status for a property
    const getDiffStatus = (property: string, valueA: any, valueB: any) => {
      if (valueA === undefined && valueB !== undefined) return "added";
      if (valueA !== undefined && valueB === undefined) return "removed";
      if (valueA !== valueB) return "changed";
      return "same";
    };

    // Check if we have any styles to display
    if (selectedElementStyles.length === 0) {
      return (
        <div
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderBottom: isExpanded ? "1px solid #cbd5e1" : "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <IconChevronDown size={14} color="#64748b" />
            ) : (
              <IconChevronRight size={14} color="#64748b" />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Element Details</span>
          </div>
          {isExpanded && (
            <div style={{ padding: 10 }}>
              <div style={{ color: "#1e40af", fontWeight: 600, marginBottom: 8 }}>
                {elementSelector} {"{"}
              </div>
              <div style={{ paddingLeft: 16, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>
                /* All CSS properties grouped by category */
              </div>
              <div style={{ color: "#1e40af", fontWeight: 600 }}>{"}"}</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            borderBottom: isExpanded ? "1px solid #cbd5e1" : "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              flex: 1,
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <IconChevronDown size={14} color="#64748b" />
            ) : (
              <IconChevronRight size={14} color="#64748b" />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Element Details Diff</span>
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                background: "#e2e8f0",
                borderRadius: 999,
                padding: "1px 6px",
              }}
            >
              {selectedElementStyles.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              style={{
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 600,
                border: "1px solid #cbd5e1",
                borderRadius: 4,
                background: abDiffMode ? "#3b82f6" : "#ffffff",
                color: abDiffMode ? "#ffffff" : "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setAbDiffMode(!abDiffMode);
              }}
              title="Toggle A/B Diff Mode"
            >
              <IconArrowsLeftRight size={12} />
              A/B
            </button>
            {abDiffMode && (
              <>
                <button
                  style={{
                    padding: "3px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    border: "1px solid #10b981",
                    borderRadius: 3,
                    background: "#10b981",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnapshotA([...selectedElementStyles]);
                  }}
                  title="Capture Snapshot A"
                >
                  A
                </button>
                <button
                  style={{
                    padding: "3px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    border: "1px solid #f59e0b",
                    borderRadius: 3,
                    background: "#f59e0b",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnapshotB([...selectedElementStyles]);
                  }}
                  title="Capture Snapshot B"
                >
                  B
                </button>
              </>
            )}
          </div>
        </div>
        {isExpanded && (
          <div style={{ padding: 10 }}>
            {!abDiffMode ? (
              // Normal view
              <>
                <div style={{ color: "#1e40af", fontWeight: 600, marginBottom: 8 }}>
                  {elementSelector} {"{"}
                </div>
                <div style={{ paddingLeft: 16, marginBottom: 8 }}>
                  {/* Group and display all CSS properties by category */}
                  {categories.map((category) => {
                    const categoryItems = grouped.map.get(category.key) || [];
                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={category.key} style={{ marginBottom: 12 }}>
                        <div style={{ color: "#64748b", fontStyle: "italic", fontSize: 11, marginBottom: 4 }}>
                          /* {category.title} */
                        </div>
                        {categoryItems.map(([property, value]) => (
                          <div key={property} style={{ marginBottom: 2 }}>
                            <span style={{ color: category.color, fontWeight: 600 }}>{property}</span>
                            <span style={{ color: "#334155" }}>: </span>
                            <span style={{ color: "#334155" }}>{String(value)}</span>
                            <span style={{ color: "#334155" }}>;</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Custom properties */}
                  {grouped.customVars.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: "#64748b", fontStyle: "italic", fontSize: 11, marginBottom: 4 }}>
                        /* Custom Properties */
                      </div>
                      {grouped.customVars.map(([property, value]) => (
                        <div key={property} style={{ marginBottom: 2 }}>
                          <span style={{ color: "#0ea5e9", fontWeight: 600 }}>{property}</span>
                          <span style={{ color: "#334155" }}>: </span>
                          <span style={{ color: "#334155" }}>{String(value)}</span>
                          <span style={{ color: "#334155" }}>;</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Other uncategorized properties */}
                  {grouped.other.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: "#64748b", fontStyle: "italic", fontSize: 11, marginBottom: 4 }}>
                        /* Other */
                      </div>
                      {grouped.other.map(([property, value]) => (
                        <div key={property} style={{ marginBottom: 2 }}>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>{property}</span>
                          <span style={{ color: "#334155" }}>: </span>
                          <span style={{ color: "#334155" }}>{String(value)}</span>
                          <span style={{ color: "#334155" }}>;</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ color: "#1e40af", fontWeight: 600 }}>{"}"}</div>
              </>
            ) : (
              // A/B Diff view
              <div style={{ display: "flex", gap: 16 }}>
                {/* Snapshot A */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#10b981",
                      marginBottom: 8,
                      padding: "4px 8px",
                      background: "#f0fdf4",
                      borderRadius: 4,
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    Snapshot A ({snapshotA.length} properties)
                  </div>
                  <div style={{ color: "#1e40af", fontWeight: 600, marginBottom: 8 }}>
                    {elementSelector} {"{"}
                  </div>
                  <div style={{ paddingLeft: 16, marginBottom: 8 }}>
                    {categories.map((category) => {
                      const categoryItemsA = groupedA.map.get(category.key) || [];
                      const categoryItemsB = groupedB.map.get(category.key) || [];
                      const allProps = new Set([
                        ...categoryItemsA.map(([prop]) => prop),
                        ...categoryItemsB.map(([prop]) => prop),
                      ]);

                      if (allProps.size === 0) return null;

                      return (
                        <div key={category.key} style={{ marginBottom: 12 }}>
                          <div style={{ color: "#64748b", fontStyle: "italic", fontSize: 11, marginBottom: 4 }}>
                            /* {category.title} */
                          </div>
                          {Array.from(allProps).map((property) => {
                            const valueA = categoryItemsA.find(([prop]) => prop === property)?.[1];
                            const valueB = categoryItemsB.find(([prop]) => prop === property)?.[1];
                            const status = getDiffStatus(property, valueA, valueB);

                            const getBackgroundColor = () => {
                              switch (status) {
                                case "removed":
                                  return "#fef2f2";
                                case "changed":
                                  return "#fefbef";
                                case "same":
                                  return "transparent";
                                default:
                                  return "transparent";
                              }
                            };

                            const getBorderColor = () => {
                              switch (status) {
                                case "removed":
                                  return "#fecaca";
                                case "changed":
                                  return "#fed7aa";
                                default:
                                  return "transparent";
                              }
                            };

                            if (valueA === undefined) return null;

                            return (
                              <div
                                key={property}
                                style={{
                                  marginBottom: 2,
                                  background: getBackgroundColor(),
                                  border: `1px solid ${getBorderColor()}`,
                                  borderRadius: 3,
                                  padding: status === "same" ? 0 : 2,
                                }}
                              >
                                <span style={{ color: category.color, fontWeight: 600 }}>{property}</span>
                                <span style={{ color: "#334155" }}>: </span>
                                <span style={{ color: "#334155" }}>{String(valueA)}</span>
                                <span style={{ color: "#334155" }}>;</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ color: "#1e40af", fontWeight: 600 }}>{"}"}</div>
                </div>

                {/* Snapshot B */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#f59e0b",
                      marginBottom: 8,
                      padding: "4px 8px",
                      background: "#fffbeb",
                      borderRadius: 4,
                      border: "1px solid #fed7aa",
                    }}
                  >
                    Snapshot B ({snapshotB.length} properties)
                  </div>
                  <div style={{ color: "#1e40af", fontWeight: 600, marginBottom: 8 }}>
                    {elementSelector} {"{"}
                  </div>
                  <div style={{ paddingLeft: 16, marginBottom: 8 }}>
                    {categories.map((category) => {
                      const categoryItemsA = groupedA.map.get(category.key) || [];
                      const categoryItemsB = groupedB.map.get(category.key) || [];
                      const allProps = new Set([
                        ...categoryItemsA.map(([prop]) => prop),
                        ...categoryItemsB.map(([prop]) => prop),
                      ]);

                      if (allProps.size === 0) return null;

                      return (
                        <div key={category.key} style={{ marginBottom: 12 }}>
                          <div style={{ color: "#64748b", fontStyle: "italic", fontSize: 11, marginBottom: 4 }}>
                            /* {category.title} */
                          </div>
                          {Array.from(allProps).map((property) => {
                            const valueA = categoryItemsA.find(([prop]) => prop === property)?.[1];
                            const valueB = categoryItemsB.find(([prop]) => prop === property)?.[1];
                            const status = getDiffStatus(property, valueA, valueB);

                            const getBackgroundColor = () => {
                              switch (status) {
                                case "added":
                                  return "#f0fdf4";
                                case "changed":
                                  return "#fefbef";
                                case "same":
                                  return "transparent";
                                default:
                                  return "transparent";
                              }
                            };

                            const getBorderColor = () => {
                              switch (status) {
                                case "added":
                                  return "#bbf7d0";
                                case "changed":
                                  return "#fed7aa";
                                default:
                                  return "transparent";
                              }
                            };

                            if (valueB === undefined) return null;

                            return (
                              <div
                                key={property}
                                style={{
                                  marginBottom: 2,
                                  background: getBackgroundColor(),
                                  border: `1px solid ${getBorderColor()}`,
                                  borderRadius: 3,
                                  padding: status === "same" ? 0 : 2,
                                }}
                              >
                                <span style={{ color: category.color, fontWeight: 600 }}>{property}</span>
                                <span style={{ color: "#334155" }}>: </span>
                                <span style={{ color: "#334155" }}>{String(valueB)}</span>
                                <span style={{ color: "#334155" }}>;</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ color: "#1e40af", fontWeight: 600 }}>{"}"}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "monospace", fontSize: 13 }}>
      <ElementDetailsSection />
      {categories.map((c) => (
        <Section key={c.key} title={c.title} color={c.color} items={grouped.map.get(c.key) || []} />
      ))}
      {/* Custom properties (CSS variables) */}
      <Section title="Custom Properties" color="#0ea5e9" items={grouped.customVars} />
    </div>
  );
};
