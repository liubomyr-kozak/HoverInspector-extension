/**
 * Optimised view mode hook
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
 * View mode hook with validation
 */
export const useViewMode = (
  selectedSnapshot: CSSSnapshot | null,
  compareSnapshots: readonly CSSSnapshot[]
): UseViewModeReturn => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);

  // Can we compare?
  const canCompare = compareSnapshots.length === 2;
  
  // Can we show details?
  const canViewDetails = selectedSnapshot !== null;

  // Show snapshot details
  const viewSnapshot = useCallback((snapshot: CSSSnapshot) => {
    setViewMode(ViewMode.DETAIL);
  }, []);

  // Show the comparison
  const startComparison = useCallback((force = false) => {
    if (force || canCompare) {
      setViewMode(ViewMode.COMPARE);
    }
  }, [canCompare]);

  // Back to the list
  const backToList = useCallback(() => {
    setViewMode(ViewMode.LIST);
  }, []);

  // Validate the current view mode
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