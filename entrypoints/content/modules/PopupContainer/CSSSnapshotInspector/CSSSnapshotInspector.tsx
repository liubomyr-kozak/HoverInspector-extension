/**
 * Modern CSS Snapshot Inspector with styled-components
 */
import React, { useMemo, useEffect } from "react";
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
import { Header } from "./components/Header";
import { ViewMode } from "./constants";
import { CSSSnapshot } from "./types";

// Styled Components
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.8) 0%,
    rgba(249, 250, 251, 0.6) 50%,
    rgba(238, 242, 255, 0.4) 100%
  );
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
`;

const FilterContainer = styled.div`
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  padding: 20px 24px;
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

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(243, 244, 246, 1) 100%);
  border-radius: 16px;
  padding: 32px;
  margin: 32px;
`;

const EmptyStateIcon = styled.div`
  background: white;
  border-radius: 50%;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  text-align: center;
`;

const EmptyStateDescription = styled.p`
  color: #6b7280;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: 24px;
`;

const EmptyStateTip = styled.div`
  font-size: 14px;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.5);
  padding: 12px 16px;
  border-radius: 20px;
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
  const handleCompareWithCurrentPage = async () => {
    let firstSnapshot: CSSSnapshot | null = null;

    // Determine which snapshot to compare with based on the current view mode
    if (viewMode === ViewMode.DETAIL && selectedSnapshot) {
      firstSnapshot = selectedSnapshot;
    } else if (viewMode === ViewMode.COMPARE && compareSnapshots.length > 0) {
      // Use the first snapshot from the comparison
      firstSnapshot = compareSnapshots[0];
    }

    if (!firstSnapshot) {
      console.error("No snapshot selected for comparison");
      return;
    }

    console.log("Starting comparison with current page. Selected snapshot:", firstSnapshot);

    try {
      // Create a snapshot of the current page
      console.log("Creating snapshot of current page...");
      const currentPageSnapshot = await createCSSSnapshot("Current Page");
      console.log("Current page snapshot created:", currentPageSnapshot);

      // Clear existing comparison snapshots
      clearCompare();

      // Add both snapshots to comparison
      toggleCompare(firstSnapshot);
      toggleCompare(currentPageSnapshot);

      // Start comparison view
      startComparison();
      
      console.log("Comparison started successfully");
    } catch (error) {
      console.error("Failed to create current page snapshot:", error);
      // Handle error state if needed
    }
  };

  // Enhanced content rendering with styled components

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case ViewMode.DETAIL:
        return selectedSnapshot ? (
          <SnapshotViewer
            snapshot={selectedSnapshot}
            onBack={backToList}
            onCompareWithCurrentPage={handleCompareWithCurrentPage}
          />
        ) : (
          <EmptyStateContainer>
            <EmptyStateIcon>
              <IconCode size={48} color="#9ca3af" />
            </EmptyStateIcon>
            <EmptyStateTitle>No Snapshot Selected</EmptyStateTitle>
            <EmptyStateDescription>
              Select a snapshot from the list to view its detailed DOM structure and styling information.
            </EmptyStateDescription>
          </EmptyStateContainer>
        );

      case ViewMode.COMPARE:
        return compareSnapshots.length === 2 ? (
          <SnapshotCompare
            snapshotA={compareSnapshots[0]}
            snapshotB={compareSnapshots[1]}
            onBack={backToList}
            activeView={activeCompareView}
            setActiveView={setActiveCompareView}
            splitView={splitView}
            setSplitView={setSplitView}
          />
        ) : (
          <EmptyStateContainer>
            <EmptyStateIcon>
              <MdOutlineCompare size={48} color="#9ca3af" />
            </EmptyStateIcon>
            <EmptyStateTitle>Ready to Compare</EmptyStateTitle>
            <EmptyStateDescription>
              Select exactly two snapshots from the list to perform a detailed comparison analysis.
            </EmptyStateDescription>
            <EmptyStateTip>💡 Tip: Use checkboxes next to snapshots to select them for comparison</EmptyStateTip>
          </EmptyStateContainer>
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

  // Обробник для початку порівняння
  const handleStartComparison = () => {
    if (canCompare) {
      startComparison();
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

  // Event listener for COMPARE_SNAPSHOTS message from SnapshotViewer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "COMPARE_SNAPSHOTS") {
        const snapshots = event.data.snapshots as CSSSnapshot[];
        if (snapshots && snapshots.length === 2) {
          // Clear existing comparison snapshots first
          clearCompare();

          // Set the snapshots for comparison
          snapshots.forEach((snapshot) => {
            toggleCompare(snapshot);
          });

          // Start comparison view
          startComparison();
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [toggleCompare, startComparison, clearCompare]);

  return (
    <MainContainer>
      {/* Modern Header Component with enhanced background */}
      <StickyHeader>
        <Header
          viewMode={viewMode}
          isCapturing={isCapturing}
          compareSnapshotsCount={compareSnapshots.length}
          snapshotsCount={snapshots.length}
          selectedSnapshot={selectedSnapshot}
          compareSnapshots={compareSnapshots}
          onCapture={handleCaptureSnapshot}
          onImport={importSnapshot}
          onCompare={handleStartComparison}
          onBackToList={backToList}
          onToggleSearch={handleToggleSearch}
          isSearchVisible={isSearchVisible}
          error={error}
          onCompareWithCurrentPage={handleCompareWithCurrentPage}
          activeCompareView={activeCompareView}
          onChangeCompareView={(view) => setActiveCompareView(view as "diff" | "tree" | "stats")}
          splitView={splitView}
          onToggleSplitView={() => setSplitView(!splitView)}
        />
      </StickyHeader>

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
            {filter && <ClearButton onClick={() => setFilter("")}>×</ClearButton>}
            <ClearButton
              aria-label="Hide search"
              title="Hide search"
              style={{ fontSize: 18, marginLeft: 2 }}
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
