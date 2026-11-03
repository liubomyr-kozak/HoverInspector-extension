/**
 * Optimised hooks for managing CSS snapshots
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CSSSnapshot, SnapshotOptions } from "../types";
import { PERFORMANCE_LIMITS } from "../constants";
import { createCSSSnapshot } from "../utils/snapshotBuilder";
import {
  loadSnapshots,
  trimAndSaveSnapshots,
  isValidSnapshot,
  deleteSnapshot as deleteSnapshotUtil,
  saveSnapshot,
} from "../utils/snapshotStorage";
import { normalizeSnapshotName } from "../utils/snapshotLabels";
import { RootState } from "@entrypoints/content/store/createStore";
import {
  selectSnapshots,
  selectSnapshotLoading,
  selectSnapshotError,
  setSnapshots,
  addSnapshot as addSnapshotAction,
  removeSnapshot,
  updateSnapshot,
  setLoading,
  setError,
} from "@entrypoints/content/store/snapshot/snapshotSlice";

interface UseSnapshotsReturn {
  snapshots: readonly CSSSnapshot[];
  isCapturing: boolean;
  selectedSnapshot: CSSSnapshot | null;
  compareSnapshots: readonly CSSSnapshot[];
  captureSnapshot: (title?: string, options?: SnapshotOptions) => Promise<CSSSnapshot>;
  deleteSnapshot: (id: string) => Promise<void>;
  /** Renames a saved snapshot; resolves to false when the name is empty or the snapshot is gone */
  renameSnapshot: (id: string, name: string) => Promise<boolean>;
  importSnapshot: () => void;
  selectSnapshot: (snapshot: CSSSnapshot | null) => void;
  toggleCompare: (snapshot: CSSSnapshot) => void;
  clearCompare: () => void;
  error: string | null;
}

/**
 * Main snapshot management hook, optimised for performance
 */
export const useSnapshots = (): UseSnapshotsReturn => {
  const dispatch = useDispatch();
  const snapshots = useSelector(selectSnapshots);
  const isLoadingRedux = useSelector(selectSnapshotLoading);
  const errorRedux = useSelector(selectSnapshotError);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CSSSnapshot | null>(null);
  const [compareSnapshots, setCompareSnapshots] = useState<CSSSnapshot[]>([]);

  // Load snapshots on init
  useEffect(() => {
    let mounted = true;

    const loadInitialSnapshots = async () => {
      try {
        dispatch(setLoading(true));
        const loadedSnapshots = await loadSnapshots();

        if (mounted) {
          // Limit the number of snapshots kept in memory
          const limitedSnapshots = loadedSnapshots.slice(-PERFORMANCE_LIMITS.MAX_SNAPSHOTS_MEMORY);
          dispatch(setSnapshots(limitedSnapshots));
          dispatch(setError(null));
        }
      } catch (err) {
        if (mounted) {
          dispatch(setError(err instanceof Error ? err.message : "Failed to load snapshots"));
        }
      } finally {
        if (mounted) {
          dispatch(setLoading(false));
        }
      }
    };

    loadInitialSnapshots();

    return () => {
      mounted = false;
    };
  }, []);

  // Capture a new snapshot
  const captureSnapshot = useCallback(
    async (title?: string, options?: SnapshotOptions): Promise<CSSSnapshot> => {
      if (isCapturing) {
        throw new Error("Snapshot capture already in progress");
      }

      setIsCapturing(true);
      dispatch(setError(null));

      try {
        const snapshot = await createCSSSnapshot(title, {
          maxElements: PERFORMANCE_LIMITS.MAX_ELEMENTS,
          skipInvisible: true,
          includeText: true,
          ...options,
        });

        try {
          // saveSnapshots also puts the list into Redux, even when persisting fails
          await trimAndSaveSnapshots([...snapshots, snapshot]);
        } catch (saveError) {
          console.warn("Failed to save snapshots to storage:", saveError);
          // Keep the in-memory snapshot even if saving failed
          dispatch(setError("Snapshot captured but could not be saved to extension storage"));
        }

        return snapshot;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to capture snapshot";
        dispatch(setError(errorMessage));
        throw new Error(errorMessage);
      } finally {
        setIsCapturing(false);
      }
    },
    [snapshots, isCapturing, dispatch],
  );

  // Delete a snapshot
  const deleteSnapshot = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteSnapshotUtil(id);

        dispatch(removeSnapshot(id));

        // Clear the selection if the selected snapshot was deleted
        if (selectedSnapshot?.id === id) {
          setSelectedSnapshot(null);
        }

        // Remove it from the comparison list
        setCompareSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== id));

        dispatch(setError(null));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete snapshot";
        dispatch(setError(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [selectedSnapshot?.id, dispatch],
  );

  // Rename: update the list, the open details and the compare selection at once, then persist
  const renameSnapshot = useCallback(
    async (id: string, rawName: string): Promise<boolean> => {
      const name = normalizeSnapshotName(rawName);
      const current = snapshots.find((snapshot) => snapshot.id === id);
      if (!name || !current) return false;
      if (current.title === name) return true;

      const renamed: CSSSnapshot = { ...current, title: name };
      dispatch(updateSnapshot(renamed));
      setSelectedSnapshot((prev) => (prev?.id === id ? renamed : prev));
      setCompareSnapshots((prev) => prev.map((snapshot) => (snapshot.id === id ? renamed : snapshot)));

      try {
        await saveSnapshot(renamed);
      } catch (err) {
        console.warn("Failed to save the renamed snapshot:", err);
        dispatch(setError("Snapshot renamed but the new name could not be saved to extension storage"));
      }
      return true;
    },
    [snapshots, dispatch],
  );

  // Import a snapshot from a file
  const importSnapshot = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = false;

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed: unknown = JSON.parse(text);

        // Validate the snapshot structure
        if (!isValidSnapshot(parsed)) {
          throw new Error("Invalid snapshot format");
        }
        let snapshot: CSSSnapshot = parsed;

        // Check whether the snapshot already exists
        const existingIds = snapshots.map((s) => s.id);
        if (existingIds.includes(snapshot.id)) {
          // Create a new snapshot with a new ID
          snapshot = {
            ...snapshot,
            id: `${snapshot.id}-imported-${Date.now()}`,
          };
        }

        try {
          await trimAndSaveSnapshots([...snapshots, snapshot]);
          dispatch(setError(null));
        } catch (saveError) {
          console.warn("Failed to save imported snapshot:", saveError);
          dispatch(setError("Snapshot imported but could not be saved to extension storage"));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to import snapshot";
        dispatch(setError(errorMessage));
        alert(`Import failed: ${errorMessage}`);
      }
    };

    input.click();
  }, [snapshots, dispatch]);

  // Select a snapshot
  const selectSnapshot = useCallback(
    (snapshot: CSSSnapshot | null) => {
      setSelectedSnapshot(snapshot);
      dispatch(setError(null));
    },
    [dispatch],
  );

  // Toggle a snapshot for comparison
  const toggleCompare = useCallback((snapshot: CSSSnapshot) => {
    setCompareSnapshots((prev) => {
      const exists = prev.some((s) => s.id === snapshot.id);

      if (exists) {
        return prev.filter((s) => s.id !== snapshot.id);
      } else {
        // Allow at most 2 snapshots in a comparison
        if (prev.length < 2) {
          return [...prev, snapshot];
        } else {
          // Replace the first snapshot
          return [prev[1], snapshot];
        }
      }
    });
    dispatch(setError(null));
  }, [dispatch]);

  // Clear the comparison list
  const clearCompare = useCallback(() => {
    setCompareSnapshots([]);
    dispatch(setError(null));
  }, [dispatch]);

  // Add a snapshot straight to state (for element selection)
  const addSnapshot = useCallback(
    async (snapshot: CSSSnapshot) => {
      try {
        try {
          await trimAndSaveSnapshots([...snapshots, snapshot]);
        } catch (saveError) {
          console.warn("Failed to save added snapshot:", saveError);
        }

        // Redux automatically updates via saveSnapshots dispatch
        dispatch(setError(null));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add snapshot";
        dispatch(setError(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [snapshots, dispatch],
  );

  return {
    snapshots,
    isCapturing,
    selectedSnapshot,
    compareSnapshots,
    captureSnapshot,
    deleteSnapshot,
    renameSnapshot,
    importSnapshot,
    addSnapshot,
    selectSnapshot,
    toggleCompare,
    clearCompare,
    error: errorRedux,
  };
};

interface UseSnapshotFilterReturn {
  filter: string;
  setFilter: (filter: string) => void;
  filteredSnapshots: readonly CSSSnapshot[];
}

/**
 * Debounced snapshot filtering hook
 */
export const useSnapshotFilter = (snapshots: readonly CSSSnapshot[]): UseSnapshotFilterReturn => {
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");

  // Debounce the filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
    }, PERFORMANCE_LIMITS.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [filter]);

  // Memoised filtered snapshots
  const filteredSnapshots = useMemo(() => {
    if (!debouncedFilter) return snapshots;

    const lowerFilter = debouncedFilter.toLowerCase();
    return snapshots.filter((snapshot) => {
      return (
        snapshot.title.toLowerCase().includes(lowerFilter) ||
        snapshot.url.toLowerCase().includes(lowerFilter) ||
        new Date(snapshot.timestamp).toLocaleString().toLowerCase().includes(lowerFilter)
      );
    });
  }, [snapshots, debouncedFilter]);

  return {
    filter,
    setFilter,
    filteredSnapshots,
  };
};
