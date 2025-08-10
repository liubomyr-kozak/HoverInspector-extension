import React, { useState, memo } from "react";
import { IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { SnapshotNode, ComparisonResult, ChangeType } from "../types";
import { Added, Removed, Changed } from "../CSSSnapshotInspector.styled";

interface TreeViewProps {
  readonly tree: readonly SnapshotNode[];
  readonly comparison: ComparisonResult | null;
  readonly selectedPath: string | null;
  readonly onNodeSelect: (path: string) => void;
}

interface TreeNodeProps {
  readonly node: SnapshotNode;
  readonly comparison: ComparisonResult | null;
  readonly selectedPath: string | null;
  readonly onSelect: (path: string) => void;
  readonly level: number;
}

const TreeNode = memo<TreeNodeProps>(({ node, comparison, selectedPath, onSelect, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  // Convert path array to string for comparison
  const pathString = node.path.join(" > ");
  const isSelected = pathString === selectedPath;
  const nodeComparison = comparison?.elements.find((e) => e.path === pathString);
  const changeType: ChangeType = nodeComparison?.type || ChangeType.UNCHANGED;

  const renderChangeIndicator = (type: ChangeType) => {
    switch (type) {
      case ChangeType.ADDED:
        return <Added>Added</Added>;
      case ChangeType.REMOVED:
        return <Removed>Removed</Removed>;
      case ChangeType.MODIFIED:
        return <Changed>Changed</Changed>;
      default:
        return null;
    }
  };

  const handleClick = () => {
    onSelect(pathString);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={{ marginLeft: level * 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "4px",
          backgroundColor: isSelected ? "#e3f2fd" : "transparent",
          borderRadius: "4px",
          borderLeft:
            changeType !== ChangeType.UNCHANGED
              ? `3px solid ${
                  changeType === ChangeType.ADDED
                    ? "#137333"
                    : changeType === ChangeType.REMOVED
                      ? "#c5221f"
                      : "#ea8600"
                }`
              : "none",
        }}
        onClick={handleClick}
      >
        {hasChildren && (
          <div onClick={handleToggle} style={{ marginRight: "4px" }}>
            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </div>
        )}
        <span>{node.tag}</span>
        {node.id && <span style={{ color: "#666" }}>#{node.id}</span>}
        {node.classes.length > 0 && <span style={{ color: "#999" }}>.{node.classes.join(".")}</span>}
        {renderChangeIndicator(changeType)}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path.join("-")}-${index}`}
              node={child}
              comparison={comparison}
              selectedPath={selectedPath}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = "TreeNode";

export const TreeView = memo<TreeViewProps>(({ tree, comparison, selectedPath, onNodeSelect }) => {
  if (!tree || tree.length === 0) {
    return <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No elements to display</div>;
  }

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      {tree.map((node, index) => (
        <TreeNode
          key={`${node.path.join("-")}-${index}`}
          node={node}
          comparison={comparison}
          selectedPath={selectedPath}
          onSelect={onNodeSelect}
          level={0}
        />
      ))}
    </div>
  );
});

TreeView.displayName = "TreeView";
