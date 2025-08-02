import React, { useState, useMemo, useRef, useEffect } from "react";
import { IconHistory, IconGitCompare, IconCode } from "@tabler/icons-react";
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
import { getStylesFromSnapshot, compareSnapshots } from "./utils";

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({ snapshotA, snapshotB, onBack }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<boolean>(false);
  const elementListRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const stylesA = getStylesFromSnapshot(snapshotA);
  const stylesB = getStylesFromSnapshot(snapshotB);

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

        <div style={{ display: "flex", gap: "8px" }}>
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

          <Tooltip content={diffMode ? "Standard View" : "GitHub Diff View"}>
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
        />
      )}
    </ComparisonContainer>
  );
};
