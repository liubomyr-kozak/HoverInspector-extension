import React, { memo, useMemo } from "react";
import { IconChevronDown, IconChevronRight, IconInfoCircle } from "@tabler/icons-react";
import { TreeNodeProps } from "../types";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";

/**
 * Determines the change type between two nodes
 */
const getChangeType = (node: any, comparisonNode: any): "added" | "removed" | "modified" | "unchanged" => {
  if (!comparisonNode) return "added";
  if (!node) return "removed";

  // Check if styles are different
  const nodeStyles = node.styles || {};
  const comparisonStyles = comparisonNode.styles || {};

  const nodeStyleKeys = Object.keys(nodeStyles);
  const comparisonStyleKeys = Object.keys(comparisonStyles);

  // If different number of styles, consider it modified
  if (nodeStyleKeys.length !== comparisonStyleKeys.length) return "modified";

  // Check if any style values are different
  for (const key of nodeStyleKeys) {
    if (nodeStyles[key] !== comparisonStyles[key]) {
      return "modified";
    }
  }

  // Check if attributes are different
  const nodeAttrs = node.attributes || {};
  const comparisonAttrs = comparisonNode.attributes || {};

  const nodeAttrKeys = Object.keys(nodeAttrs);
  const comparisonAttrKeys = Object.keys(comparisonAttrs);

  // If different number of attributes, consider it modified
  if (nodeAttrKeys.length !== comparisonAttrKeys.length) return "modified";

  // Check if any attribute values are different
  for (const key of nodeAttrKeys) {
    if (nodeAttrs[key] !== comparisonAttrs[key]) {
      return "modified";
    }
  }

  return "unchanged";
};

/**
 * TreeNode component for tree view
 * Supports diff visualization with color coding and change markers
 */
export const TreeNode = memo<TreeNodeProps>(
  ({ node, path, level, selectedElement, onSelect, expandedNodes, toggleNode, comparisonNode, showDiff = false }) => {
    debugger;

    const currentPath = [...path, `${node.tag}${node.elementId ? `#${node.elementId}` : ""}`];
    const pathString = currentPath.join(" > ");
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(pathString);
    const isSelected = selectedElement === node.id;

    // Find matching node in comparison tree if diff mode is enabled
    const matchingComparisonNode = useMemo(() => {
      if (!showDiff || !comparisonNode) return null;

      // Try to find a node with the same path
      const findNodeByPath = (root: any, targetPath: string[]): any => {
        if (!root) return null;

        const rootPath = [...path, `${root.tag}${root.elementId ? `#${root.elementId}` : ""}`];
        const rootPathString = rootPath.join(" > ");

        if (rootPathString === targetPath.join(" > ")) {
          return root;
        }

        if (root.children && root.children.length > 0) {
          for (const child of root.children) {
            const result = findNodeByPath(child, targetPath);
            if (result) return result;
          }
        }

        return null;
      };

      return findNodeByPath(comparisonNode, currentPath);
    }, [comparisonNode, currentPath, path, showDiff]);

    // Determine change type if in diff mode
    const changeType = useMemo(() => {
      if (!showDiff) return null;
      return getChangeType(node, matchingComparisonNode);
    }, [node, matchingComparisonNode, showDiff]);

    // Count style changes
    const styleChanges = useMemo(() => {
      if (!showDiff || !matchingComparisonNode) return { added: 0, removed: 0, modified: 0 };

      const nodeStyles = node.styles || {};
      const comparisonStyles = matchingComparisonNode.styles || {};

      const added = Object.keys(nodeStyles).filter((key) => !comparisonStyles[key]).length;
      const removed = Object.keys(comparisonStyles).filter((key) => !nodeStyles[key]).length;

      let modified = 0;
      for (const key of Object.keys(nodeStyles)) {
        if (comparisonStyles[key] && nodeStyles[key] !== comparisonStyles[key]) {
          modified++;
        }
      }

      return { added, removed, modified };
    }, [node, matchingComparisonNode, showDiff]);

    const elementData = {
      tagName: node.tag,
      id: node.elementId || null,
      classes: node.classes || [],
      styles: node.styles || {},
      bounds: node.bounds,
      attributes: node.attributes,
      path: pathString,
    };

    // Create change indicators for diff mode
    const changeIndicator = useMemo(() => {
      if (!showDiff) return null;

      const { added, removed, modified } = styleChanges;

      if (changeType === "added") {
        return <span style={{ color: "#22863a", marginLeft: "8px" }}>[+]</span>;
      } else if (changeType === "removed") {
        return <span style={{ color: "#b31d28", marginLeft: "8px" }}>[-]</span>;
      } else if (changeType === "modified") {
        return (
          <span style={{ marginLeft: "8px" }}>
            {removed > 0 && <span style={{ color: "#b31d28" }}>[-{removed}]</span>}
            {added > 0 && <span style={{ color: "#22863a" }}>[+{added}]</span>}
            {modified > 0 && <span style={{ color: "#ea8600" }}>[~{modified}]</span>}
          </span>
        );
      }

      return null;
    }, [changeType, showDiff, styleChanges]);

    // Create change summary for tooltip
    const changeSummary = useMemo(() => {
      if (!showDiff || changeType === "unchanged") return null;

      const { added, removed, modified } = styleChanges;

      const parts = [
        added > 0 ? `${added} added` : "",
        removed > 0 ? `${removed} removed` : "",
        modified > 0 ? `${modified} modified` : "",
      ].filter(Boolean);

      return parts.join(", ");
    }, [changeType, showDiff, styleChanges]);

    // Determine background color based on change type
    const getBackgroundColor = () => {
      if (isSelected) return "#e8f0fe";

      if (showDiff) {
        switch (changeType) {
          case "added":
            return "rgba(46, 160, 67, 0.08)";
          case "removed":
            return "rgba(248, 81, 73, 0.08)";
          case "modified":
            return "rgba(246, 185, 59, 0.08)";
          default:
            return "transparent";
        }
      }

      return "transparent";
    };

    // Determine border color based on change type
    const getBorderColor = () => {
      if (isSelected) return "#1976d2";

      if (showDiff) {
        switch (changeType) {
          case "added":
            return "#2ea043";
          case "removed":
            return "#f85149";
          case "modified":
            return "#f6b93b";
          default:
            return "transparent";
        }
      }

      return "transparent";
    };

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px",
            paddingLeft: `${level * 16 + 8}px`,
            cursor: "pointer",
            backgroundColor: getBackgroundColor(),
            borderRadius: "6px",
            marginBottom: "2px",
            borderLeft: showDiff && changeType !== "unchanged" ? `3px solid ${getBorderColor()}` : "none",
            border: isSelected ? "2px solid #1976d2" : "2px solid transparent",
            transition: "all 0.2s ease",
          }}
        >
          {hasChildren && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(pathString);
              }}
              style={{ marginRight: "8px" }}
            >
              {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </div>
          )}
          {!hasChildren && <div style={{ width: "24px" }} />}
          <div
            onClick={() => onSelect(pathString, { ...elementData, nodeId: node.id })}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div>
              <div
                style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color:
                      showDiff && changeType === "removed"
                        ? "#b31d28"
                        : showDiff && changeType === "added"
                          ? "#22863a"
                          : "inherit",
                  }}
                >
                  &lt;{elementData.tagName.toLowerCase()}
                  {elementData.id && `#${elementData.id}`}
                  {elementData.classes?.length > 0 && `.${elementData.classes.join(".")}`}
                  {!hasChildren ? " \\>" : ">"}
                </span>
                {changeIndicator}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                {Object.keys(elementData.styles || {}).length} styles
              </div>
            </div>

            {showDiff && changeSummary && (
              <Tooltip content={changeSummary}>
                <div style={{ marginLeft: "8px", cursor: "help" }}>
                  <IconInfoCircle size={14} color="#5f6368" />
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any, index: number) => {
              // Find matching child in comparison tree
              let matchingChild = null;
              if (showDiff && matchingComparisonNode && matchingComparisonNode.children) {
                const childPath = [...currentPath, `${child.tag}${child.elementId ? `#${child.elementId}` : ""}`];
                const childPathString = childPath.join(" > ");

                // Try to find a matching child by path
                matchingChild = matchingComparisonNode.children.find((c: any) => {
                  const cPath = [...currentPath, `${c.tag}${c.elementId ? `#${c.elementId}` : ""}`];
                  return cPath.join(" > ") === childPathString;
                });
              }

              return (
                <TreeNode
                  key={`${pathString}-${index}`}
                  node={child}
                  path={currentPath}
                  level={level + 1}
                  selectedElement={selectedElement}
                  onSelect={onSelect}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  comparisonNode={matchingComparisonNode}
                  showDiff={showDiff}
                />
              );
            })}

            {/* Render removed nodes that exist in comparison but not in current tree */}
            {showDiff && matchingComparisonNode && matchingComparisonNode.children && (
              <>
                {matchingComparisonNode.children.map((compChild: any, index: number) => {
                  const compChildPath = [
                    ...currentPath,
                    `${compChild.tag}${compChild.elementId ? `#${compChild.elementId}` : ""}`,
                  ];
                  const compChildPathString = compChildPath.join(" > ");

                  // Check if this child exists in the current tree
                  const exists = node.children.some((c: any) => {
                    const cPath = [...currentPath, `${c.tag}${c.elementId ? `#${c.elementId}` : ""}`];
                    return cPath.join(" > ") === compChildPathString;
                  });

                  // If it doesn't exist, render it as removed
                  if (!exists) {
                    return (
                      <div
                        key={`removed-${compChildPathString}-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px",
                          paddingLeft: `${(level + 1) * 16 + 8}px`,
                          backgroundColor: "rgba(248, 81, 73, 0.08)",
                          borderRadius: "6px",
                          marginBottom: "2px",
                          borderLeft: "3px solid #f85149",
                        }}
                      >
                        <div style={{ width: "24px" }} />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: "500",
                              fontSize: "14px",
                              marginBottom: "4px",
                              display: "flex",
                              alignItems: "center",
                              color: "#b31d28",
                            }}
                          >
                            {compChild.tag.toLowerCase()}
                            {compChild.elementId && `#${compChild.elementId}`}
                            {compChild.classes?.length > 0 && `.${compChild.classes.join(".")}`}
                            <span style={{ color: "#b31d28", marginLeft: "8px" }}>[-]</span>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                            }}
                          >
                            {Object.keys(compChild.styles || {}).length} styles
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </>
            )}
          </div>
        )}
      </div>
    );
  },
);
