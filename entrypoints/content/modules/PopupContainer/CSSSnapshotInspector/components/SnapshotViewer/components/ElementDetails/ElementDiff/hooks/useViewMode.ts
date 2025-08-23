import { useState } from "react";

export type ViewMode = "computed" | "class";

export interface UseViewModeResult {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isComputedMode: boolean;
  isClassMode: boolean;
}

export const useViewMode = (initialMode: ViewMode = "computed"): UseViewModeResult => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  return {
    viewMode,
    setViewMode,
    isComputedMode: viewMode === "computed",
    isClassMode: viewMode === "class",
  };
};