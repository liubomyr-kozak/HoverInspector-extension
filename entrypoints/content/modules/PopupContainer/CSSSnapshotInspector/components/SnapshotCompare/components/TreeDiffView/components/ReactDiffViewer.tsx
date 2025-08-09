import React, { useMemo } from "react";
import { default as ReactDiffViewersContinued } from "react-diff-viewer-continued";
import { DOMTreeNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import { DiffMethod } from "react-diff-viewer-continued/lib/src/compute-lines";

interface ReactDiffViewerProps {
  treeA: DOMTreeNode;
  treeB: DOMTreeNode;
  splitView?: boolean;
}

/**
 * Converts a DOM tree node to a string representation for diffing
 */
const convertTreeToString = (node: DOMTreeNode, level = 0): string => {
  const indent = "  ".repeat(level);

  // Start with the opening tag
  let result = `${indent}<${node.tagName}`;

  // Add ID if present
  if (node.id) {
    result += ` id="${node.id}"`;
  }

  // Add classes if present
  if (node.classes && node.classes.length > 0) {
    result += ` class="${node.classes.join(" ")}"`;
  }

  // Add attributes if present
  if (node.attributes) {
    Object.entries(node.attributes).forEach(([key, value]) => {
      if (key !== "id" && key !== "class") {
        // Skip id and class as they're already handled
        result += ` ${key}="${value}"`;
      }
    });
  }

  // If there are styles, add them
  // if (node.styles && Object.keys(node.styles).length > 0) {
  //   const styleStr = Object.entries(node.styles)
  //     .map(([key, value]) => `${key}: ${value}`)
  //     .join("; ");
  //   result += ` style="${styleStr}"`;
  // }

  // If there are no children, close the tag
  if (!node.children || node.children.length === 0) {
    result += " />\n";
    return result;
  }

  // Otherwise, add children
  result += ">\n";

  // Add each child
  if (node.children) {
    node.children.forEach((child) => {
      result += convertTreeToString(child, level + 1);
    });
  }

  // Close the tag
  result += `${indent}</${node.tagName}>\n`;

  return result;
};

/**
 * Component that uses react-diff-viewer-continued to display DOM tree diffs
 */
export const ReactDiffViewer: React.FC<ReactDiffViewerProps> = ({ treeA, treeB, splitView = true }) => {
  // Convert trees to string representation for diffing
  const oldValue = useMemo(() => convertTreeToString(treeA), [treeA]);
  const newValue = useMemo(() => convertTreeToString(treeB), [treeB]);

  console.log("😎😎😎 ::ReactDiffViewer -> oldValue", oldValue);
  console.log("👍👍👍 ::ReactDiffViewer -> newValue", newValue);

  return (
    <ReactDiffViewersContinued
      oldValue={oldValue}
      newValue={newValue}
      splitView={splitView}
      useDarkTheme={false}
      compareMethod={DiffMethod.WORDS}
      leftTitle="Snapshot A"
      rightTitle="Snapshot B"
      styles={{
        contentText: {
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "1.5",
        },
      }}
    />
  );
};
