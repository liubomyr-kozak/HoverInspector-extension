/**
 * Reusable DOM Tree Renderer Component
 * Pure rendering component for displaying DOM tree structure
 * Can be used in both single snapshot view and comparison view
 */

import React, { useState, useCallback } from "react";
import { IconChevronRight, IconChevronDown, IconEye, IconEyeOff } from "@tabler/icons-react";
import { DOMTreeNode } from "../utils/domTreeBuilder";

export interface DOMTreeRendererProps {
  /** Root node of the tree */
  tree: DOMTreeNode;
  /** Currently selected element path */
  selectedElement?: string | null;
  /** Callback when element is selected */
  onElementSelect?: (path: string, element: DOMTreeNode) => void;
  /** Callback when element is hovered */
  onElementHover?: (path: string | null, element: DOMTreeNode | null) => void;
  /** Show element details on click */
  onShowDetails?: (path: string, element: DOMTreeNode) => void;
  /** Custom rendering for change indicators (for diff mode) */
  renderChangeIndicator?: (element: DOMTreeNode) => React.ReactNode;
  /** Custom styling for elements */
  getElementStyle?: (element: DOMTreeNode) => React.CSSProperties;
  /** Show element statistics */
  showStatistics?: boolean;
}

interface TreeNodeRendererProps {
  node: DOMTreeNode;
  level: number;
  selectedElement?: string | null;
  onElementSelect?: (path: string, element: DOMTreeNode) => void;
  onElementHover?: (path: string | null, element: DOMTreeNode | null) => void;
  onShowDetails?: (path: string, element: DOMTreeNode) => void;
  renderChangeIndicator?: (element: DOMTreeNode) => React.ReactNode;
  getElementStyle?: (element: DOMTreeNode) => React.CSSProperties;
}

/**
 * Main DOM Tree Renderer Component
 */
export const DOMTreeRenderer: React.FC<DOMTreeRendererProps> = ({
  tree,
  selectedElement,
  onElementSelect,
  onElementHover,
  onShowDetails,
  renderChangeIndicator,
  getElementStyle,
  showStatistics = false,
}) => {
  if (!tree.children || tree.children.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
        <p>No elements to display</p>
      </div>
    );
  }

  return (
    <div style={{ fontSize: "14px", fontFamily: "monospace" }}>
      {/* Tree Header */}
      {showStatistics && (
        <div
          style={{
            padding: "8px",
            borderBottom: "1px solid #e1e4e8",
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "#666" }}>{tree.children.length} root elements</span>
        </div>
      )}

      {/* Tree Nodes */}
      <div style={{ padding: "8px 0" }}>
        {tree.children.map((child) => (
          <TreeNodeRenderer
            key={child.path}
            node={child}
            level={0}
            selectedElement={selectedElement}
            onElementSelect={onElementSelect}
            onElementHover={onElementHover}
            onShowDetails={onShowDetails}
            renderChangeIndicator={renderChangeIndicator}
            getElementStyle={getElementStyle}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual Tree Node Renderer
 */
const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
  node,
  level,
  selectedElement,
  onElementSelect,
  onElementHover,
  onShowDetails,
  renderChangeIndicator,
  getElementStyle,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedElement === node.path;
  const indentSize = 20;
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onElementSelect?.(node.path, node);
    },
    [node, onElementSelect],
  );

  const handleDetailsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onShowDetails?.(node.path, node);
    },
    [node, onShowDetails],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onElementHover?.(node.path, node);
  }, [node, onElementHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onElementHover?.(null, null);
  }, [onElementHover]);

  // Get custom styles if provided
  const customStyle = getElementStyle?.(node) || {};

  const nodeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    paddingLeft: `${level * indentSize + 8}px`,
    cursor: "pointer",
    backgroundColor: isSelected ? "#e1f5fe" : isHovered ? "#f5f5f5" : "transparent",
    borderRadius: "4px",
    marginBottom: "2px",
    transition: "background-color 0.15s ease",
    ...customStyle,
  };

  return (
    <>
      <div style={nodeStyle} onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Indentation space for hierarchy */}
        <span style={{ width: "22px" }} />

        {/* Element Info */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <span style={{ color: "#0969da", fontWeight: 500 }}>&lt;{node.tagName}</span>

          {node.id && <span style={{ color: "#953800" }}>#{node.id}</span>}

          {node.classes.length > 0 && <span style={{ color: "#116329" }}>.{node.classes.join(".")}</span>}

          <span style={{ color: "#0969da" }}>{hasChildren ? ">" : " />"}</span>

          {/* Style count */}
          {Object.keys(node.styles).length > 0 && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "11px",
                color: "#656d76",
                background: "#f6f8fa",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
              onClick={handleDetailsClick}
            >
              {Object.keys(node.styles).length} styles
            </span>
          )}
        </div>
      </div>

      {hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRenderer
              key={child.path}
              node={child}
              level={level + 1}
              selectedElement={selectedElement}
              onElementSelect={onElementSelect}
              onElementHover={onElementHover}
              onShowDetails={onShowDetails}
              renderChangeIndicator={renderChangeIndicator}
              getElementStyle={getElementStyle}
            />
          ))}

          <div
            style={{
              ...nodeStyle,
              paddingLeft: `${(level + 2) * indentSize + 8}px`,
              color: "#0969da",
              fontSize: "13px",
              padding: "2px 8px",
            }}
          >
            &lt;/{node.tagName}&gt;
          </div>
        </div>
      )}
    </>
  );
};
