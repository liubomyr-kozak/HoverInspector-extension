import React, { useMemo } from "react";
import { IconX } from "@tabler/icons-react";
import { ElementListProps } from "../../types";
import { ElementDetails } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotViewer/components/ElementDetails";
import { DetailsOverlay, DetailsHeader, CloseButton } from "./TreeDiffView.styled";
import { useNodeDetails } from "./hooks/useNodeDetails";
import { DOMTreeRenderer } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/DOMTreeRenderer";
import { useTreeComparison } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/hooks/useTreeComparison";
import {
  buildDOMTree,
  DOMTreeNode,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";

/**
 * Component for displaying a hierarchical tree view of elements with GitHub-style diff indicators
 * Shows component changes with [+] and [-] indicators and allows expanding style diffs
 */
export const TreeDiffView: React.FC<ElementListProps> = ({
  filteredElements,
  selectedElement,
  setSelectedElement,
  scrollToAndHighlightElement,
  stylesA,
  stylesB,
  elementRefs,
}) => {
  const { nodeDetailsPath, nodeDetailsData, showNodeDetails, closeNodeDetails } = useNodeDetails(stylesA, stylesB);

  // Use the comparison hook to get tree data and comparison results
  const { comparison, summary, treeA, treeB } = useTreeComparison({
    stylesA,
    stylesB,
    options: {
      comparePositions: true,
      compareAttributes: true,
    },
    diffOnly: true, // Only return diff nodes, not all nodes
  });

  // Create a filtered tree that only includes nodes with changes
  const mergedTree = useMemo(() => {
    // Create an empty root node with the same structure as treeB
    const mergedRoot: DOMTreeNode = {
      tagName: treeB.tagName,
      path: treeB.path,
      id: treeB.id,
      classes: [...treeB.classes],
      styles: { ...treeB.styles },
      attributes: { ...(treeB.attributes || {}) },
      bounds: treeB.bounds ? { ...treeB.bounds } : undefined,
      children: []
    };

    // Function to find the parent path for a given path
    const getParentPath = (path: string): string => {
      const segments = path.split(">");
      segments.pop(); // Remove the last segment
      return segments.join(">");
    };

    // Function to ensure parent nodes exist in the tree
    const ensureParentExists = (path: string): DOMTreeNode => {
      if (path === "" || path === mergedRoot.path) return mergedRoot;

      const segments = path.split(">");
      let currentPath = "";
      let currentNode = mergedRoot;

      // Skip the first segment if it's empty (for paths starting with >)
      const startIndex = segments[0] === "" ? 1 : 0;

      // Build the path segment by segment, creating nodes as needed
      for (let i = startIndex; i < segments.length; i++) {
        currentPath = currentPath ? `${currentPath}>${segments[i]}` : segments[i];
        
        // Check if this node already exists in our tree
        let found = false;
        for (const child of currentNode.children) {
          if (child.path === currentPath) {
            currentNode = child;
            found = true;
            break;
          }
        }

        // If not found, create it by finding the original node in treeB
        if (!found) {
          // Find the original node in treeB to copy its properties
          const originalNode = findNodeInTree(treeB, currentPath);
          
          if (originalNode) {
            const newNode: DOMTreeNode = {
              tagName: originalNode.tagName,
              path: originalNode.path,
              id: originalNode.id,
              classes: [...originalNode.classes],
              styles: { ...originalNode.styles },
              attributes: { ...(originalNode.attributes || {}) },
              bounds: originalNode.bounds ? { ...originalNode.bounds } : undefined,
              children: []
            };
            
            currentNode.children.push(newNode);
            currentNode = newNode;
          } else {
            // If we can't find the original, create a minimal node
            const newNode: DOMTreeNode = {
              tagName: segments[i],
              path: currentPath,
              id: "",
              classes: [],
              styles: {},
              children: []
            };
            
            currentNode.children.push(newNode);
            currentNode = newNode;
          }
        }
      }

      return currentNode;
    };

    // Function to find a node in the tree by path
    const findNodeInTree = (tree: DOMTreeNode, path: string): DOMTreeNode | null => {
      if (tree.path === path) return tree;

      for (const child of tree.children) {
        const found = findNodeInTree(child, path);
        if (found) return found;
      }

      return null;
    };

    // Add all modified nodes
    comparison.modified.forEach((modifiedNode) => {
      const parentPath = getParentPath(modifiedNode.path);
      const parentNode = ensureParentExists(parentPath);
      
      // Create a copy of the modified node from elementB (newer version)
      const nodeCopy: DOMTreeNode = {
        ...JSON.parse(JSON.stringify(modifiedNode.elementB)),
        children: [] // Start with empty children, we'll add them if needed
      };
      
      parentNode.children.push(nodeCopy);
    });

    // Add all added nodes
    comparison.added.forEach((addedNode) => {
      const parentPath = getParentPath(addedNode.path);
      const parentNode = ensureParentExists(parentPath);
      
      // Create a copy of the added node
      const nodeCopy: DOMTreeNode = {
        ...JSON.parse(JSON.stringify(addedNode)),
        children: [] // Start with empty children, we'll add them if needed
      };
      
      parentNode.children.push(nodeCopy);
    });

    // Add all removed nodes
    comparison.removed.forEach((removedNode) => {
      const parentPath = getParentPath(removedNode.path);
      const parentNode = ensureParentExists(parentPath);
      
      // Create a copy of the removed node
      const nodeCopy: DOMTreeNode = {
        ...JSON.parse(JSON.stringify(removedNode)),
        children: [] // Start with empty children, we'll add them if needed
      };
      
      parentNode.children.push(nodeCopy);
    });

    return mergedRoot;
  }, [treeB, comparison.added, comparison.removed, comparison.modified]);

  // Custom change indicator for diff display
  const renderChangeIndicator = (element: any) => {
    // Check if element has changes
    const addedElement = comparison.added.find((e) => e.path === element.path);
    const removedElement = comparison.removed.find((e) => e.path === element.path);
    const modifiedElement = comparison.modified.find((e) => e.path === element.path);

    if (addedElement) {
      return (
        <div>
          <span style={{ color: "#22863a", marginLeft: "8px" }}>[+]</span>
          <div style={{ fontSize: "10px", color: "#666", marginLeft: "8px", marginTop: "2px" }}>
            In snapshot B
          </div>
        </div>
      );
    }
    if (removedElement) {
      return (
        <div>
          <span style={{ color: "#d73a49", marginLeft: "8px" }}>[-]</span>
          <div style={{ fontSize: "10px", color: "#666", marginLeft: "8px", marginTop: "2px" }}>
            In snapshot A
          </div>
        </div>
      );
    }
    if (modifiedElement) {
      const { styleChanges, attributeChanges } = modifiedElement;
      return (
        <div>
          <span style={{ marginLeft: "8px", fontSize: "11px" }}>
            {styleChanges.length > 0 && <span style={{ color: "#f9c513" }}>[~{styleChanges.length}]</span>}
            {attributeChanges.length > 0 && <span style={{ color: "#6f42c1" }}>[↔{attributeChanges.length}]</span>}
          </span>
          <div style={{ fontSize: "10px", color: "#666", marginLeft: "8px", marginTop: "2px" }}>
            Changed from A to B
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom styling for changed elements
  const getElementStyle = (element: any) => {
    const addedElement = comparison.added.find((e) => e.path === element.path);
    const removedElement = comparison.removed.find((e) => e.path === element.path);
    const modifiedElement = comparison.modified.find((e) => e.path === element.path);

    if (addedElement) {
      return {
        backgroundColor: "#e6ffec",
        borderLeft: "3px solid #22863a",
      };
    }
    if (removedElement) {
      return {
        backgroundColor: "#ffebe9",
        borderLeft: "3px solid #d73a49",
        opacity: 0.6,
      };
    }
    if (modifiedElement) {
      return {
        backgroundColor: "#fff8c5",
        borderLeft: "3px solid #f9c513",
      };
    }
    return {};
  };

  const handleElementSelect = (path: string, element: any) => {
    setSelectedElement?.(path);
    scrollToAndHighlightElement?.(path);
  };

  return (
    <div className="relative">
      <DOMTreeRenderer
        tree={mergedTree}
        selectedElement={selectedElement}
        onElementSelect={handleElementSelect}
        onShowDetails={(path, element) => showNodeDetails(path, element)}
        renderChangeIndicator={renderChangeIndicator}
        getElementStyle={getElementStyle}
      />

      {nodeDetailsPath && nodeDetailsData && (
        <DetailsOverlay
          className="sticky top-0 self-start max-h-screen overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DetailsHeader>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Element Details</h3>
            <CloseButton onClick={closeNodeDetails}>
              <IconX size={16} />
            </CloseButton>
          </DetailsHeader>

          <ElementDetails
            selectedElement={selectedElement as unknown as number}
            selectedElementData={nodeDetailsData}
            selectedElementStyles={Object.entries(nodeDetailsData.styles || {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([property, value]) => [property, String(value)])}
          />
        </DetailsOverlay>
      )}
    </div>
  );
};
