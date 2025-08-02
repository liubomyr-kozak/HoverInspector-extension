/**
 * Оптимізований головний компонент CSS Snapshot Inspector
 */
import React, { useMemo } from "react";
import { IconCode } from "@tabler/icons-react";
import { MdOutlineCompare } from "react-icons/md";
import { Container, Content, EmptyState } from "./CSSSnapshotInspector.styled";
import { SnapshotManager } from "./SnapshotManager";
import { SnapshotCompare } from "./components/SnapshotCompare/SnapshotCompare.tsx";
import { SnapshotViewer } from "./components/SnapshotViewer";
import { useSnapshots, useSnapshotFilter } from "./hooks/useSnapshots";
import { useViewMode } from "./hooks/useViewMode";
import { exportSnapshot } from "./utils/snapshotStorage";
import { Header } from "./components/Header";
import { TabNavigation } from "./components/TabNavigation";
import { FilterBar } from "./components/FilterBar";
import { ViewMode } from "./constants";

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
    error,
  } = useSnapshots();

  // Хук для фільтрації з дебаунсом
  const { filter, setFilter, filteredSnapshots } = useSnapshotFilter(snapshots);

  // Хук для управління режимами перегляду
  const { viewMode, setViewMode, canCompare, canViewDetails, viewSnapshot, startComparison, backToList } = useViewMode(
    selectedSnapshot,
    compareSnapshots,
  );

  // Обробник для перегляду знімка
  const handleViewSnapshot = (snapshot: typeof selectedSnapshot) => {
    if (snapshot) {
      selectSnapshot(snapshot);
      viewSnapshot(snapshot);
    }
  };

  // Мемоізований рендеринг контенту для оптимізації
  const renderContent = useMemo(() => {
    switch (viewMode) {
      case ViewMode.DETAIL:
        return selectedSnapshot ? (
          <SnapshotViewer snapshot={selectedSnapshot} onBack={backToList} />
        ) : (
          <EmptyState>
            <IconCode size={48} />
            <p>No snapshot selected</p>
          </EmptyState>
        );

      case ViewMode.COMPARE:
        return compareSnapshots.length === 2 ? (
          <SnapshotCompare snapshotA={compareSnapshots[0]} snapshotB={compareSnapshots[1]} onBack={backToList} />
        ) : (
          <EmptyState>
            <MdOutlineCompare size={48} />
            <p>Select two snapshots to compare</p>
          </EmptyState>
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

  return (
    <Container>
      {/* Компонент заголовка */}
      <Header
        viewMode={viewMode}
        isCapturing={isCapturing}
        compareSnapshotsCount={compareSnapshots.length}
        onCapture={handleCaptureSnapshot}
        onImport={importSnapshot}
        onCompare={handleStartComparison}
        onBackToList={backToList}
        error={error}
      />

      {/* Навігація по вкладках */}
      <TabNavigation
        viewMode={viewMode}
        selectedSnapshot={selectedSnapshot}
        compareSnapshots={compareSnapshots}
        onTabChange={setViewMode}
      />

      {/* Панель фільтрів (тільки для списку) */}
      {viewMode === ViewMode.LIST && (
        <FilterBar value={filter} onChange={setFilter} placeholder="Filter snapshots by title, URL, or date..." />
      )}

      {/* Основна область контенту */}
      <Content>{renderContent}</Content>
    </Container>
  );
};
