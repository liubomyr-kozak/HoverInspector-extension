import { useState, useEffect, useCallback } from 'react';
import { Subscription } from 'rxjs';
import { filter as rxFilter } from 'rxjs/operators';
import { useHighlightOverlay } from '@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext';
import { CSSSnapshot } from '../types';
import { buildSnapshotTree } from '../utils/snapshotBuilder';
import { saveSnapshots } from '../utils/snapshotStorage';

interface ElementPickerConfig {
  highlightStyles?: {
    border?: string;
    backgroundColor?: string;
  };
  onSuccess?: (snapshot: CSSSnapshot) => void;
  onError?: (error: Error) => void;
}

interface ElementPickerState {
  isActive: boolean;
  isProcessing: boolean;
  error: string | null;
}

export function useElementPicker(
  snapshots: CSSSnapshot[],
  config: ElementPickerConfig = {}
) {
  const highlightManager = useHighlightOverlay();
  
  const [state, setState] = useState<ElementPickerState>({
    isActive: false,
    isProcessing: false,
    error: null,
  });

  const {
    onSuccess,
    onError
  } = config;

  // Clear any error after a delay
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Handle element selection and snapshot creation
  const handleElementSelection = useCallback(async (xpath: string, element: Element) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Highlight the selected element for visual feedback
      highlightManager.startHighlight(xpath);

      // Create element identifier for the snapshot title
      const elementName = createElementName(element);

      // Build snapshot tree from the selected element
      const { tree, stats } = buildSnapshotTree(element, {
        maxElements: 1000,
        skipInvisible: true,
        includeText: true,
        includeUnchanged: false,
      });

      // Create the element snapshot
      const snapshot: CSSSnapshot = createElementSnapshot({
        elementName,
        tree,
        stats
      });

      // Save the snapshot
      await saveElementSnapshot(snapshot, snapshots);

      // Notify success
      onSuccess?.(snapshot);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: `Failed to capture element: ${errorMessage}` }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      console.error('Failed to capture element snapshot:', error);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      stopPicking();
    }
  }, [highlightManager, snapshots, onSuccess, onError]);

  // Set up element selection stream when active
  useEffect(() => {
    if (!state.isActive) return;

    let subscription: Subscription | null = null;

    try {
      // Subscribe to element selection events
      subscription = highlightManager
        .streamSelectionMode()
        .pipe(rxFilter(event => event.type === 'selected'))
        .subscribe({
          next: (event) => {
            if (event.xpath && event.element) {
              handleElementSelection(event.xpath, event.element);
            }
          },
          error: (error) => {
            setState(prev => ({ 
              ...prev, 
              error: 'Element selection failed',
              isActive: false,
              isProcessing: false 
            }));
            onError?.(error instanceof Error ? error : new Error('Element selection failed'));
            console.error('Element selection stream error:', error);
          },
          complete: () => {
            setState(prev => ({ ...prev, isActive: false }));
          },
        });

      // Start hover highlighting
      highlightManager.startMouseMoveHighlight('picker');
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start element picker',
        isActive: false 
      }));
      onError?.(error instanceof Error ? error : new Error('Failed to start element picker'));
    }

    return () => {
      subscription?.unsubscribe();
      highlightManager.stopMouseMoveHighlight();
    };
  }, [state.isActive, highlightManager, handleElementSelection, onError]);

  // Start element picking
  const startPicking = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true, error: null }));
  }, []);

  // Stop element picking
  const stopPicking = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false, isProcessing: false }));
    highlightManager.stopSelectionMode();
    highlightManager.stopMouseMoveHighlight();
  }, [highlightManager]);

  // Toggle element picking
  const togglePicking = useCallback(() => {
    if (state.isActive || state.isProcessing) {
      stopPicking();
    } else {
      startPicking();
    }
  }, [state.isActive, state.isProcessing, startPicking, stopPicking]);

  return {
    ...state,
    startPicking,
    stopPicking,
    togglePicking,
  };
}

// Helper functions
function createElementName(element: Element): string {
  return element.tagName.toLowerCase() +
    (element.id ? `#${element.id}` : '') +
    (element.classList.length ? `.${Array.from(element.classList).join('.')}` : '');
}

function createElementSnapshot({
  elementName,
  tree,
  stats
}: {
  elementName: string;
  tree: any;
  stats: any;
}): CSSSnapshot {
  return {
    id: `element-snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    url: window.location.href,
    title: `Element: ${elementName}`,
    elementCount: stats.totalNodes,
    root: tree,
    metadata: {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      optimized: true,
    },
  };
}

async function saveElementSnapshot(snapshot: CSSSnapshot, existingSnapshots: CSSSnapshot[]): Promise<void> {
  const updatedSnapshots = [...existingSnapshots, snapshot];
  const limitedSnapshots = updatedSnapshots.slice(-50); // Keep last 50 snapshots
  
  try {
    await saveSnapshots(limitedSnapshots);
  } catch (error) {
    console.warn('Failed to save element snapshot:', error);
    throw new Error('Failed to save snapshot to storage');
  }
}