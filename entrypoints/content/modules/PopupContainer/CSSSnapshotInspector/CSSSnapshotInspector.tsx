/**
 * Modern CSS Snapshot Inspector with styled-components
 */
import React, { useMemo, useEffect, useCallback } from "react";
import styled from "styled-components";
import { IconCode } from "@tabler/icons-react";
import { MdOutlineCompare } from "react-icons/md";
import { SnapshotManager } from "./SnapshotManager";
import { SnapshotCompare } from "./components/SnapshotCompare/SnapshotCompare.tsx";
import { SnapshotViewer } from "./components/SnapshotViewer";
import { useSnapshots, useSnapshotFilter } from "./hooks/useSnapshots";
import { useViewMode } from "./hooks/useViewMode";
import { exportSnapshot } from "./utils/snapshotStorage";
import { createCurrentSnapshotFor } from "./utils/snapshotBuilder";
import { SnapshotManagerHeader } from "./components/SnapshotManagerHeader";
import { SnapshotViewerHeader } from "./components/SnapshotViewerHeader";
import { SnapshotCompareHeader } from "./components/SnapshotCompareHeader";
import { ViewMode } from "./constants";
import { CSSSnapshot } from "./types";
import { useElementPicker } from "./hooks/useElementPicker";
import { useDispatch } from "react-redux";
import { setError } from "@entrypoints/content/store/snapshot/snapshotSlice";

// Styled Components
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const FilterContainer = styled.div`
  padding: 0 0 10px;
`;

const FilterInputWrapper = styled.div`
  position: relative;
`;

const FilterInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 40px 0 10px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #1f2937;
  transition: all 200ms ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    color: #6b7280;
    background: #f3f4f6;
  }
`;


const ContentArea = styled.div`
  flex: 1;
  min-height: 0;
`;

const ContentWrapper = styled.div`
  height: 100%;
`;

/**
 * Main CSS Snapshot Inspector component, optimised for performance
 */
export const CSSSnapshotInspector: React.FC = () => {
  const dispatch = useDispatch();
  // Optimised hooks

  const {
    snapshots,
    isCapturing,
    selectedSnapshot,
    compareSnapshots,
    captureSnapshot,
    deleteSnapshot,
    renameSnapshot,
    importSnapshot,
    selectSnapshot,
    toggleCompare,
    clearCompare,
    error,
  } = useSnapshots();

  // Debounced filtering hook
  const { filter, setFilter, filteredSnapshots } = useSnapshotFilter(snapshots);

  // State for search visibility
  const [isSearchVisible, setIsSearchVisible] = React.useState(false);

  // Element picker hook with declarative API
  const elementPicker = useElementPicker(snapshots, {
    onSuccess: (snapshot) => {
    },
    onError: (error) => {
      console.error("Element picker error:", error.message);
    },
  });

  // View mode hook
  const { viewMode, setViewMode, canCompare, canViewDetails, viewSnapshot, startComparison, backToList } = useViewMode(
    selectedSnapshot,
    compareSnapshots,
  );

  // State for comparison view controls
  const [activeCompareView, setActiveCompareView] = React.useState<"diff" | "tree" | "stats">("diff");
  const [splitView, setSplitView] = React.useState(false); // unified diff reads better in the narrow panel; split is one click away

  // Back to the list. A comparison with the current page selected an unsaved capture of the page:
  // drop it, else its card stays "Selected" and Compare reuses the stale capture
  const handleBackToList = useCallback(() => {
    if (compareSnapshots.some((compared) => !snapshots.some((saved) => saved.id === compared.id))) {
      clearCompare();
    }
    backToList();
  }, [compareSnapshots, snapshots, clearCompare, backToList]);

  // Handler for viewing a snapshot
  const handleViewSnapshot = (snapshot: typeof selectedSnapshot) => {
    if (snapshot) {
      selectSnapshot(snapshot);
      viewSnapshot(snapshot);
    }
  };

  // Handler for comparing the selected snapshot with the current page
  const handleCompareWithCurrentPage = async (snapshotToCompare?: CSSSnapshot) => {
    let firstSnapshot: CSSSnapshot | null = snapshotToCompare ?? null;

    // Determine which snapshot to compare with based on the current view mode
    if (firstSnapshot) {
      // Explicit snapshot passed (e.g. from a list card)
    } else if (viewMode === ViewMode.DETAIL && selectedSnapshot) {
      firstSnapshot = selectedSnapshot;
    } else if (viewMode === ViewMode.COMPARE && compareSnapshots.length > 0) {
      // Use the first snapshot from the comparison
      firstSnapshot = compareSnapshots[0];
    }

    if (!firstSnapshot) {
      console.error("No snapshot selected for comparison");
      return;
    }


    try {
      // Capture the current page (or the same element, for element snapshots)
      const currentPageSnapshot = await createCurrentSnapshotFor(firstSnapshot);

      // Clear existing comparison snapshots
      clearCompare();

      // Add both snapshots to comparison
      toggleCompare(firstSnapshot);
      toggleCompare(currentPageSnapshot);

      setActiveCompareView("diff");
      // Start comparison view. compareSnapshots in this closure is still the old
      // value, so skip the canCompare check: both snapshots were just queued.
      startComparison(true);

    } catch (error) {
      // Shown in the panel's error box; not a crash
      console.warn("Failed to create current page snapshot:", error);
      dispatch(setError(error instanceof Error ? error.message : "Could not capture the current page"));
    }
  };

  // Handler for starting a comparison
  const handleStartComparison = () => {
    if (canCompare) {
      // Every new comparison opens on the diff, not on whichever view the last one was left in
      setActiveCompareView("diff");
      startComparison();
    }
  };

  // Handler for capturing a snapshot, with error handling
  const handleCaptureSnapshot = async () => {
    try {
      await captureSnapshot();
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
      // The hook already handles the error
    }
  };

  // Handler for toggling search visibility
  const handleToggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    // Clear filter when hiding search
    if (isSearchVisible) {
      setFilter("");
    }
  };

  const handleCaptureFromPickedElement = () => {
    elementPicker.togglePicking();
  };

  // A is the older snapshot, B the newer one, whatever order they were ticked in, so the diff reads
  // "what changed since A"
  const comparePair = [...compareSnapshots].sort((a, b) => a.timestamp - b.timestamp);

  // Recomputed every render: the handlers it passes down are recreated each render anyway
  const renderContent = (() => {
    switch (viewMode) {
      case ViewMode.DETAIL:
        return (
          <SnapshotViewer
            snapshot={selectedSnapshot}
            onBack={handleBackToList}
            onCompareWithCurrentPage={() => handleCompareWithCurrentPage()}
          />
        );

      case ViewMode.COMPARE:
        return (
          <SnapshotCompare
            snapshotA={comparePair[0]}
            snapshotB={comparePair[1]}
            onBack={handleBackToList}
            activeView={activeCompareView}
            setActiveView={setActiveCompareView}
            splitView={splitView}
            setSplitView={setSplitView}
          />
        );

      case ViewMode.LIST:
      default:
        return (
          <SnapshotManager
            snapshots={filteredSnapshots}
            compareSnapshots={compareSnapshots}
            onView={handleViewSnapshot}
            onDelete={deleteSnapshot}
            onExport={exportSnapshot}
            onRename={renameSnapshot}
            onToggleCompare={toggleCompare}
            onCompareWithCurrentPage={handleCompareWithCurrentPage}
            onCapture={handleCaptureSnapshot}
            onPickElement={handleCaptureFromPickedElement}
            isFiltered={snapshots.length > 0 && filteredSnapshots.length !== snapshots.length}
            totalCount={snapshots.length}
          />
        );
    }
  })();

  // // Event listener for COMPARE_SNAPSHOTS message from SnapshotViewer
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     if (event.data && event.data.type === "COMPARE_SNAPSHOTS") {
  //       const snapshots = event.data.snapshots as CSSSnapshot[];
  //       if (snapshots && snapshots.length === 2) {
  //         // Clear existing comparison snapshots first
  //         clearCompare();
  //
  //         // Set the snapshots for comparison
  //         snapshots.forEach((snapshot) => {
  //           toggleCompare(snapshot);
  //         });
  //
  //         // Start comparison view
  //         startComparison();
  //       }
  //     }
  //   };
  //
  //   window.addEventListener("message", handleMessage);
  //
  //   return () => {
  //     window.removeEventListener("message", handleMessage);
  //   };
  // }, [toggleCompare, startComparison, clearCompare]);

  return (
    <MainContainer>
      {viewMode === ViewMode.LIST && (
        <SnapshotManagerHeader
          isCapturing={isCapturing}
          snapshotsCount={snapshots.length}
          compareSnapshots={compareSnapshots}
          onCapture={handleCaptureSnapshot}
          onImport={importSnapshot}
          onCompare={handleStartComparison}
          onClearCompare={clearCompare}
          onToggleSearch={handleToggleSearch}
          isSearchVisible={isSearchVisible}
          error={error}
          onCaptureFromPickedElement={handleCaptureFromPickedElement}
          isSelectingElement={elementPicker.isActive || elementPicker.isProcessing}
        />
      )}
      {viewMode === ViewMode.DETAIL && (
        <SnapshotViewerHeader
          selectedSnapshot={selectedSnapshot}
          onBackToList={handleBackToList}
          error={error}
          onCompareWithCurrentPage={() => handleCompareWithCurrentPage()}
          onRename={renameSnapshot}
        />
      )}
      {viewMode === ViewMode.COMPARE && (
        <SnapshotCompareHeader
          snapshotA={comparePair[0]}
          snapshotB={comparePair[1]}
          onBackToList={handleBackToList}
          error={error}
          activeCompareView={activeCompareView}
          onChangeCompareView={(view) => setActiveCompareView(view as "diff" | "tree" | "stats")}
          splitView={splitView}
          onToggleSplitView={() => setSplitView(!splitView)}
        />
      )}
      {/* Enhanced Filter Bar - only for LIST view and when search is visible */}
      {viewMode === ViewMode.LIST && isSearchVisible && (
        <FilterContainer>
          <FilterInputWrapper style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FilterInput
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, address or date"
              aria-label="Search snapshots"
              autoFocus
            />
            {filter && (
              <ClearButton aria-label="Clear search" title="Clear search" style={{ right: 44 }} onClick={() => setFilter("")}>
                ×
              </ClearButton>
            )}
            <ClearButton
              aria-label="Hide search"
              title="Hide search"
              style={{ fontSize: 18, marginLeft: 2, position: "static", transform: "none", flexShrink: 0 }}
              onClick={handleToggleSearch}
            >
              ×
            </ClearButton>
          </FilterInputWrapper>
        </FilterContainer>
      )}
      {/* Main Content Area with improved background and padding */}
      <ContentArea>
        <ContentWrapper>{renderContent}</ContentWrapper>
      </ContentArea>
    </MainContainer>
  );
};
