import { LoadingState } from "@entrypoints/shared/components/LoadingState";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { DOMTreeNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import { CacheProvider } from "@emotion/react";
import { getEmotionCache } from "./emotionCache";
import { useEmotionShadowDOMSync } from "./useEmotionShadowDOMSync";
import DiffViewer from "@entrypoints/shared/components/DiffViewerWrapper";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { openElementDetails } from "@entrypoints/content/store/elementDetails/elementDetails.slice";
import { AppDispatch } from "@entrypoints/content/store/createStore";
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

/** pathString -> computed style properties whose value differs between the two trees */
type ChangedStylesMap = Map<string, string[]>;

const collectNodesByPath = (node: DOMTreeNode, collection = new Map<string, DOMTreeNode>()) => {
  if (node.pathString) {
    collection.set(node.pathString, node);
  }
  node.children?.forEach((child) => collectNodesByPath(child, collection));
  return collection;
};

/**
 * Logical/derived properties that always mirror another computed property
 * (block-size = height, transform-origin follows the size, ...). Listing them
 * would only repeat the same change several times.
 */
const DERIVED_STYLE_PROPERTY =
  /^(?:(?:min-|max-)?(?:block|inline)-size|(?:margin|padding|inset|border)-(?:block|inline)(?:-.+)?|perspective-origin|transform-origin)$/;

/**
 * Finds elements present in both trees whose computed styles changed. The markup
 * lines alone don't carry computed styles, so without this a style-only change
 * (e.g. a colour tweak) produced an empty diff.
 */
const computeChangedStyles = (
  nodesA: Map<string, DOMTreeNode>,
  nodesB: Map<string, DOMTreeNode>,
): ChangedStylesMap => {
  const changed: ChangedStylesMap = new Map();
  nodesA.forEach((left, path) => {
    const right = nodesB.get(path);
    if (!right) return;
    const leftStyles = left.styles || {};
    const rightStyles = right.styles || {};
    const keys = new Set([...Object.keys(leftStyles), ...Object.keys(rightStyles)]);
    const diff = [...keys]
      .filter((key) => leftStyles[key] !== rightStyles[key] && !DERIVED_STYLE_PROPERTY.test(key))
      .sort();
    if (diff.length) changed.set(path, diff);
  });
  return changed;
};

/** Extra lines listing the changed computed styles of an element, shown under its tag */
const styleLinesFor = (node: DOMTreeNode, level: number, changedStyles?: ChangedStylesMap): LineData[] => {
  const keys = changedStyles?.get(node.pathString);
  if (!keys) return [];
  const indent = "  ".repeat(level + 1);
  return keys.map((key) => ({
    text: `${indent}/* style */ ${key}: ${node.styles?.[key] ?? "(not set)"};`,
    metadata: { ...node, nodeType: "style", level, styleProperty: key },
  }));
};

/**
 * Converts a DOM tree node to LineData format for diffing with metadata support
 */
const convertTreeToStringV2 = (node: DOMTreeNode, level = 0, changedStyles?: ChangedStylesMap): LineData[] => {
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
    lines.push(...styleLinesFor(node, level, changedStyles));
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
  lines.push(...styleLinesFor(node, level, changedStyles));

  // Add each child
  if (node.children) {
    node.children.forEach((child) => {
      lines.push(...convertTreeToStringV2(child, level + 1, changedStyles));
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
  // Same tree on both sides = single snapshot view (no diff to compute)
  const isSingleTree = treeA === treeB;

  const nodesA = useMemo(() => collectNodesByPath(treeA), [treeA]);
  const nodesB = useMemo(() => (isSingleTree ? nodesA : collectNodesByPath(treeB)), [treeB, isSingleTree, nodesA]);
  const changedStyles = useMemo(
    () => (isSingleTree ? undefined : computeChangedStyles(nodesA, nodesB)),
    [isSingleTree, nodesA, nodesB],
  );

  const oldValue = useMemo(() => convertTreeToStringV2(treeA, 0, changedStyles), [treeA, changedStyles]);
  const newValue = useMemo(
    () => (isSingleTree ? oldValue : convertTreeToStringV2(treeB, 0, changedStyles)),
    [treeB, changedStyles, isSingleTree, oldValue],
  );

  // Element style comparison is computed lazily, only for the element that was clicked
  const getStyleComparison = (pathString: string) => {
    const leftNode = nodesA.get(pathString) || null;
    const rightNode = nodesB.get(pathString) || null;
    if (!leftNode && !rightNode) return undefined;
    const styleDiff = createElementDiff(leftNode, rightNode, false);
    return {
      styleDiff,
      leftNode,
      rightNode,
      showIdentity: false,
      showBounds: false,
      changedAttrs: [],
      changedStyles: Object.keys(styleDiff.leftData),
    };
  };

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

      if (pathString && (nodesA.has(pathString) || nodesB.has(pathString))) {
        compareData = getStyleComparison(pathString);
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

  // Line id ("L12" / "R12") -> metadata of the element on that line
  const lineMetadataMap = useMemo(() => {
    const metadataMap = new Map<string, any>();
    oldValue.forEach((lineData, index) => {
      if (lineData.metadata) metadataMap.set(`L${index + 1}`, lineData.metadata);
    });
    newValue.forEach((lineData, index) => {
      if (lineData.metadata) metadataMap.set(`R${index + 1}`, lineData.metadata);
    });
    return metadataMap;
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

  if (isSingleTree) {
    return <ClickableTreeLines lines={oldValue} onLineClick={(index) => handleLineClick(`L${index + 1}`, oldValue[index].metadata)} />;
  }

  // Two snapshots with the same tree: say so, and keep the listing keyboard-navigable like a single tree
  const isIdentical =
    oldValue.length === newValue.length && oldValue.every((line, index) => line.text === newValue[index].text);
  if (isIdentical) {
    return (
      <div>
        <p role="status" style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#15803d" }}>
          No differences found
        </p>
        <ClickableTreeLines lines={oldValue} onLineClick={(index) => handleLineClick(`L${index + 1}`, oldValue[index].metadata)} />
      </div>
    );
  }

  if (!cache || !shadowContainer) {
    return <LoadingState inline label="Loading the diff…" />;
  }

  return (
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
      wrapLines
    />
  );
};

/**
 * Read-only tree listing for a single snapshot: every line is clickable and opens
 * the element details (and highlights the element on the page).
 */
const ClickableTreeLines: React.FC<{ lines: LineData[]; onLineClick: (index: number) => void }> = ({
  lines,
  onLineClick,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  // One tab stop for the whole tree; arrow keys move between lines, Enter or Space opens one
  const [active, setActive] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tabStop = Math.min(active, Math.max(0, lines.length - 1));

  const focusLine = (index: number) => {
    const next = Math.max(0, Math.min(lines.length - 1, index));
    setActive(next);
    containerRef.current?.querySelector<HTMLElement>(`[data-tree-line="${next}"]`)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowDown: tabStop + 1,
      ArrowUp: tabStop - 1,
      PageDown: tabStop + 10,
      PageUp: tabStop - 10,
      Home: 0,
      End: lines.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      focusLine(moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onLineClick(tabStop);
    }
  };

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Snapshot elements. Use the arrow keys to move, Enter to show details"
      onKeyDown={onKeyDown}
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        lineHeight: "20px",
        padding: "8px 0",
        overflowX: "auto",
      }}
      onMouseLeave={() => setHovered(null)}
    >
      {lines.map((line, index) => {
        const isClosing = line.metadata?.nodeType === "closing";
        return (
          <div
            key={index}
            role="button"
            data-tree-line={index}
            tabIndex={index === tabStop ? 0 : -1}
            title={line.metadata?.displayName ? `Show details for ${line.metadata.displayName}` : undefined}
            onClick={() => {
              setActive(index);
              onLineClick(index);
            }}
            onFocus={() => {
              setActive(index);
              setHovered(index);
            }}
            onMouseEnter={() => setHovered(index)}
            style={{
              whiteSpace: "pre",
              padding: "0 12px",
              cursor: "pointer",
              color: isClosing ? "#6b7280" : "#1f2937",
              background: hovered === index ? "#eef2ff" : "transparent",
              // Inset, so the scroll container doesn't clip the ring
              outlineOffset: -2,
            }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
};
