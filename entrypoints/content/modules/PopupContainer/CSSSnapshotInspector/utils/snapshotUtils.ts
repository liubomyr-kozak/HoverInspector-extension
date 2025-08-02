/**
 * Utility functions for working with CSS snapshots
 */
import { CSSSnapshot } from "../types";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { MAX_SNAPSHOT_ELEMENTS } from "../constants";

/**
 * Exports a snapshot to a JSON file
 * @param snapshot The snapshot to export
 */
export const exportSnapshot = (snapshot: CSSSnapshot): void => {
  const dataStr = JSON.stringify(snapshot, null, 2);
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `css-snapshot-${snapshot.id}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
};

/**
 * Loads all snapshots from storage with error handling
 * @returns Promise resolving to an array of snapshots
 */
export const loadSnapshots = async (): Promise<CSSSnapshot[]> => {
  try {
    // Get all snapshot IDs
    const snapshotIds = await ExtensionStorageManager.getAllCSSSnapshots();
    
    // Ensure snapshotIds is an array
    const idsArray = Array.isArray(snapshotIds) ? snapshotIds : [];
    
    // Load each snapshot with concurrent processing for better performance
    const loadPromises = idsArray.map(async (id) => {
      try {
        const snapshot = await ExtensionStorageManager.getCSSSnapshot(id);
        return snapshot;
      } catch (error) {
        console.warn(`Failed to load snapshot ${id}:`, error);
        return null;
      }
    });
    
    const loadedSnapshots = await Promise.all(loadPromises);
    
    // Filter out null values (failed loads)
    return loadedSnapshots.filter((snapshot): snapshot is CSSSnapshot => snapshot !== null);
  } catch (error) {
    console.error("Failed to load snapshots:", error);
    return [];
  }
};

/**
 * Optimizes a snapshot for storage by removing or compressing large properties
 * @param snapshot The snapshot to optimize
 * @returns Optimized snapshot with reduced size
 */
export const optimizeSnapshotForStorage = (snapshot: CSSSnapshot): CSSSnapshot => {
  // Create a deep copy to avoid modifying the original
  const optimizedSnapshot = JSON.parse(JSON.stringify(snapshot)) as CSSSnapshot;
  
  // Remove the full snapshot tree as it's the largest part and can be reconstructed if needed
  if ('snapshotTree' in optimizedSnapshot) {
    delete (optimizedSnapshot as any).snapshotTree;
  }
  
  // Limit the number of styles if there are too many
  if ((optimizedSnapshot as any).styles && Object.keys((optimizedSnapshot as any).styles).length > MAX_SNAPSHOT_ELEMENTS) {
    const styleEntries = Object.entries((optimizedSnapshot as any).styles);
    // Keep only the most important elements (first MAX_SNAPSHOT_ELEMENTS)
    (optimizedSnapshot as any).styles = Object.fromEntries(styleEntries.slice(0, MAX_SNAPSHOT_ELEMENTS));
    // Update element count to reflect the change
    optimizedSnapshot.elementCount = MAX_SNAPSHOT_ELEMENTS;
  }
  
  // Limit the number of positions if there are too many
  if ((optimizedSnapshot as any).positions && Object.keys((optimizedSnapshot as any).positions).length > MAX_SNAPSHOT_ELEMENTS) {
    const positionEntries = Object.entries((optimizedSnapshot as any).positions);
    (optimizedSnapshot as any).positions = Object.fromEntries(positionEntries.slice(0, MAX_SNAPSHOT_ELEMENTS));
  }
  
  return optimizedSnapshot;
};

/**
 * Creates a minimal snapshot version for emergency storage when quota is exceeded
 * @param snapshot The original snapshot
 * @returns Minimal snapshot with only essential data
 */
export const createMinimalSnapshot = (snapshot: CSSSnapshot): CSSSnapshot => {
  return {
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    url: snapshot.url,
    title: snapshot.title,
    elementCount: Math.min(snapshot.elementCount, 100), // Severely limit element count
    snapshotTree: {
      nodeId: 'root',
      path: ['body'],
      tag: 'BODY',
      classList: [],
      attributes: {},
      boundingBox: { top: 0, left: 0, width: 0, height: 0 },
      styles: {},
      children: []
    }
  };
};

/**
 * Saves snapshots to storage with optimized error handling and storage management
 * @param updatedSnapshots New array of snapshots to save
 * @param currentSnapshots Current array of snapshots for comparison
 * @returns Promise resolving when save is complete
 */
export const saveSnapshots = async (
  updatedSnapshots: CSSSnapshot[], 
  currentSnapshots: CSSSnapshot[]
): Promise<void> => {
  try {
    // Get current snapshots to find deleted ones
    const currentIds = currentSnapshots.map(s => s.id);
    const updatedIds = updatedSnapshots.map(s => s.id);
    
    // Find deleted snapshots
    const deletedIds = currentIds.filter(id => !updatedIds.includes(id));
    
    // Remove deleted snapshots first to free up space
    await Promise.all(deletedIds.map(id => 
      ExtensionStorageManager.removeCSSSnapshot(id).catch(error => 
        console.warn(`Failed to remove snapshot ${id}:`, error)
      )
    ));
    
    // Save new and updated snapshots with progressive optimization
    for (const snapshot of updatedSnapshots) {
      try {
        // Try saving with basic optimization first
        const optimizedSnapshot = optimizeSnapshotForStorage(snapshot);
        await ExtensionStorageManager.saveCSSSnapshot(snapshot.id, optimizedSnapshot);
      } catch (error) {
        if ((error as any).name === 'QuotaExceededError') {
          console.warn(`Storage quota exceeded for snapshot ${snapshot.id}. Applying more aggressive optimization.`);
          
          try {
            // Try with minimal version
            const minimalSnapshot = createMinimalSnapshot(snapshot);
            await ExtensionStorageManager.saveCSSSnapshot(snapshot.id, minimalSnapshot);
          } catch (minimalError) {
            console.error(`Failed to save even minimal version of snapshot ${snapshot.id}:`, minimalError);
            // Skip this snapshot but don't fail the entire operation
          }
        } else {
          console.error(`Failed to save snapshot ${snapshot.id}:`, error);
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("Failed to save snapshots:", error);
    throw error;
  }
};

/**
 * Deletes a snapshot from storage with error handling
 * @param id ID of the snapshot to delete
 * @returns Promise resolving when deletion is complete
 */
export const deleteSnapshot = async (id: string): Promise<void> => {
  try {
    await ExtensionStorageManager.removeCSSSnapshot(id);
  } catch (error) {
    console.error(`Failed to delete snapshot ${id}:`, error);
    throw error;
  }
};