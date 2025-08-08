import React, { useState, useMemo, useCallback } from "react";
import { IconHistory, IconSearch, IconEdit, IconCheck, IconGitCompare } from "@tabler/icons-react";
import {
  ComparisonContainer,
  ComparisonHeader,
  ComparisonTitle,
  SecondaryButton,
  FilterContainer,
  FilterInput,
  EmptyState,
} from "../../CSSSnapshotInspector.styled";
import { SnapshotViewerProps } from "./types";
import { useSnapshotFilter } from "../../hooks/useSnapshots";
import { shouldSkipProperty, isDefaultValue, CSSSnapshot } from "../../types";
import { saveSnapshots, loadSnapshots } from "../../utils/snapshotStorage";
import { ElementDetails } from "./components/ElementDetails";
import { ElementHighlight } from "./components/ElementHighlight";
import { DOMTreeRenderer } from "../../components/DOMTreeRenderer";
import { useDOMTree } from "../../hooks/useDOMTree";
import { ElementStyleData } from "../../utils/domTreeBuilder";
import { DetailsOverlay } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotCompare/components/TreeDiffView/TreeDiffView.styled.ts";
import { createCSSSnapshot } from "../../utils/snapshotBuilder";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

/**
 * Main component for viewing snapshot details
 */
export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ snapshot, onBack }) => {
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [selectedElementData, setSelectedElementData] = useState<any>(null);
  const [isCreatingCurrentSnapshot, setIsCreatingCurrentSnapshot] = useState<boolean>(false);
  
  // State for editable title
  const [title, setTitle] = useState<string>(snapshot.title);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  
  // Function to create a snapshot of the current page and compare with the displayed snapshot
  const handleCompareWithCurrentPage = async () => {
    try {
      setIsCreatingCurrentSnapshot(true);
      
      // Create a snapshot of the current page
      const currentPageSnapshot = await createCSSSnapshot("Current Page");
      
      // Open the comparison view with the current snapshot and the displayed snapshot
      // We need to use window.postMessage to communicate with the parent component
      window.postMessage({
        type: "COMPARE_SNAPSHOTS",
        snapshots: [snapshot, currentPageSnapshot]
      }, "*");
      
      setIsCreatingCurrentSnapshot(false);
    } catch (error) {
      console.error("Failed to create current page snapshot:", error);
      setIsCreatingCurrentSnapshot(false);
      alert("Failed to create current page snapshot. Please try again.");
    }
  };
  
  // Function to save updated snapshot title
  const saveSnapshotTitle = async (newTitle: string) => {
    try {
      // Create updated snapshot with new title
      const updatedSnapshot = {
        ...snapshot,
        title: newTitle
      };
      
      // Get all snapshots and update the specific one
      const allSnapshots = await loadSnapshots();
      const updatedSnapshots = allSnapshots.map(s => 
        s.id === snapshot.id ? updatedSnapshot : s
      );
      
      // Save updated snapshots
      await saveSnapshots(updatedSnapshots);
      
      // Exit editing mode
      setEditingTitle(false);
    } catch (error) {
      console.error('Failed to update snapshot title:', error);
      // Revert to original title on error
      setTitle(snapshot.title);
      setEditingTitle(false);
    }
  };

  // Generate list of elements from snapshot tree and convert to format for DOMTreeRenderer
  const elements = useMemo(() => {
    const result: Array<{ path: string; element: any; nodeId: number }> = [];

    const traverseNode = (node: any, path: string[] = []) => {
      const currentPath = [...path, `${node.tag}${node.elementId ? `#${node.elementId}` : ""}`];
      const pathString = currentPath.join(" > ");

      result.push({
        path: pathString,
        nodeId: node.id,
        element: {
          tagName: node.tag,
          id: node.elementId || null,
          classes: node.classes || [],
          styles: node.styles || {},
          bounds: node.bounds,
          attributes: node.attributes,
        },
      });

      // Recursively traverse child elements
      for (const child of node.children || []) {
        traverseNode(child, currentPath);
      }
    };

    if (snapshot.root) {
      traverseNode(snapshot.root);
    }

    return result;
  }, [snapshot.root]);

  // Convert elements to format expected by DOMTreeRenderer
  const stylesData = useMemo(() => {
    const data: Record<string, ElementStyleData> = {};

    elements.forEach(({ path, element }) => {
      data[path] = {
        tagName: element.tagName,
        id: element.id,
        classes: element.classes,
        styles: element.styles,
        attributes: element.attributes,
        bounds: element.bounds,
      };
    });

    return data;
  }, [elements]);

  // Use the DOM tree hook to build the tree
  const { tree } = useDOMTree({ stylesData });

  // Create pseudo-snapshots for using the filter hook
  const pseudoSnapshots = useMemo(() => [snapshot], [snapshot]);
  const { filter, setFilter } = useSnapshotFilter(pseudoSnapshots);

  // Filter elements based on search query
  const filteredElements = useMemo(() => {
    if (!filter) return elements;

    const lowerFilter = filter.toLowerCase();
    return elements.filter(({ path, element }) => {
      const searchText = [
        path,
        element.tagName,
        element.id || "",
        ...(element.classes || []),
        Object.keys(element.styles || {}).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(lowerFilter);
    });
  }, [elements, filter]);

  // Get styles of selected element
  const selectedElementStyles = useMemo(() => {
    if (!selectedElement) return [];

    const elementData = elements.find(({ nodeId }) => nodeId === selectedElement);
    if (!elementData) return [];

    const styles = elementData.element.styles || {};
    return Object.entries(styles)
      .filter(([property, value]) => {
        if (shouldSkipProperty(property)) return false;
        if (isDefaultValue(String(value))) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [elements, selectedElement]);

  // Handle element selection for DOMTreeRenderer
  const handleElementSelect = useCallback(
    (path: string, treeNode?: any) => {
      // Find the element in our original elements array by path
      const foundElement = elements.find((el) => el.path === path);
      if (foundElement) {
        setSelectedElement(foundElement.nodeId);
        setSelectedElementData({
          ...foundElement.element,
          nodeId: foundElement.nodeId,
          path: foundElement.path,
        });
      }
    },
    [elements],
  );

  return (
    <ComparisonContainer>
      {/* Highlight overlay for selected element */}
      {/*{selectedElementData && (*/}
      {/*  <ElementHighlight selectedElementData={selectedElementData} />*/}
      {/*)}*/}

      <ComparisonHeader>
        <ComparisonTitle>
          <IconHistory size={20} />
          Snapshot Details
        </ComparisonTitle>
        <div style={{ display: "flex", gap: "8px" }}>
          <Tooltip content="Compare with current page">
            <SecondaryButton 
              onClick={handleCompareWithCurrentPage} 
              disabled={isCreatingCurrentSnapshot}
              style={{
                backgroundColor: "#f0f4ff",
                color: "#1a73e8",
                border: "1px solid #dadce0",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <IconGitCompare size={16} />
              {isCreatingCurrentSnapshot ? "Creating Snapshot..." : "Check Diff with Current Page"}
            </SecondaryButton>
          </Tooltip>
          <SecondaryButton onClick={onBack} aria-label="Go back to snapshots list">
            Back to List
          </SecondaryButton>
        </div>
      </ComparisonHeader>

      {/* Snapshot information */}
      <div
        style={{
          padding: "16px",
          fontSize: "14px",
          color: "#666",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
        }}
      >
        {editingTitle ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #dadce0",
                fontSize: "14px",
                width: "250px",
                fontWeight: "bold",
              }}
              autoFocus
            />
            <SecondaryButton
              onClick={() => saveSnapshotTitle(title)}
              style={{
                padding: "4px",
                borderRadius: "4px",
                border: "1px solid #dadce0",
                backgroundColor: "#e6f4ea",
                color: "#137333",
              }}
            >
              <IconCheck size={16} />
            </SecondaryButton>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
            <strong>{title}</strong>
            <SecondaryButton
              onClick={() => setEditingTitle(true)}
              style={{
                padding: "4px",
                borderRadius: "4px",
                border: "1px solid #dadce0",
                backgroundColor: "white",
              }}
            >
              <IconEdit size={16} />
            </SecondaryButton>
          </div>
        )}
        • {new Date(snapshot.timestamp).toLocaleString()} • {snapshot.elementCount}{" "}
        elements • {new URL(snapshot.url).hostname}
      </div>

      {/* Search panel */}
      <FilterContainer>
        <div style={{ position: "relative" }}>
          <IconSearch
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
            }}
          />
          <FilterInput
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter elements by selector, tag, id, or class..."
            style={{ paddingLeft: "36px" }}
            aria-label="Filter elements"
          />
        </div>
      </FilterContainer>

      {filteredElements.length === 0 ? (
        <EmptyState>
          <p>No elements found matching "{filter}"</p>
        </EmptyState>
      ) : (
        <div className="relative">
          {filter && filteredElements.length !== elements.length ? (
            <div style={{ padding: "16px", color: "#666" }}>
              <p>Tree view is not available when filtering is active.</p>
              <p>Please clear the filter or switch to list view to see filtered results.</p>
            </div>
          ) : (
            <DOMTreeRenderer
              tree={tree}
              selectedElement={selectedElement?.toString()}
              onElementSelect={handleElementSelect}
              showStatistics={true}
            />
          )}
          <DetailsOverlay
            className="sticky top-0 self-start max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ElementDetails
              selectedElement={selectedElement}
              selectedElementData={selectedElementData}
              selectedElementStyles={selectedElementStyles}
            />
          </DetailsOverlay>
        </div>
      )}
    </ComparisonContainer>
  );
};
