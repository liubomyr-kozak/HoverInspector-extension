import React, { useMemo, useState, useEffect } from "react";
import { DOMTreeNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import { CacheProvider } from "@emotion/react";
import { getEmotionCache } from "./emotionCache";
import { useEmotionShadowDOMSync } from "./useEmotionShadowDOMSync";
import { DiffMethod } from "@entrypoints/shared/components/react-diff-viewer-continued/src/compute-lines";
import DiffViewer from "@entrypoints/shared/components/react-diff-viewer-continued";

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

  // Get shadow DOM container
  const shadowContainer = useMemo(() => {
    const shadowRoot = document.querySelector("hover-inspector")?.shadowRoot as ShadowRoot;
    return shadowRoot?.querySelector("html > head") as HTMLElement;
  }, []);

  // Get emotion cache for shadow DOM
  const cache = useMemo(() => {
    try {
      return getEmotionCache();
    } catch (error) {
      console.error("Failed to create emotion cache:", error);
      return null;
    }
  }, []);

  // Sync emotion styles to shadow DOM
  useEmotionShadowDOMSync();

  // Dynamic import for the local modified diff viewer
  // useEffect(() => {
  //   // Import the local modified version that supports container prop
  //   const importPath = "../../../../../../../react-diff-viewer-continued/lib/index.js";
  //   import(importPath).then((mod) => {
  //     setDiffViewer(() => mod.default);
  //   }).catch((error) => {
  //     console.error("Failed to import local diff viewer:", error);
  //     // Fallback: Try to import from built version
  //     import("../../../../../../../react-diff-viewer-continued/src/index").then((mod) => {
  //       setDiffViewer(() => mod.default);
  //     }).catch((fallbackError) => {
  //       console.error("Failed to import fallback diff viewer:", fallbackError);
  //     });
  //   });
  // }, []);

  if (!cache || !shadowContainer) {
    return <div>Loading diff viewer...</div>;
  }

  return (
    <CacheProvider value={cache}>
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={splitView}
        useDarkTheme={false}
        compareMethod={DiffMethod.WORDS}
        leftTitle="Snapshot A"
        rightTitle="Snapshot B"
        container={shadowContainer}
        styles={{
          contentText: {
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.5",
          },
        }}
      />
    </CacheProvider>
  );
};
