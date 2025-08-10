/**
 * Утиліти для зберігання CSS знімків
 */
import { CSSSnapshot } from '../types';
import ExtensionStorageManager from '@entrypoints/core/services/storage/ExtensionStorageManager';
import { PERFORMANCE_LIMITS } from '../constants';
import { store } from '@entrypoints/content/store/createStore';
import { setSnapshots } from '@entrypoints/content/store/snapshot/snapshotSlice';

/**
 * Завантажує всі знімки зі сховища
 */
export const loadSnapshots = async (): Promise<CSSSnapshot[]> => {
  try {
    const snapshotIds = await ExtensionStorageManager.getAllCSSSnapshots();
    
    if (!Array.isArray(snapshotIds)) {
      return [];
    }
    
    // Завантажуємо знімки паралельно для кращої продуктивності
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
 * Зберігає знімки у сховище
 */
export const saveSnapshots = async (snapshots: CSSSnapshot[]): Promise<void> => {
  try {
    // Оптимізуємо знімки перед збереженням
    const optimizedSnapshots = snapshots.map(optimizeSnapshot);
    
    // Зберігаємо кожен знімок окремо
    for (const snapshot of optimizedSnapshots) {
      try {
        await ExtensionStorageManager.saveCSSSnapshot(snapshot.id, snapshot);
      } catch (error) {
        if ((error as any).name === 'QuotaExceededError') {
          console.warn(`Storage quota exceeded for snapshot ${snapshot.id}`);
          // Спробуємо зберегти мінімальну версію
          const minimalSnapshot = createMinimalSnapshot(snapshot);
          await ExtensionStorageManager.saveCSSSnapshot(snapshot.id, minimalSnapshot);
        } else {
          throw error;
        }
      }
    }
    
    // Оновлюємо Redux стейт після успішного збереження
    store.dispatch(setSnapshots(optimizedSnapshots));
  } catch (error) {
    console.error('Failed to save snapshots:', error);
    throw error;
  }
};

/**
 * Видаляє знімок зі сховища
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
 * Експортує знімок у JSON файл
 */
export const exportSnapshot = (snapshot: CSSSnapshot): void => {
  const dataStr = JSON.stringify(snapshot, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileName = `css-snapshot-${snapshot.id}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileName);
  linkElement.click();
};

/**
 * Оптимізує знімок для зберігання
 */
const optimizeSnapshot = (snapshot: CSSSnapshot): CSSSnapshot => {
  // Обрізаємо дуже великі дерева
  const optimizedRoot = optimizeNode(snapshot.root, PERFORMANCE_LIMITS.MAX_ELEMENTS);
  
  return {
    ...snapshot,
    root: optimizedRoot,
    elementCount: Math.min(snapshot.elementCount, PERFORMANCE_LIMITS.MAX_ELEMENTS),
  };
};

/**
 * Оптимізує вузол дерева рекурсивно
 */
const optimizeNode = (node: CSSSnapshot['root'], maxNodes: number, processed = { count: 0 }): CSSSnapshot['root'] => {
  if (processed.count >= maxNodes) {
    return {
      ...node,
      children: [],
    };
  }
  
  processed.count++;
  
  // Обмежуємо кількість дочірніх елементів
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
 * Створює мінімальну версію знімка
 */
const createMinimalSnapshot = (snapshot: CSSSnapshot): CSSSnapshot => {
  return {
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    url: snapshot.url,
    title: snapshot.title,
    elementCount: Math.min(snapshot.elementCount, 100),
    root: {
      id: 'root-minimal',
      path: ['body'],
      tag: 'body',
      classes: [],
      attributes: {},
      bounds: { top: 0, left: 0, width: 0, height: 0 },
      styles: {},
      children: [],
    },
    metadata: snapshot.metadata,
  };
};
