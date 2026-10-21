import { browser } from "wxt/browser";
import { WatchEvent } from "./types";
import { sanitizeEvents } from "./utils/patterns";

/**
 * Where the watch log lives. Built so that nothing is lost when a page navigates away and two tabs never
 * overwrite each other:
 *
 * - every page load writes its own chunk (`automationLiveWatchLog:<chunk id>` in storage.local) and is its
 *   only writer: no read-modify-write, a write is one call that the browser finishes even when the page
 *   unloads right after it
 * - a chunk holds at most CHUNK_SIZE events, then the page starts a new one, so a write stays small
 * - typed text goes to storage.session under the same chunk id (memory only, cleared when the browser closes)
 * - readers only ever remove whole chunks (clear, trimming to the limit) or hide events by id
 *   (`automationLiveWatchHidden`), so they never race with a page that is still writing
 *
 * Chunk ids start with the time in base 36, so sorting the ids sorts the chunks by age.
 */
export const LOG_CHUNK_PREFIX = "automationLiveWatchLog:";
export const LOG_VALUES_PREFIX = "automationLiveWatchValues:";
export const LOG_HIDDEN_KEY = "automationLiveWatchHidden";
/** The event list of earlier versions: read once and moved into a chunk */
export const LEGACY_EVENTS_KEY = "automationLiveWatchEvents";

export const CHUNK_SIZE = 200;
/** Ids of deleted events that are kept to hide them; the oldest go first */
const HIDDEN_LIMIT = 10000;

export const chunkKey = (chunkId: string) => `${LOG_CHUNK_PREFIX}${chunkId}`;
export const valuesKey = (chunkId: string) => `${LOG_VALUES_PREFIX}${chunkId}`;

export function newChunkId(time = Date.now()): string {
  return `${time.toString(36).padStart(9, "0")}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The chunk id of a storage key, or null for other keys */
export function chunkIdOf(key: string): string | null {
  return key.startsWith(LOG_CHUNK_PREFIX) ? key.slice(LOG_CHUNK_PREFIX.length) : null;
}

export function valuesChunkIdOf(key: string): string | null {
  return key.startsWith(LOG_VALUES_PREFIX) ? key.slice(LOG_VALUES_PREFIX.length) : null;
}

export function sanitizeValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const values: Record<string, string> = {};
  Object.entries(raw as Record<string, unknown>).forEach(([id, value]) => {
    if (typeof value === "string") values[id] = value;
  });
  return values;
}

export function sanitizeHidden(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string").slice(-HIDDEN_LIMIT) : [];
}

const local = () => browser?.storage?.local;
const session = () => browser?.storage?.session;

type KeyedStorage = typeof browser.storage.local & { getKeys?: () => Promise<string[]> };

async function keysWithPrefix(area: KeyedStorage | undefined, prefix: string): Promise<string[]> {
  if (!area) return [];
  const keys = typeof area.getKeys === "function" ? await area.getKeys() : Object.keys(await area.get(null));
  return keys.filter((key) => key.startsWith(prefix)).sort();
}

export interface StoredLog {
  chunks: Map<string, WatchEvent[]>;
  values: Map<string, Record<string, string>>;
  hidden: Set<string>;
}

/** Reads every chunk, typed text and hidden id. Moves the list of an earlier version into a chunk first. */
export async function loadStoredLog(): Promise<StoredLog> {
  const area = local();
  if (!area) return { chunks: new Map(), values: new Map(), hidden: new Set() };
  await migrateLegacyEvents();

  const keys = await keysWithPrefix(area, LOG_CHUNK_PREFIX);
  const items = keys.length ? await area.get([...keys, LOG_HIDDEN_KEY]) : await area.get(LOG_HIDDEN_KEY);
  const chunks = new Map<string, WatchEvent[]>();
  keys.forEach((key) => {
    const chunkId = chunkIdOf(key);
    if (chunkId) chunks.set(chunkId, sanitizeEvents(items[key]));
  });

  const values = new Map<string, Record<string, string>>();
  try {
    const sessionArea = session() as KeyedStorage | undefined;
    const valueKeys = await keysWithPrefix(sessionArea, LOG_VALUES_PREFIX);
    const stored = valueKeys.length && sessionArea ? await sessionArea.get(valueKeys) : {};
    valueKeys.forEach((key) => {
      const chunkId = valuesChunkIdOf(key);
      if (chunkId) values.set(chunkId, sanitizeValues(stored[key]));
    });
  } catch {
    // No session storage: typed text is not kept across pages
  }
  return { chunks, values, hidden: new Set(sanitizeHidden(items[LOG_HIDDEN_KEY])) };
}

async function migrateLegacyEvents() {
  const area = local();
  if (!area) return;
  const stored = await area.get(LEGACY_EVENTS_KEY);
  const events = sanitizeEvents(stored?.[LEGACY_EVENTS_KEY]);
  if (!stored?.[LEGACY_EVENTS_KEY]) return;
  const writes: Record<string, unknown> = {};
  for (let i = 0; i < events.length; i += CHUNK_SIZE) {
    const part = events.slice(i, i + CHUNK_SIZE);
    // A fixed id per part: two tabs migrating at once write the same chunks
    writes[chunkKey(`${part[0].time.toString(36).padStart(9, "0")}-legacy${i}`)] = part;
  }
  if (Object.keys(writes).length) await area.set(writes);
  await area.remove(LEGACY_EVENTS_KEY);
}

/** Removes whole chunks (and their typed text) */
export async function removeChunks(chunkIds: string[]): Promise<void> {
  if (!chunkIds.length) return;
  await local()?.remove(chunkIds.map(chunkKey));
  await session()
    ?.remove(chunkIds.map(valuesKey))
    .catch(() => undefined);
}

export async function saveHidden(ids: string[]): Promise<void> {
  await local()?.set({ [LOG_HIDDEN_KEY]: ids.slice(-HIDDEN_LIMIT) });
}

/** Forgets the whole log */
export async function clearStoredLog(): Promise<void> {
  const area = local();
  if (!area) return;
  const keys = await keysWithPrefix(area, LOG_CHUNK_PREFIX);
  await area.remove([...keys, LOG_HIDDEN_KEY, LEGACY_EVENTS_KEY]);
  try {
    const valueKeys = await keysWithPrefix(session() as KeyedStorage | undefined, LOG_VALUES_PREFIX);
    if (valueKeys.length) await session()?.remove(valueKeys);
  } catch {
    // No session storage
  }
}

/**
 * The oldest chunks to remove so that about `limit` events stay: whole chunks only, never so many that
 * fewer than `limit` remain
 */
export function chunksOverLimit(chunks: ReadonlyMap<string, WatchEvent[]>, limit: number): string[] {
  const ids = [...chunks.keys()].sort();
  let total = ids.reduce((sum, id) => sum + (chunks.get(id)?.length ?? 0), 0);
  const removed: string[] = [];
  for (const id of ids) {
    const size = chunks.get(id)?.length ?? 0;
    if (total - size < limit) break;
    total -= size;
    removed.push(id);
  }
  return removed;
}

/**
 * The events of a page load, written to its own chunk. Writes are batched for a moment and done at once
 * when the page is hidden or unloads.
 */
export class ChunkWriter {
  private chunkId = newChunkId();
  private events: WatchEvent[] = [];
  private values: Record<string, string> = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private valuesChanged = false;

  constructor(private readonly delay = 80) {}

  get currentChunkId() {
    return this.chunkId;
  }

  add(event: WatchEvent, value?: string) {
    if (this.events.length >= CHUNK_SIZE) this.rotate();
    this.events.push(event);
    if (value !== undefined) this.setValue(event.id, value);
    this.schedule();
  }

  /** Changes an event already written (typing goes on in the same field) */
  update(id: string, change: Partial<WatchEvent>, value?: string) {
    const index = this.events.findIndex((event) => event.id === id);
    if (index < 0) return false;
    this.events[index] = { ...this.events[index], ...change };
    if (value !== undefined) this.setValue(id, value);
    this.schedule();
    return true;
  }

  has(id: string) {
    return this.events.some((event) => event.id === id);
  }

  /** A reader removed this page's chunk (cleared or trimmed the log): go on in a new one */
  onChunkRemoved(chunkId: string) {
    if (chunkId !== this.chunkId) return;
    this.chunkId = newChunkId();
    this.events = [];
    this.values = {};
    this.valuesChanged = false;
  }

  flush() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.events.length) return;
    local()
      ?.set({ [chunkKey(this.chunkId)]: this.events })
      .catch(() => undefined);
    if (this.valuesChanged) {
      this.valuesChanged = false;
      session()
        ?.set({ [valuesKey(this.chunkId)]: this.values })
        .catch(() => undefined);
    }
  }

  dispose() {
    this.flush();
  }

  private setValue(id: string, value: string) {
    this.values[id] = value;
    this.valuesChanged = true;
  }

  private rotate() {
    this.flush();
    this.chunkId = newChunkId();
    this.events = [];
    this.values = {};
  }

  private schedule() {
    if (this.timer === null) this.timer = setTimeout(() => this.flush(), this.delay);
  }
}
