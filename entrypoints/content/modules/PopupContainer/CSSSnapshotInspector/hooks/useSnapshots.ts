/**
 * Оптимізовані хуки для управління CSS знімками
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { CSSSnapshot, SnapshotOptions } from "../types";
import { PERFORMANCE_LIMITS } from "../constants";
import { createCSSSnapshot } from "../utils/snapshotBuilder";
import { loadSnapshots, saveSnapshots, deleteSnapshot as deleteSnapshotUtil } from "../utils/snapshotStorage";

interface UseSnapshotsReturn {
  snapshots: readonly CSSSnapshot[];
  isCapturing: boolean;
  selectedSnapshot: CSSSnapshot | null;
  compareSnapshots: readonly CSSSnapshot[];
  captureSnapshot: (title?: string, options?: SnapshotOptions) => Promise<CSSSnapshot>;
  deleteSnapshot: (id: string) => Promise<void>;
  importSnapshot: () => void;
  selectSnapshot: (snapshot: CSSSnapshot | null) => void;
  toggleCompare: (snapshot: CSSSnapshot) => void;
  clearCompare: () => void;
  error: string | null;
}

/**
 * Основний хук для управління знімками з оптимізацією продуктивності
 */
export const useSnapshots = (): UseSnapshotsReturn => {
  const [snapshots, setSnapshots] = useState<CSSSnapshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CSSSnapshot | null>(null);
  const [compareSnapshots, setCompareSnapshots] = useState<CSSSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Завантажуємо знімки при ініціалізації
  useEffect(() => {
    let mounted = true;

    const loadInitialSnapshots = async () => {
      try {
        const loadedSnapshots = await loadSnapshots();

        if (mounted) {
          // Обмежуємо кількість знімків у пам'яті
          const limitedSnapshots = loadedSnapshots.slice(-PERFORMANCE_LIMITS.MAX_SNAPSHOTS_MEMORY);
          setSnapshots(limitedSnapshots);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load snapshots");
        }
      }
    };

    loadInitialSnapshots();

    return () => {
      mounted = false;
    };
  }, []);

  // Захоплення нового знімка
  const captureSnapshot = useCallback(
    async (title?: string, options?: SnapshotOptions): Promise<CSSSnapshot> => {
      if (isCapturing) {
        throw new Error("Snapshot capture already in progress");
      }

      setIsCapturing(true);
      setError(null);

      debugger;
      try {
        const snapshot = await createCSSSnapshot(title, {
          maxElements: PERFORMANCE_LIMITS.MAX_ELEMENTS,
          skipInvisible: true,
          includeText: true,
          ...options,
        });

        const updatedSnapshots = [...snapshots, snapshot];
        const limitedSnapshots = updatedSnapshots.slice(-PERFORMANCE_LIMITS.MAX_SNAPSHOTS_MEMORY);

        try {
          await saveSnapshots(limitedSnapshots);
        } catch (saveError) {
          console.warn("Failed to save snapshots to storage:", saveError);
          // Продовжуємо з знімком у пам'яті навіть якщо збереження не вдалося
        }

        setSnapshots(limitedSnapshots);
        return snapshot;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to capture snapshot";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsCapturing(false);
      }
    },
    [snapshots, isCapturing],
  );

  // Видалення знімка
  const deleteSnapshot = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteSnapshotUtil(id);

        setSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== id));

        // Скидаємо вибраний знімок якщо він був видалений
        if (selectedSnapshot?.id === id) {
          setSelectedSnapshot(null);
        }

        // Видаляємо зі списку порівняння
        setCompareSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== id));

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete snapshot";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [selectedSnapshot?.id],
  );

  // Імпорт знімка з файлу
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
        let snapshot = JSON.parse(text) as CSSSnapshot;

        // Валідуємо структуру знімка
        if (!snapshot.id || !snapshot.timestamp || !snapshot.root) {
          throw new Error("Invalid snapshot format");
        }

        // Перевіряємо чи знімок вже існує
        const existingIds = snapshots.map((s) => s.id);
        if (existingIds.includes(snapshot.id)) {
          // Створюємо новий знімок з новим ID
          snapshot = {
            ...snapshot,
            id: `${snapshot.id}-imported-${Date.now()}`,
          };
        }

        const updatedSnapshots = [...snapshots, snapshot];
        const limitedSnapshots = updatedSnapshots.slice(-PERFORMANCE_LIMITS.MAX_SNAPSHOTS_MEMORY);

        try {
          await saveSnapshots(limitedSnapshots);
        } catch (saveError) {
          console.warn("Failed to save imported snapshot:", saveError);
        }

        setSnapshots(limitedSnapshots);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to import snapshot";
        setError(errorMessage);
        alert(`Import failed: ${errorMessage}`);
      }
    };

    input.click();
  }, [snapshots]);

  // Вибір знімка
  const selectSnapshot = useCallback((snapshot: CSSSnapshot | null) => {
    setSelectedSnapshot(snapshot);
    setError(null);
  }, []);

  // Переключення знімка для порівняння
  const toggleCompare = useCallback((snapshot: CSSSnapshot) => {
    setCompareSnapshots((prev) => {
      const exists = prev.some((s) => s.id === snapshot.id);

      if (exists) {
        return prev.filter((s) => s.id !== snapshot.id);
      } else {
        // Дозволяємо максимум 2 знімки для порівняння
        if (prev.length < 2) {
          return [...prev, snapshot];
        } else {
          // Замінюємо перший знімок
          return [prev[1], snapshot];
        }
      }
    });
    setError(null);
  }, []);

  // Очищення списку порівняння
  const clearCompare = useCallback(() => {
    setCompareSnapshots([]);
    setError(null);
  }, []);

  return {
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
  };
};

interface UseSnapshotFilterReturn {
  filter: string;
  setFilter: (filter: string) => void;
  filteredSnapshots: readonly CSSSnapshot[];
}

/**
 * Хук для фільтрації знімків з дебаунсом
 */
export const useSnapshotFilter = (snapshots: readonly CSSSnapshot[]): UseSnapshotFilterReturn => {
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");

  // Дебаунс для фільтра
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
    }, PERFORMANCE_LIMITS.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [filter]);

  // Мемоізовані відфільтровані знімки
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
