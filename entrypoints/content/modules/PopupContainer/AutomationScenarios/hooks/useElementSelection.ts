import { useState, useEffect, useCallback } from "react";
import { Subscription } from "rxjs";
import { filter as rxFilter, timeout, catchError } from "rxjs/operators";
import { of, EMPTY } from "rxjs";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { generateXPaths } from "../utils/xpathUtils.ts";

/**
 * Configuration for element selection
 */
export interface ElementSelectionConfig {
  onElementSelected?: (xpath: string, alternativeXpaths: string[]) => void;
  timeout?: number; // in milliseconds, default 10000
}

/**
 * Custom hook that provides element selection functionality
 * Allows users to click on elements in the page to select them and get their XPath
 */
export const useElementSelection = (config: ElementSelectionConfig = {}) => {
  const highlightManager = useHighlightOverlay();
  const [selectingElement, setSelectingElement] = useState(false);

  const { onElementSelected, timeout = 10000 } = config;

  // Handle element selection with event-based approach
  const handleElementSelected = useCallback(
    (xpath: string, element: Element) => {
      // Generate alternative XPaths for the selected element
      let alternativeXpaths: string[] = [];
      if (element) {
        const xpathResult = generateXPaths(element);
        alternativeXpaths = xpathResult.alternativeXpaths;
      }

      // Call the callback if provided
      if (onElementSelected) {
        onElementSelected(xpath, alternativeXpaths);
      }

      // Reset selection state
      setSelectingElement(false);
    },
    [onElementSelected],
  );

  /**
   * Start element selection mode using RxJS streams
   * Uses the stream-based selection functionality from HighlightOverlayManager
   */
  const startElementSelection = useCallback(() => {
    // Set selecting element mode
    setSelectingElement(true);
  }, []);

  // Set up RxJS stream subscription for element selection with timeout
  useEffect(() => {
    if (selectingElement) {
      // Subscribe to the stream-based selection mode with timeout
      const subscription: Subscription = highlightManager
        .streamSelectionMode()
        .pipe(
          // Add timeout functionality
          timeout(timeout),
          // Filter for element selected events
          filter((event) => event.type === "selected"),
          // Handle timeout errors
          catchError((error) => {
            if (error.name === "TimeoutError") {
              setSelectingElement(false);
              return EMPTY;
            }
            throw error;
          }),
        )
        .subscribe({
          next: (event) => {
            if (event.xpath && event.element) {
              handleElementSelected(event.xpath, event.element);
            }
          },
          error: (error) => {
            console.error("Element selection stream error:", error);
            setSelectingElement(false);
          },
          complete: () => {
            setSelectingElement(false);
          },
        });

      // Cleanup function to unsubscribe
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectingElement, highlightManager, handleElementSelected, timeout]);

  /**
   * Stop element selection mode manually using highlightManager
   */
  const stopElementSelection = () => {
    setSelectingElement(false);

    // Use highlightManager's built-in stop selection functionality
    highlightManager.stopSelectionMode();
  };

  return {
    selectingElement,
    startElementSelection,
    stopElementSelection,
  };
};
