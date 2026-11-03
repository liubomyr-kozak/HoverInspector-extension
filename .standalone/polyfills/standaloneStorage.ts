/**
 * `browser.storage` for the standalone page (`yarn start`).
 *
 * The extension keeps its data in extension storage, the
 * standalone page has no extension, so it keeps the data in the page's own storage. Each key holds
 * the JSON of its value, the format `core/services/storage/LocalStorage.ts` already uses in
 * development, so both paths read the same data and survive a reload.
 */

export type StorageAreaName = "local" | "session" | "sync";

export interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

export type StorageChanges = Record<string, StorageChange>;

type ChangeListener = (changes: StorageChanges, areaName: StorageAreaName) => void;

type GetKeys = string | string[] | Record<string, unknown> | null | undefined;

export interface StandaloneStorageArea {
  get: (keys?: GetKeys) => Promise<Record<string, unknown>>;
  getKeys: () => Promise<string[]>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
  clear: () => Promise<void>;
}

export interface StandaloneStorage {
  local: StandaloneStorageArea;
  session: StandaloneStorageArea;
  sync: StandaloneStorageArea;
  onChanged: {
    addListener: (listener: ChangeListener) => void;
    removeListener: (listener: ChangeListener) => void;
    hasListener: (listener: ChangeListener) => boolean;
  };
}

const parse = (raw: string | null): unknown => {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    // A value written by other page code, not by us: hand it over as the plain string
    return raw;
  }
};

const allKeys = (store: Storage): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key !== null) keys.push(key);
  }
  return keys;
};

const createArea = (
  areaName: StorageAreaName,
  store: Storage,
  emit: (changes: StorageChanges, areaName: StorageAreaName) => void,
): StandaloneStorageArea => {
  const read = (key: string) => parse(store.getItem(key));

  const removeKeys = (keys: string[]) => {
    const changes: StorageChanges = {};
    for (const key of keys) {
      const oldValue = read(key);
      if (oldValue === undefined) continue;
      store.removeItem(key);
      changes[key] = { oldValue };
    }
    if (Object.keys(changes).length > 0) emit(changes, areaName);
  };

  return {
    get: async (keys) => {
      if (keys === null || keys === undefined) {
        return Object.fromEntries(allKeys(store).map((key) => [key, read(key)]));
      }
      if (typeof keys === "string" || Array.isArray(keys)) {
        const result: Record<string, unknown> = {};
        for (const key of typeof keys === "string" ? [keys] : keys) {
          const value = read(key);
          if (value !== undefined) result[key] = value;
        }
        return result;
      }
      // An object lists keys with their defaults
      const result: Record<string, unknown> = {};
      for (const [key, fallback] of Object.entries(keys)) {
        const value = read(key);
        result[key] = value === undefined ? fallback : value;
      }
      return result;
    },
    getKeys: async () => allKeys(store),
    set: async (items) => {
      const changes: StorageChanges = {};
      for (const [key, newValue] of Object.entries(items)) {
        changes[key] = { oldValue: read(key), newValue };
        store.setItem(key, JSON.stringify(newValue));
      }
      emit(changes, areaName);
    },
    remove: async (keys) => removeKeys(typeof keys === "string" ? [keys] : keys),
    clear: async () => removeKeys(allKeys(store)),
  };
};

/**
 * `local` and `sync` share the page's localStorage (the extension's `local` data is what the
 * standalone page needs; there is no account to sync with). `session` uses sessionStorage, which,
 * like `chrome.storage.session`, is cleared when the browsing session ends.
 */
export const createStandaloneStorage = (persistent: Storage, perSession: Storage): StandaloneStorage => {
  const listeners = new Set<ChangeListener>();
  const emit = (changes: StorageChanges, areaName: StorageAreaName) => {
    listeners.forEach((listener) => listener(changes, areaName));
  };

  return {
    local: createArea("local", persistent, emit),
    session: createArea("session", perSession, emit),
    sync: createArea("sync", persistent, emit),
    onChanged: {
      addListener: (listener) => {
        listeners.add(listener);
      },
      removeListener: (listener) => {
        listeners.delete(listener);
      },
      hasListener: (listener) => listeners.has(listener),
    },
  };
};
