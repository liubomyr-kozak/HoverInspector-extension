import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auditPageAsync, regradeAudit, SPACING_GRID, type DesignAudit, type SpacingGrid } from "@entrypoints/shared/utils/designAudit";
import { isDesignTheme, type DesignTheme } from "./utils/themeDiff";

/**
 * State shared by every tab of the Color Palette & Typography tool: one page scan (the Overview and the
 * token tabs show the same values under the same names), the imported theme, the "only mismatches"
 * filter, and requests from the Overview to open a value in its tab.
 */

export type PaletteTab = "overview" | "color-palette" | "typography" | "spacing" | "borders" | "shadows";

interface PaletteContextValue {
  audit: DesignAudit | null;
  progress: { done: number; total: number } | null;
  error: string | null;
  rescan: () => void;
  grid: SpacingGrid;
  setGrid: (grid: SpacingGrid) => void;
  /** Root font size in px, for rem values */
  rootFontSize: number;
  theme: DesignTheme | null;
  setTheme: (theme: DesignTheme | null) => void;
  onlyMismatches: boolean;
  setOnlyMismatches: (value: boolean) => void;
  /** Overview → tab: open `key` (the value) in `tab`'s detail panel */
  openToken: (tab: PaletteTab, key: string) => void;
  focusRequest: { tab: PaletteTab; key: string; nonce: number } | null;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

// Extension storage, never the page's localStorage: the theme and grid follow the user across sites
export const THEME_STORAGE_KEY = "designTheme.active";
const GRID_STORAGE_KEY = "designOverview.spacingGrid";

const storageGet = async (key: string): Promise<unknown> => {
  try {
    return (await browser.storage.local.get(key))[key];
  } catch {
    return undefined;
  }
};
const storageSet = (key: string, value: unknown) =>
  (value === null ? browser.storage.local.remove(key) : browser.storage.local.set({ [key]: value })).catch(() => undefined);

export const PaletteProvider: React.FC<{ onOpenTab: (tab: PaletteTab) => void; children: React.ReactNode }> = ({
  onOpenTab,
  children,
}) => {
  const [audit, setAudit] = useState<DesignAudit | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGridState] = useState<SpacingGrid>(SPACING_GRID);
  const [theme, setThemeState] = useState<DesignTheme | null>(null);
  const [onlyMismatches, setOnlyMismatches] = useState(false);
  const [focusRequest, setFocusRequest] = useState<PaletteContextValue["focusRequest"]>(null);
  const scanRef = useRef<AbortController | null>(null);
  const gridRef = useRef<SpacingGrid>(SPACING_GRID);

  // Chunked scan: the page stays responsive and large pages are scanned past the old 6000-element cap
  const rescan = useCallback(() => {
    scanRef.current?.abort();
    const controller = new AbortController();
    scanRef.current = controller;
    setAudit(null);
    setError(null);
    setProgress(null);
    auditPageAsync(document.body, {
      grid: gridRef.current,
      signal: controller.signal,
      onProgress: (done, total) => !controller.signal.aborted && setProgress({ done, total }),
    })
      .then((result) => !controller.signal.aborted && setAudit(result))
      .catch((e) => {
        if (controller.signal.aborted) return;
        console.error("Design audit failed:", e);
        setError("Couldn't analyse this page.");
      });
  }, []);

  // Load the remembered grid and theme first, then scan
  useEffect(() => {
    let cancelled = false;
    Promise.all([storageGet(GRID_STORAGE_KEY), storageGet(THEME_STORAGE_KEY)]).then(([savedGrid, savedTheme]) => {
      if (cancelled) return;
      const g: SpacingGrid = savedGrid === 8 ? 8 : 4;
      gridRef.current = g;
      setGridState(g);
      if (isDesignTheme(savedTheme)) setThemeState(savedTheme);
      rescan();
    });
    return () => {
      cancelled = true;
      scanRef.current?.abort();
    };
  }, [rescan]);

  const setGrid = useCallback((value: SpacingGrid) => {
    gridRef.current = value;
    setGridState(value);
    storageSet(GRID_STORAGE_KEY, value);
    // Only the issues depend on the grid: recompute them, no rescan
    setAudit((current) => (current ? regradeAudit(current, value) : current));
  }, []);

  const setTheme = useCallback((value: DesignTheme | null) => {
    setThemeState(value);
    if (!value) setOnlyMismatches(false);
    storageSet(THEME_STORAGE_KEY, value);
  }, []);

  const openToken = useCallback(
    (tab: PaletteTab, key: string) => {
      setFocusRequest({ tab, key, nonce: Date.now() });
      onOpenTab(tab);
    },
    [onOpenTab],
  );

  const rootFontSize = useMemo(() => {
    try {
      return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    } catch {
      return 16;
    }
    // Re-read after a rescan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audit]);

  const value = useMemo(
    () => ({
      audit,
      progress,
      error,
      rescan,
      grid,
      setGrid,
      rootFontSize,
      theme,
      setTheme,
      onlyMismatches,
      setOnlyMismatches,
      openToken,
      focusRequest,
    }),
    [audit, progress, error, rescan, grid, setGrid, rootFontSize, theme, setTheme, onlyMismatches, openToken, focusRequest],
  );

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
};

export const usePalette = () => {
  const context = useContext(PaletteContext);
  if (!context) throw new Error("usePalette must be used inside PaletteProvider");
  return context;
};
