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
import { createCSSSnapshot } from "./utils/snapshotBuilder";
import { SnapshotManagerHeader } from "./components/SnapshotManagerHeader";
import { SnapshotViewerHeader } from "./components/SnapshotViewerHeader";
import { SnapshotCompareHeader } from "./components/SnapshotCompareHeader";
import { ViewMode } from "./constants";
import { CSSSnapshot } from "./types";
import { useElementPicker } from "./hooks/useElementPicker";

// Styled Components
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const FilterContainer = styled.div`
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
`;

const FilterInputWrapper = styled.div`
  position: relative;
`;

const FilterInput = styled.input`
  width: 100%;
  padding: 12px 20px 12px 20px;
  padding-right: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #1f2937;
  transition: all 200ms ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

const FilterStats = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.1);
  color: #4338ca;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  display: inline-block;
`;

const ContentArea = styled.div`
  flex: 1;
  min-height: 0;
`;

const ContentWrapper = styled.div`
  height: 100%;
`;

/**
 * Головний компонент CSS Snapshot Inspector з оптимізацією продуктивності
 */
export const CSSSnapshotInspector: React.FC = () => {
  // Використовуємо оптимізовані хуки

  const {
    snapshots,
    isCapturing,
    selectedSnapshot,
    compareSnapshots,
    captureSnapshot,
    deleteSnapshot,
    importSnapshot,
    selectSnapshot,
    toggleCompare,
    clearCompare,
    error,
  } = useSnapshots();

  // Хук для фільтрації з дебаунсом
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

  // Хук для управління режимами перегляду
  const { viewMode, setViewMode, canCompare, canViewDetails, viewSnapshot, startComparison, backToList } = useViewMode(
    selectedSnapshot,
    compareSnapshots,
  );

  // State for comparison view controls
  const [activeCompareView, setActiveCompareView] = React.useState<"diff" | "tree" | "stats">("diff");
  const [splitView, setSplitView] = React.useState(true);

  // Обробник для перегляду знімка
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
      // Create a snapshot of the current page
      const currentPageSnapshot = await createCSSSnapshot("Current Page");

      // Clear existing comparison snapshots
      clearCompare();

      // Add both snapshots to comparison
      toggleCompare(firstSnapshot);
      toggleCompare(currentPageSnapshot);

      // Start comparison view. compareSnapshots in this closure is still the old
      // value, so skip the canCompare check: both snapshots were just queued.
      startComparison(true);

    } catch (error) {
      console.error("Failed to create current page snapshot:", error);
      // Handle error state if needed
    }
  };

  // Обробник для початку порівняння
  const handleStartComparison = () => {
    if (canCompare) {
      startComparison();
    }
  };

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case ViewMode.DETAIL:
        return (
          <SnapshotViewer
            snapshot={selectedSnapshot}
            onBack={backToList}
            onCompareWithCurrentPage={() => handleCompareWithCurrentPage()}
          />
        );

      case ViewMode.COMPARE:
        return (
          <SnapshotCompare
            snapshotA={compareSnapshots[0]}
            snapshotB={compareSnapshots[1]}
            onBack={backToList}
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
            onToggleCompare={toggleCompare}
            onStartComparison={handleStartComparison}
            onCompareWithCurrentPage={handleCompareWithCurrentPage}
          />
        );
    }
  }, [
    viewMode,
    selectedSnapshot,
    compareSnapshots,
    filteredSnapshots,
    backToList,
    handleViewSnapshot,
    deleteSnapshot,
    exportSnapshot,
    toggleCompare,
    handleStartComparison,
  ]);

  // Обробник для захоплення знімка з обробкою помилок
  const handleCaptureSnapshot = async () => {
    try {
      await captureSnapshot();
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
      // Помилка вже обробляється в хуці
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
          onBackToList={backToList}
          error={error}
          onCompareWithCurrentPage={() => handleCompareWithCurrentPage()}
        />
      )}
      {viewMode === ViewMode.COMPARE && (
        <SnapshotCompareHeader
          onBackToList={backToList}
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
              placeholder="🔍 Search snapshots by title, URL, or date..."
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
          {filteredSnapshots.length !== snapshots.length && (
            <FilterStats>
              Showing {filteredSnapshots.length} of {snapshots.length} snapshots
            </FilterStats>
          )}
        </FilterContainer>
      )}
      {/* Main Content Area with improved background and padding */}
      <ContentArea>
        <ContentWrapper>{renderContent}</ContentWrapper>
      </ContentArea>
    </MainContainer>
  );
};
