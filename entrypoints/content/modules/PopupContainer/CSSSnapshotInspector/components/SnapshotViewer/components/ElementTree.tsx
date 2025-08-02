import React from "react";
import { ElementTreeProps } from "../types";
import { TreeNode } from "./TreeNode";
import { IconInfoCircle } from "@tabler/icons-react";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";

/**
 * Component for displaying elements in a tree view
 * Supports diff visualization with color coding and change markers
 */
export const ElementTree: React.FC<ElementTreeProps> = ({
  root,
  selectedElement,
  onElementSelect,
  expandedNodes,
  toggleNode,
  comparisonRoot,
  showDiff = false,
}) => {
  if (!root) {
    return (
      <div style={{ padding: "16px", color: "#666" }}>
        <p>No elements available to display in tree view.</p>
      </div>
    );
  }

  return (
    <TreeNode
      node={root}
      path={[]}
      level={0}
      selectedElement={selectedElement}
      onSelect={onElementSelect}
      expandedNodes={expandedNodes}
      toggleNode={toggleNode}
      comparisonNode={comparisonRoot}
      showDiff={showDiff}
    />
  );
};