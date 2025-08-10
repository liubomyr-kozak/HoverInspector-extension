import React, { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import HighlightOverlayManager from "./HighlightOverlayManager";

interface HighlightOverlayContextValue {
  manager: HighlightOverlayManager;
}

const HighlightOverlayContext = createContext<HighlightOverlayContextValue | null>(null);

export const HighlightOverlayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const manager = useMemo(() => HighlightOverlayManager.getInstance(), []);

  useEffect(() => () => manager.destroy(), [manager]);

  return <HighlightOverlayContext.Provider value={{ manager }}>{children}</HighlightOverlayContext.Provider>;
};

export const useHighlightOverlay = () => {
  const context = useContext(HighlightOverlayContext);
  if (!context) throw new Error("useHighlightOverlay must be used within a HighlightOverlayProvider");

  return context.manager;
};
