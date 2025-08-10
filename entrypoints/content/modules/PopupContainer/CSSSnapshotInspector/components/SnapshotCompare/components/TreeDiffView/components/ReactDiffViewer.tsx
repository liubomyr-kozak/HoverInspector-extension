import React, { useMemo, useState, useEffect } from "react";
import { DOMTreeNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import { CacheProvider } from "@emotion/react";
import { getEmotionCache } from "./emotionCache";
import { useEmotionShadowDOMSync } from "./useEmotionShadowDOMSync";
import { DiffMethod } from "@entrypoints/shared/components/react-diff-viewer-continued/src/compute-lines";
import DiffViewer, { LineData } from "@entrypoints/shared/components/react-diff-viewer-continued/src";

interface ReactDiffViewerProps {
  treeA: DOMTreeNode;
  treeB: DOMTreeNode;
  splitView?: boolean;
  showDiffOnly?: boolean;
  expandAll?: boolean;
  hideLineNumbers?: boolean;
  displaySingleLineNumbers?: boolean;
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
      if (key !== "id" && key !== "class" && key !== "style") {
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
 * Converts a DOM tree node to LineData format for diffing with metadata support
 */
const convertTreeToStringV2 = (node: DOMTreeNode, level = 0): LineData[] => {
  const indent = "  ".repeat(level);
  const lines: LineData[] = [];

  // Start with the opening tag
  let openTag = `${indent}<${node.tagName}`;

  // Add ID if present
  if (node.id) {
    openTag += ` id="${node.id}"`;
  }

  // Add classes if present
  if (node.classes && node.classes.length > 0) {
    openTag += ` class="${node.classes.join(" ")}"`;
  }

  // Add attributes if present
  if (node.attributes) {
    Object.entries(node.attributes).forEach(([key, value]) => {
      if (key !== "id" && key !== "class" && key !== "style") {
        // Skip id and class as they're already handled
        openTag += ` ${key}="${value}"`;
      }
    });
  }

  // If there are no children, close the tag
  if (!node.children || node.children.length === 0) {
    openTag += " />";
    lines.push({
      text: openTag,
      metadata: {
        ...node,
        nodeType: "self-closing",
        level,
      },
    });
    return lines;
  }

  // Otherwise, add children
  openTag += ">";
  lines.push({
    text: openTag,
    metadata: {
      nodeType: "opening",
      tagName: node.tagName,
      level,
      id: node.id,
      classes: node.classes,
      attributes: node.attributes,
    },
  });

  // Add each child
  if (node.children) {
    node.children.forEach((child) => {
      lines.push(...convertTreeToStringV2(child, level + 1));
    });
  }

  // Close the tag
  const closeTag = `${indent}</${node.tagName}>`;
  lines.push({
    text: closeTag,
    metadata: {
      nodeType: "closing",
      tagName: node.tagName,
      level,
    },
  });

  return lines;
};

export const ReactDiffViewer: React.FC<ReactDiffViewerProps> = ({
  treeA,
  treeB,
  splitView = true,
  showDiffOnly = true,
  expandAll = false,
  hideLineNumbers = false,
  displaySingleLineNumbers = false,
}) => {
  // Convert trees to string representation for diffing

  console.log("😀😀😀 ::ReactDiffViewer -> treeA", treeA);

  const oldValue = useMemo(() => convertTreeToStringV2(treeA), [treeA]);
  const newValue = useMemo(() => convertTreeToStringV2(treeB), [treeB]);

  console.log("🌟🌟🌟 ::ReactDiffViewer -> oldValue", oldValue, newValue);

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

  const handleLineClick = (lineId: string, metadata: any) => {
    // event.target is the DOM element that was clicked

    console.log("🌟🌟🌟 ::handleLineClick -> lineId", lineId);
    console.log("🌟🌟🌟 ::handleLineClick -> metadata", metadata);

    debugger;

    // console.log("Clicked node:", clickedNode);
    // console.log("Line:", lineId);
  };

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
        compareMethod={DiffMethod.JSON}
        onLineClick={handleLineClick}
        leftTitle={splitView ? "Snapshot A" : undefined}
        rightTitle={splitView ? "Snapshot B" : undefined}
        container={shadowContainer}
        showDiffOnly={showDiffOnly}
        extraLinesSurroundingDiff={expandAll ? 999999 : 3}
        hideLineNumbers={hideLineNumbers}
        displaySingleLineNumbers={displaySingleLineNumbers}
        styles={{
          contentText: {
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.5",
          },
          // Force hide line numbers with CSS when hideLineNumbers is true
          ...(hideLineNumbers && {
            lineNumber: {
              display: "none !important",
              width: "0 !important",
              maxWidth: "0 !important",
            },
            gutter: {
              display: "none !important",
              width: "0 !important",
              maxWidth: "0 !important",
            },
            codeFoldGutter: {
              display: "none !important",
              width: "0 !important",
              maxWidth: "0 !important",
            },
            emptyGutter: {
              display: "none !important",
              width: "0 !important",
              maxWidth: "0 !important",
            },
            gutterBackground: {
              display: "none !important",
            },
            addedGutterBackground: {
              display: "none !important",
            },
            removedGutterBackground: {
              display: "none !important",
            },
          }),
        }}
      />
    </CacheProvider>
  );
};
