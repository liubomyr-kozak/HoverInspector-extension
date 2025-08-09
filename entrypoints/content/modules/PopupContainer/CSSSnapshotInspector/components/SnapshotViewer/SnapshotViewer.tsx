import React, { useState } from "react";
import { IconHistory, IconEdit, IconCheck, IconGitCompare } from "@tabler/icons-react";
import {
  ComparisonContainer,
  ComparisonHeader,
  ComparisonTitle,
  SecondaryButton,
} from "../../CSSSnapshotInspector.styled";
import { SnapshotViewerProps } from "./types";
import { CSSSnapshot } from "../../types";
import { saveSnapshots, loadSnapshots } from "../../utils/snapshotStorage";
import { SnapshotDetails } from "./components/SnapshotDetails";
import { createCSSSnapshot } from "../../utils/snapshotBuilder";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

/**
 * Main component for viewing snapshot details
 */
export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ snapshot, onBack }) => {
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
      window.postMessage(
        {
          type: "COMPARE_SNAPSHOTS",
          snapshots: [snapshot, currentPageSnapshot],
        },
        "*",
      );

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
        title: newTitle,
      };

      // Get all snapshots and update the specific one
      const allSnapshots = await loadSnapshots();
      const updatedSnapshots = allSnapshots.map((s) => (s.id === snapshot.id ? updatedSnapshot : s));

      // Save updated snapshots
      await saveSnapshots(updatedSnapshots);

      // Exit editing mode
      setEditingTitle(false);
    } catch (error) {
      console.error("Failed to update snapshot title:", error);
      // Revert to original title on error
      setTitle(snapshot.title);
      setEditingTitle(false);
    }
  };

  return (
    <ComparisonContainer>
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
            Snapshot Details
          </ComparisonTitle>
        </div>

        {/* Editable title */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {editingTitle ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
          • {new Date(snapshot.timestamp).toLocaleString()} • {snapshot.elementCount} elements •{" "}
          {new URL(snapshot.url).hostname}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <Tooltip content="Compare with Current Page">
            <SecondaryButton
              onClick={handleCompareWithCurrentPage}
              disabled={isCreatingCurrentSnapshot}
              style={{
                backgroundColor: "#e6f4ea",
                color: "#137333",
                border: "1px solid #34d058",
                borderRadius: "4px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <IconGitCompare size={16} />
              {isCreatingCurrentSnapshot ? "Creating..." : "Compare with Current"}
            </SecondaryButton>
          </Tooltip>
        </div>
      </ComparisonHeader>

      {/* Snapshot Details using new component */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SnapshotDetails 
          snapshot={snapshot}
        />
      </div>
    </ComparisonContainer>
  );
};
