/**
 * Оптимізований хук для управління режимами перегляду
 */
import { useState, useCallback } from 'react';
import { ViewMode } from '../constants';
import { CSSSnapshot } from '../types';

interface UseViewModeReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  canCompare: boolean;
  canViewDetails: boolean;
  viewSnapshot: (snapshot: CSSSnapshot) => void;
  /** Pass `force` when the compare list was updated in the same tick (canCompare is still stale). */
  startComparison: (force?: boolean) => void;
  backToList: () => void;
}

/**
 * Хук для управління режимами перегляду з валідацією
 */
export const useViewMode = (
  selectedSnapshot: CSSSnapshot | null,
  compareSnapshots: readonly CSSSnapshot[]
): UseViewModeReturn => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);

  // Перевіряємо чи можна порівнювати
  const canCompare = compareSnapshots.length === 2;
  
  // Перевіряємо чи можна переглядати деталі
  const canViewDetails = selectedSnapshot !== null;

  // Показати деталі знімка
  const viewSnapshot = useCallback((snapshot: CSSSnapshot) => {
    setViewMode(ViewMode.DETAIL);
  }, []);

  // Показати порівняння
  const startComparison = useCallback((force = false) => {
    if (force || canCompare) {
      setViewMode(ViewMode.COMPARE);
    }
  }, [canCompare]);

  // Повернутися до списку
  const backToList = useCallback(() => {
    setViewMode(ViewMode.LIST);
  }, []);

  // Валідуємо поточний режим перегляду
  const validatedSetViewMode = useCallback((mode: ViewMode) => {
    switch (mode) {
      case ViewMode.DETAIL:
        if (canViewDetails) {
          setViewMode(mode);
        }
        break;
      case ViewMode.COMPARE:
        if (canCompare) {
          setViewMode(mode);
        }
        break;
      case ViewMode.LIST:
      case ViewMode.TREE:
        setViewMode(mode);
        break;
      default:
        setViewMode(ViewMode.LIST);
    }
  }, [canViewDetails, canCompare]);

  return {
    viewMode,
    setViewMode: validatedSetViewMode,
    canCompare,
    canViewDetails,
    viewSnapshot,
    startComparison,
    backToList,
  };
};