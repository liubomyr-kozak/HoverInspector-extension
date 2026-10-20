import { useSyncExternalStore } from "react";
import { browser } from "wxt/browser";
import { WatchEvent } from "./types";
import { sanitizeEvents } from "./utils/patterns";
import {
  chunkIdOf,
  chunksOverLimit,
  clearStoredLog,
  LOG_HIDDEN_KEY,
  loadStoredLog,
  removeChunks,
  sanitizeHidden,
  sanitizeValues,
  saveHidden,
  valuesChunkIdOf,
} from "./watchLogStorage";

/**
 * The watch log as the panel shows it: every chunk in storage, kept up to date from storage.onChanged
 * (the capture of this page and of other tabs write there), oldest event first.
 */
export interface WatchLogSnapshot {
  loaded: boolean;
  /** Every stored event that was not deleted, oldest first; the panel shows the last `limit` */
  events: WatchEvent[];
  /** Typed text by event id (memory only, see watchLogStorage.ts) */
  values: ReadonlyMap<string, string>;
}

/** Rebuilding the list waits this long, so a burst of writes is one update */
const REBUILD_DELAY_MS = 60;
/** Checking the limit waits for a quiet moment */
const TRIM_DELAY_MS = 2000;

const chunks = new Map<string, WatchEvent[]>();
const valueChunks = new Map<string, Record<string, string>>();
let hidden = new Set<string>();
let limit = Infinity;
let snapshot: WatchLogSnapshot = { loaded: false, events: [], values: new Map() };
let started = false;
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
let trimTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function rebuild() {
  rebuildTimer = null;
  const events: WatchEvent[] = [];
  chunks.forEach((list) => list.forEach((event) => !hidden.has(event.id) && events.push(event)));
  events.sort((a, b) => a.time - b.time);
  const values = new Map<string, string>();
  valueChunks.forEach((record) => Object.entries(record).forEach(([id, value]) => values.set(id, value)));
  snapshot = { loaded: true, events, values };
  listeners.forEach((listener) => listener());
  scheduleTrim();
}

function scheduleRebuild() {
  if (rebuildTimer === null) rebuildTimer = setTimeout(rebuild, REBUILD_DELAY_MS);
}

function scheduleTrim() {
  if (trimTimer !== null || !Number.isFinite(limit)) return;
  trimTimer = setTimeout(() => {
    trimTimer = null;
    trim().catch(() => undefined);
  }, TRIM_DELAY_MS);
}

// Only whole chunks are removed: a page that still writes its chunk is never raced (see watchLogStorage.ts)
async function trim() {
  const visible = new Map([...chunks].map(([id, list]) => [id, list.filter((event) => !hidden.has(event.id))]));
  const removed = chunksOverLimit(visible, limit);
  if (!removed.length) return;
  const gone = new Set(removed.flatMap((id) => (chunks.get(id) || []).map((event) => event.id)));
  await removeChunks(removed);
  if (gone.size && [...hidden].some((id) => gone.has(id))) {
    hidden = new Set([...hidden].filter((id) => !gone.has(id)));
    await saveHidden([...hidden]);
  }
}

const onStorageChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
  let changed = false;
  Object.entries(changes).forEach(([key, change]) => {
    if (area === "local") {
      const chunkId = chunkIdOf(key);
      if (chunkId) {
        if (change.newValue === undefined) chunks.delete(chunkId);
        else chunks.set(chunkId, sanitizeEvents(change.newValue));
        changed = true;
      } else if (key === LOG_HIDDEN_KEY) {
        hidden = new Set(sanitizeHidden(change.newValue));
        changed = true;
      }
    } else if (area === "session") {
      const chunkId = valuesChunkIdOf(key);
      if (chunkId) {
        if (change.newValue === undefined) valueChunks.delete(chunkId);
        else valueChunks.set(chunkId, sanitizeValues(change.newValue));
        changed = true;
      }
    }
  });
  if (changed) scheduleRebuild();
};

function start() {
  if (started) return;
  started = true;
  try {
    browser.storage.onChanged.addListener(onStorageChanged);
  } catch {
    // No storage events (tests)
  }
  loadStoredLog()
    .then((stored) => {
      // Changes that arrived while loading are newer than what was read
      stored.chunks.forEach((list, id) => !chunks.has(id) && chunks.set(id, list));
      stored.values.forEach((record, id) => !valueChunks.has(id) && valueChunks.set(id, record));
      stored.hidden.forEach((id) => hidden.add(id));
      rebuild();
    })
    .catch(() => rebuild());
}

const subscribe = (listener: () => void) => {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

export function useWatchLog(): WatchLogSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** The log keeps about this many events; older chunks are removed */
export function setWatchLogLimit(next: number) {
  limit = next;
  if (snapshot.loaded) scheduleTrim();
}

/** Deletes events (the rows the user removed from the log) */
export async function deleteWatchEvents(ids: string[]) {
  if (!ids.length) return;
  ids.forEach((id) => hidden.add(id));
  rebuild();
  await saveHidden([...hidden]);
}

/** Forgets the whole log, in this tab and in storage */
export async function clearWatchLog() {
  chunks.clear();
  valueChunks.clear();
  hidden = new Set();
  rebuild();
  await clearStoredLog();
}
