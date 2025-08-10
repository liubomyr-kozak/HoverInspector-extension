import React, { useMemo, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { DOMTreeNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import { CacheProvider } from "@emotion/react";
import { getEmotionCache } from "./emotionCache";
import { useEmotionShadowDOMSync } from "./useEmotionShadowDOMSync";
import { DiffMethod } from "@entrypoints/shared/components/react-diff-viewer-continued/src/compute-lines";
import DiffViewer, { LineData } from "@entrypoints/shared/components/react-diff-viewer-continued/src";
import { setXPath } from "@entrypoints/content/store/highlight/highlightSlice";
import { AppDispatch } from "@entrypoints/content/store/createStore";

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

  // Add inline styles if present
  if (node.inlineStyles && Object.keys(node.inlineStyles).length > 0) {
    const styleString = Object.entries(node.inlineStyles)
      .map(([property, value]) => `${property}: ${value}`)
      .join("; ");
    result += ` style="${styleString}"`;
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

// Utility function to convert CSS selector path to XPath
const cssPathToXPath = (cssPath: string): string => {
  if (!cssPath) return "";

  // Split by > and clean up
  const segments = cssPath
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);

  // Convert each segment to XPath format
  const xpathSegments = segments.map((segment) => {
    // Handle cases like "div#id.class1.class2[attr=value]"
    let tagName = segment.replace(/[#.\[].*/g, ""); // Extract just the tag name

    if (!tagName) {
      tagName = "*"; // If no tag name, use wildcard
    }

    return `//${tagName.toLowerCase()}`;
  });

  // If we have segments, join them; otherwise use the original path as-is
  if (xpathSegments.length > 0) {
    // For now, just use the last segment as a simple XPath
    // This is a basic implementation - could be enhanced later
    const lastSegment = segments[segments.length - 1];
    let tagName = lastSegment.replace(/[#.\[].*/g, "");
    if (!tagName) tagName = "*";
    return `//${tagName.toLowerCase()}`;
  }

  return cssPath; // Fallback to original path
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

  // Add inline styles if present
  if (node.inlineStyles && Object.keys(node.inlineStyles).length > 0) {
    const styleString = Object.entries(node.inlineStyles)
      .map(([property, value]) => `${property}: ${value}`)
      .join("; ");
    openTag += ` style="${styleString}"`;
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
        // do not change the structure of metadata, do not touch  xpath
        // xpath
      },
    });
    return lines;
  }

  // Otherwise, add children
  openTag += ">";
  lines.push({
    text: openTag,
    metadata: {
      ...node,
      nodeType: "opening",
      level,
      // do not change the structure of metadata, do not touch  xpath
      // xpath
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
      ...node,
      nodeType: "closing",
      level,
      // do not change the structure of metadata, do not touch  xpath
      // xpath
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

  // console.log("😀😀😀 ::ReactDiffViewer -> treeA", treeA);

  const oldValue = useMemo(() => convertTreeToStringV2(treeA), [treeA]);
  const newValue = useMemo(() => convertTreeToStringV2(treeB), [treeB]);

  // console.log("🌟🌟🌟 ::ReactDiffViewer -> oldValue", oldValue, newValue);

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

  const dispatch = useDispatch<AppDispatch>();

  const handleLineClick = (lineId: string, metadata: any) => {
    console.log("🌟🌟🌟 ::handleLineClick -> lineId", lineId);
    console.log("🌟🌟🌟 ::handleLineClick -> metadata", metadata);

    // Extract xpath from metadata if available
    if (metadata && metadata.xpath) {
      // If xpath is a string, convert CSS path to XPath
      const xpathToUse =
        metadata.xpath.optimized ||
        metadata.xpath.absolute ||
        metadata.xpath.withId ||
        metadata.xpath.withClasses ||
        metadata.xpath.withAttributes;

      if (xpathToUse) {
        console.log("Setting XPath for highlight:", xpathToUse);

        dispatch(setXPath(xpathToUse));
      } else {
        console.warn("No valid XPath found in metadata:", metadata.xpath);
      }
    } else {
      console.warn("No metadata or xpath found for clicked line");
    }
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
