import React, { useMemo, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { DOMTreeNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import { CacheProvider } from "@emotion/react";
import { getEmotionCache } from "./emotionCache";
import { useEmotionShadowDOMSync } from "./useEmotionShadowDOMSync";
import DiffViewer from "@entrypoints/shared/components/DiffViewerWrapper";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { openElementDetails } from "@entrypoints/content/store/elementDetails/elementDetails.slice";
import { AppDispatch } from "@entrypoints/content/store/createStore";
import {
  calculateStyleChanges,
  convertToElementSideData,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/styleComparison";
import { createElementDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/simpleDiff";

interface LineData {
  text: string;
  metadata?: any;
}

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
  const highlightManager = useHighlightOverlay();
  const oldValue = useMemo(() => convertTreeToStringV2(treeA), [treeA]);
  const newValue = useMemo(() => convertTreeToStringV2(treeB), [treeB]);

  // OPTIMIZATION: Pre-compute all element style comparisons once
  const preComputedStyleComparisons = useMemo(() => {
    const startTime = performance.now();
    const styleCache = new Map<string, any>();

    // Helper to collect all nodes with their paths from a tree
    const collectAllNodes = (node: DOMTreeNode, collection = new Map<string, DOMTreeNode>()) => {
      if (node.pathString) {
        collection.set(node.pathString, node);
      }
      node.children?.forEach((child) => collectAllNodes(child, collection));
      return collection;
    };

    // Collect all nodes from both trees
    const nodesA = collectAllNodes(treeA);
    const nodesB = collectAllNodes(treeB);

    // Pre-compute style differences for all elements that exist in either tree
    const allPaths = new Set([...nodesA.keys(), ...nodesB.keys()]);

    allPaths.forEach((path) => {
      const leftNode = nodesA.get(path) || null;
      const rightNode = nodesB.get(path) || null;

      if (leftNode || rightNode) {
        // Pre-compute the element diff for this path
        const styleDiff = createElementDiff(leftNode, rightNode, false);

        // Cache the complete comparison data
        styleCache.set(path, {
          styleDiff,
          leftNode,
          rightNode,
          showIdentity: false,
          showBounds: false,
          changedAttrs: [],
          changedStyles: Object.keys(styleDiff.leftData),
        });
      }
    });

    const endTime = performance.now();

    return styleCache;
  }, [treeA, treeB]);

  // Helper: find counterpart node in other tree by pathString if available
  // NOTE: This is kept for backward compatibility but should rarely be used now
  const findCounterpartByPath = (node: any, root: DOMTreeNode): DOMTreeNode | null => {
    if (!node?.pathString) return null;
    // simple DFS search by pathString
    const stack: DOMTreeNode[] = [root];
    while (stack.length) {
      const cur = stack.pop();
      if (cur && cur.pathString === node.pathString) return cur;
      cur?.children?.forEach((c) => stack.push(c));
    }
    return null;
  };

  // Helper: format element details into comparable multiline text
  const formatElementDetails = (n?: Partial<DOMTreeNode> | null): string => {
    if (!n) return "<missing>";
    const lines: string[] = [];
    const title = n.displayName || (n.tagName ? `<${n.tagName}>` : "element");
    lines.push(title);
    if (n.id) lines.push(`id: ${n.id}`);
    if (n.classes && n.classes.length) lines.push(`classes: ${n.classes.join(" ")}`);
    if (n.attributes && Object.keys(n.attributes).length) {
      const attrs = Object.entries(n.attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      lines.push(`attributes: ${attrs}`);
    }
    if (n.xpath && typeof n.xpath === "object") {
      // @ts-ignore
      lines.push(`xpath.optimized: ${n.xpath.optimized || ""}`);
    }
    if (n.bounds) {
      const b = n.bounds as any;
      lines.push(`bounds: {top:${b.top}, left:${b.left}, width:${b.width}, height:${b.height}}`);
    }
    if (n.inlineStyles && Object.keys(n.inlineStyles).length) {
      const styles = Object.entries(n.inlineStyles)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `  ${k}: ${v};`);
      lines.push("inlineStyles:");
      lines.push(...styles);
    }
    if (n.styles && Object.keys(n.styles).length) {
      const styles = Object.entries(n.styles)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `  ${k}: ${v};`);
      lines.push("styles:");
      lines.push(...styles);
    }
    return lines.join("\n");
  };

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
    // Extract data from metadata if available and open details popup
    if (metadata) {
      const attrs = metadata.attributes || {};
      const styles = metadata.styles || {};
      const inlineStyles = metadata.inlineStyles || {};
      const bounds = metadata.bounds;
      const classes = metadata.classes || [];
      const tagName = metadata.tagName;
      const title = metadata.displayName || (tagName ? `<${tagName}>` : undefined);

      // Determine an initial XPath to use and variants if present
      const variants = metadata.xpath as any | undefined;
      const initialXPath =
        variants?.optimized ||
        variants?.absolute ||
        variants?.withId ||
        variants?.withClasses ||
        variants?.withAttributes ||
        undefined;

      // OPTIMIZATION: Use pre-computed style comparisons instead of expensive DFS + on-demand computation
      let compareData: any = undefined;
      const pathString = metadata.pathString;

      if (pathString && preComputedStyleComparisons.has(pathString)) {
        // O(1) lookup from pre-computed cache - much faster than DFS search!
        const cachedComparison = preComputedStyleComparisons.get(pathString);

        compareData = cachedComparison;
      } else {
        // Fallback to old method if pathString is not available (backward compatibility)
        console.warn("⚠️ Falling back to DFS search - pathString not found:", pathString);
        const leftNode = findCounterpartByPath(metadata, treeA);
        const rightNode = findCounterpartByPath(metadata, treeB);

        if (leftNode || rightNode) {
          // Use the simple style diff utility - temporarily show ALL styles for debugging
          const styleDiff = createElementDiff(leftNode, rightNode, false); // Show all styles temporarily for debugging

          compareData = {
            styleDiff, // Simple diff data for ElementDiff component
            // Legacy properties for backward compatibility
            leftNode,
            rightNode,
            showIdentity: false, // We're focusing only on styles now
            showBounds: false, // We're focusing only on styles now
            changedAttrs: [],
            changedStyles: Object.keys(styleDiff.leftData), // All keys are changed since we filter for differences
          };
        }
      }

      dispatch(
        openElementDetails({
          isOpen: true,
          title, // keep original element title
          tagName,
          id: metadata.id,
          classes,
          attributes: attrs,
          styles,
          inlineStyles,
          bounds,
          xpath: initialXPath,
          xpathVariants: variants,
          selectedXPathKey: variants
            ? variants.optimized
              ? "optimized"
              : variants.absolute
                ? "absolute"
                : variants.withId
                  ? "withId"
                  : variants.withClasses
                    ? "withClasses"
                    : "withAttributes"
            : undefined,
          // Pre-computed compare payload for details popup
          compareLeftTitle: compareData ? "Snapshot A" : undefined,
          compareRightTitle: compareData ? "Snapshot B" : undefined,
          compareLeftData: compareData?.leftNode,
          compareRightData: compareData?.rightNode,
          compareConfig: compareData,
          styleDiffData: compareData?.styleDiff, // Pass the simple diff data
        }),
      );
    }

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
        highlightManager.startHighlight(xpathToUse);
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

  // Create a mapping of line numbers to metadata for click handling
  const [lineMetadataMap, setLineMetadataMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const metadataMap = new Map<string, any>();

    // Map old/left side lines
    oldValue.forEach((lineData, index) => {
      const lineNumber = index + 1;
      const lineId = `L${lineNumber}`;
      if (lineData.metadata) {
        metadataMap.set(lineId, lineData.metadata);
      }
    });

    // Map new/right side lines
    newValue.forEach((lineData, index) => {
      const lineNumber = index + 1;
      const lineId = `R${lineNumber}`;
      if (lineData.metadata) {
        metadataMap.set(lineId, lineData.metadata);
      }
    });

    setLineMetadataMap(metadataMap);
  }, [oldValue, newValue]);

  const handleDiffViewerLineClick = (lineId: string, metadata: any, event: React.MouseEvent<HTMLElement>) => {
    // Get metadata from our mapping
    const lineMetadata = lineMetadataMap.get(lineId);
    if (lineMetadata) {
      handleLineClick(lineId, lineMetadata);
    } else {
      console.warn("No metadata found for line:", lineId);
    }
  };

  return (
    // <CacheProvider value={cache}>
    <div>
      {/* Now using the implemented onLineClick functionality */}
      <DiffViewer
        oldValue={oldValue.map((line) => line.text).join("\n")}
        newValue={newValue.map((line) => line.text).join("\n")}
        splitView={splitView}
        useDarkTheme={false}
        leftTitle={splitView ? "Snapshot A" : undefined}
        rightTitle={splitView ? "Snapshot B" : undefined}
        showDiffOnly={showDiffOnly}
        hideLineNumbers={hideLineNumbers}
        onLineClick={handleDiffViewerLineClick}
      />
    </div>
    // </CacheProvider>
  );
};
