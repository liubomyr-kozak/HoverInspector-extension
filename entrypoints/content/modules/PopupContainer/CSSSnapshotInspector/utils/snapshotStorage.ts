/**
 * CSS snapshot storage utilities
 */
import { CSSSnapshot } from '../types';
import ExtensionStorageManager from '@entrypoints/core/services/storage/ExtensionStorageManager';
import { PERFORMANCE_LIMITS } from '../constants';
import { store } from '@entrypoints/content/store/createStore';
import { setSnapshots } from '@entrypoints/content/store/snapshot/snapshotSlice';

/**
 * Loads all snapshots from storage
 */
export const loadSnapshots = async (): Promise<CSSSnapshot[]> => {
  try {
    const snapshotIds = await ExtensionStorageManager.getAllCSSSnapshots();
    
    if (!Array.isArray(snapshotIds)) {
      return [];
    }
    
    // Load snapshots in parallel for better performance
    const loadPromises = snapshotIds.map(async (id: string) => {
      try {
        const snapshot = await ExtensionStorageManager.getCSSSnapshot(id);
        return snapshot;
      } catch (error) {
        console.warn(`Failed to load snapshot ${id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(loadPromises);
    return results.filter((snapshot): snapshot is CSSSnapshot => snapshot !== null);
  } catch (error) {
    console.error('Failed to load snapshots:', error);
    return [];
  }
};

/**
 * Saves one snapshot through the background. The background handler swallows
 * exceptions (e.g. quota errors) and never answers, so anything other than
 * `{ success: true }` is treated as a failed write.
 */
const trySaveSnapshot = async (snapshot: CSSSnapshot): Promise<boolean> => {
  try {
    const result = await ExtensionStorageManager.saveCSSSnapshot(snapshot.id, snapshot);
    return Boolean((result as { success?: boolean } | undefined)?.success);
  } catch (error) {
    console.warn(`Failed to save snapshot ${snapshot.id}:`, error);
    return false;
  }
};

/**
 * Saves a single snapshot (e.g. after renaming it) without rewriting the others. Falls back to the
 * minimal version when the full one does not fit, like saveSnapshots. Throws when neither could be stored.
 */
export const saveSnapshot = async (snapshot: CSSSnapshot): Promise<void> => {
  const optimized = optimizeSnapshot(snapshot);
  if (await trySaveSnapshot(optimized)) return;
  if (await trySaveSnapshot(createMinimalSnapshot(optimized))) return;
  throw new Error(`Failed to save snapshot ${snapshot.id} to extension storage`);
};

/**
 * Saves snapshots to storage
 */
export const saveSnapshots = async (snapshots: CSSSnapshot[]): Promise<void> => {
  // Optimise snapshots before saving
  const optimizedSnapshots = snapshots.map(optimizeSnapshot);

  // Keep the in-memory list in sync even if persisting fails, so a freshly
  // captured snapshot is never silently dropped from the UI.
  store.dispatch(setSnapshots(optimizedSnapshots));

  const failed: string[] = [];

  // Save each snapshot separately
  for (const snapshot of optimizedSnapshots) {
    if (await trySaveSnapshot(snapshot)) continue;

    // Most likely the storage quota: try a minimal version instead
    console.warn(`Could not store snapshot ${snapshot.id}, retrying with a minimal version`);
    if (!(await trySaveSnapshot(createMinimalSnapshot(snapshot)))) {
      failed.push(snapshot.id);
    }
  }

  if (failed.length) {
    throw new Error(`Failed to save ${failed.length} snapshot(s) to extension storage`);
  }
};

/**
 * Keeps only the newest MAX_SNAPSHOTS_MEMORY snapshots, saves them and deletes
 * the ones that were trimmed off so they don't linger in storage forever.
 */
export const trimAndSaveSnapshots = async (snapshots: CSSSnapshot[]): Promise<CSSSnapshot[]> => {
  const limit = PERFORMANCE_LIMITS.MAX_SNAPSHOTS_MEMORY;
  const kept = snapshots.slice(-limit);
  const trimmed = snapshots.slice(0, Math.max(0, snapshots.length - limit));

  for (const snapshot of trimmed) {
    try {
      await deleteSnapshot(snapshot.id);
    } catch {
      // already logged in deleteSnapshot
    }
  }

  await saveSnapshots(kept);
  return kept;
};

/**
 * Deletes a snapshot from storage
 */
export const deleteSnapshot = async (id: string): Promise<void> => {
  try {
    await ExtensionStorageManager.removeCSSSnapshot(id);
  } catch (error) {
    console.error(`Failed to delete snapshot ${id}:`, error);
    throw error;
  }
};

/**
 * Exports a snapshot to a JSON file
 */
export const exportSnapshot = (snapshot: CSSSnapshot): void => {
  const dataStr = JSON.stringify(snapshot, null, 2);
  // Blob URLs avoid the size limits and encoding cost of huge data: URIs
  const blobUrl = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));

  const exportFileName = `css-snapshot-${snapshot.id}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', blobUrl);
  linkElement.setAttribute('download', exportFileName);
  linkElement.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
};

/**
 * Returns the hostname of a snapshot URL without throwing on bad/legacy values
 */
export const getSnapshotHostname = (url: string | undefined | null): string => {
  if (!url) return 'Unknown';
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
};

/**
 * Basic structural validation for snapshots coming from files
 */
export const isValidSnapshot = (value: unknown): value is CSSSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<CSSSnapshot>;
  return (
    typeof s.id === 'string' &&
    s.id.length > 0 &&
    typeof s.timestamp === 'number' &&
    typeof s.url === 'string' &&
    typeof s.title === 'string' &&
    !!s.root &&
    typeof s.root === 'object' &&
    Array.isArray(s.root.children)
  );
};

/**
 * Optimises a snapshot for storage
 */
const optimizeSnapshot = (snapshot: CSSSnapshot): CSSSnapshot => {
  // Trim very large trees
  const optimizedRoot = optimizeNode(snapshot.root, PERFORMANCE_LIMITS.MAX_ELEMENTS);
  
  return {
    ...snapshot,
    root: optimizedRoot,
    elementCount: Math.min(snapshot.elementCount, PERFORMANCE_LIMITS.MAX_ELEMENTS),
  };
};

/**
 * Optimises a tree node recursively
 */
const optimizeNode = (node: CSSSnapshot['root'], maxNodes: number, processed = { count: 0 }): CSSSnapshot['root'] => {
  if (processed.count >= maxNodes) {
    return {
      ...node,
      children: [],
    };
  }
  
  processed.count++;
  
  // Limit the number of children
  const maxChildren = Math.floor(maxNodes / 10);
  const limitedChildren = node.children.slice(0, maxChildren);
  
  const optimizedChildren = limitedChildren.map(child => 
    optimizeNode(child, maxNodes, processed)
  );
  
  return {
    ...node,
    children: optimizedChildren,
  };
};

/**
 * Creates a minimal version of a snapshot
 */
const createMinimalSnapshot = (snapshot: CSSSnapshot): CSSSnapshot => {
  return {
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    url: snapshot.url,
    title: snapshot.title,
    elementCount: Math.min(snapshot.elementCount, 100),
    // Keep the root element itself (tag, xpath, styles) so the snapshot still opens and compares
    root: { ...snapshot.root, children: [] },
    metadata: snapshot.metadata,
  };
};
