import React, { useState, useMemo, useRef, useEffect } from "react";
import { IconHistory, IconGitCompare, IconCode, IconEdit, IconCheck } from "@tabler/icons-react";
import {
  ComparisonContainer,
  ComparisonHeader,
  ComparisonTitle,
  SecondaryButton,
  EmptyState,
} from "../../CSSSnapshotInspector.styled.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

import { TreeDiffView } from "./components/TreeDiffView/TreeDiffView";
import { SummaryPanel } from "./components/SummaryPanel";
import { SnapshotCompareProps } from "./types";
import { CSSSnapshot } from "../../types";
import { getStylesFromSnapshot, compareSnapshots } from "./utils";
import { saveSnapshots, loadSnapshots } from "../../utils/snapshotStorage";

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({ snapshotA, snapshotB, onBack }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<boolean>(false);
  const elementListRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // State for editable titles
  const [titleA, setTitleA] = useState<string>(snapshotA.title);
  const [titleB, setTitleB] = useState<string>(snapshotB.title);
  const [editingTitleA, setEditingTitleA] = useState<boolean>(false);
  const [editingTitleB, setEditingTitleB] = useState<boolean>(false);

  const stylesA = getStylesFromSnapshot(snapshotA);
  const stylesB = getStylesFromSnapshot(snapshotB);
  
  // Function to save updated snapshot title
  const saveSnapshotTitle = async (snapshot: CSSSnapshot, newTitle: string, isSnapshotA: boolean) => {
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
      if (isSnapshotA) {
        setEditingTitleA(false);
      } else {
        setEditingTitleB(false);
      }
    } catch (error) {
      console.error('Failed to update snapshot title:', error);
      // Revert to original title on error
      if (isSnapshotA) {
        setTitleA(snapshot.title);
        setEditingTitleA(false);
      } else {
        setTitleB(snapshot.title);
        setEditingTitleB(false);
      }
    }
  };

  const comparison = useMemo(() => {
    return compareSnapshots(stylesA, stylesB);
  }, [stylesA, stylesB]);

  // Function to scroll to and highlight an element in the list
  const scrollToAndHighlightElement = (path: string) => {
    const element = elementRefs.current[path];
    if (element && elementListRef.current) {
      // Calculate position relative to the container
      const containerRect = elementListRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Scroll the element into view
      elementListRef.current.scrollTop =
        elementRect.top - containerRect.top + elementListRef.current.scrollTop - containerRect.height / 2;

      // Highlight the element
      element.style.transition = "background-color 0.3s ease";
      element.style.backgroundColor = "rgba(26, 115, 232, 0.1)";
      setTimeout(() => {
        if (element) {
          element.style.backgroundColor = "";
        }
      }, 1000);
    }
  };

  useEffect(() => {
    if (comparison.length > 0 && !selectedElement) {
      // Find first element with changes
      const firstChanged = comparison.find(
        (item) => item.changeType === "changed" || item.changeType === "added" || item.changeType === "removed",
      );
      if (firstChanged) {
        setSelectedElement(firstChanged.path);
        scrollToAndHighlightElement(firstChanged.path);
      } else if (comparison[0]) {
        setSelectedElement(comparison[0].path);
      }
    }
  }, [comparison, selectedElement]);

  return (
    <ComparisonContainer>
      <SummaryPanel comparison={comparison} />
      <ComparisonHeader style={{ borderBottom: "1px solid #dadce0", padding: "16px", backgroundColor: "#f8f9fa" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <SecondaryButton
            onClick={onBack}
            style={{
              marginRight: "16px",
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #dadce0",
              backgroundColor: "white",
            }}
          >
            <IconHistory size={16} style={{ marginRight: "6px" }} />
            Back to Snapshots
          </SecondaryButton>
          <ComparisonTitle style={{ fontSize: "18px", fontWeight: 500, color: "#202124" }}>
            CSS Snapshot Comparison
          </ComparisonTitle>
        </div>
        
        {/* Snapshot Titles with Edit Functionality */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontWeight: 500, color: "#d73a49", minWidth: "100px" }}>Snapshot A:</div>
            {editingTitleA ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="text"
                  value={titleA}
                  onChange={(e) => setTitleA(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #dadce0",
                    fontSize: "14px",
                    width: "250px",
                  }}
                  autoFocus
                />
                <SecondaryButton
                  onClick={() => saveSnapshotTitle(snapshotA, titleA, true)}
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>{titleA}</span>
                <SecondaryButton
                  onClick={() => setEditingTitleA(true)}
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
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontWeight: 500, color: "#22863a", minWidth: "100px" }}>Snapshot B:</div>
            {editingTitleB ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="text"
                  value={titleB}
                  onChange={(e) => setTitleB(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #dadce0",
                    fontSize: "14px",
                    width: "250px",
                  }}
                  autoFocus
                />
                <SecondaryButton
                  onClick={() => saveSnapshotTitle(snapshotB, titleB, false)}
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>{titleB}</span>
                <SecondaryButton
                  onClick={() => setEditingTitleB(true)}
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
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <Tooltip content="Full Component Tree Diff">
            <SecondaryButton
              style={{
                backgroundColor: "rgba(26, 115, 232, 0.1)",
                color: "#1a73e8",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                padding: "6px",
              }}
            >
              <IconCode size={18} />
            </SecondaryButton>
          </Tooltip>

          <Tooltip content={diffMode ? "Standard View" : "Side-by-Side Git Diff View"}>
            <SecondaryButton
              onClick={() => setDiffMode(!diffMode)}
              style={{
                backgroundColor: diffMode ? "rgba(26, 115, 232, 0.1)" : "white",
                color: diffMode ? "#1a73e8" : "#5f6368",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                padding: "6px",
                marginLeft: "8px",
              }}
            >
              <IconGitCompare size={18} />
            </SecondaryButton>
          </Tooltip>
        </div>
      </ComparisonHeader>
      {comparison.length === 0 ? (
        <EmptyState>
          <p>No differences found between snapshots</p>
          <p>Try comparing different snapshots or check if the elements are visible</p>
        </EmptyState>
      ) : (
        <TreeDiffView
          filteredElements={comparison!}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          scrollToAndHighlightElement={scrollToAndHighlightElement}
          stylesA={stylesA}
          stylesB={stylesB}
          elementRefs={elementRefs}
          diffMode={diffMode}
        />
      )}
    </ComparisonContainer>
  );
};
