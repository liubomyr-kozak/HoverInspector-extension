import { useSyncExternalStore } from "react";
import { browser } from "wxt/browser";
import { LiveWatchSettings, WatchEvent } from "./types";
import { mergeEvents, sanitizeEvents } from "./utils/patterns";

/**
 * Live watching state, kept in browser.storage.local (the extension's storage in this browser profile).
 * Nothing here is ever sent anywhere. The settings follow the user to other tabs at once; the watched
 * events are written in batches so a busy page does not cause a storage write per click.
 */
export const LIVE_WATCH_SETTINGS_KEY = "automationLiveWatch";
export const LIVE_WATCH_EVENTS_KEY = "automationLiveWatchEvents";

/** Remembered "don't suggest again" choices; the oldest are forgotten first */
const DISMISSED_LIMIT = 200;
const FLUSH_DELAY_MS = 3000;

const DEFAULT_SETTINGS: LiveWatchSettings = { enabled: false, dismissedPatterns: [], mutedFields: [] };

const storage = () => browser?.storage?.local;

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(-DISMISSED_LIMIT) : [];

export function normalizeSettings(raw: unknown): LiveWatchSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const value = raw as Partial<LiveWatchSettings>;
  return {
    enabled: value.enabled === true,
    dismissedPatterns: stringList(value.dismissedPatterns),
    mutedFields: stringList(value.mutedFields),
  };
}

// ---- settings ----

let settings: LiveWatchSettings = { ...DEFAULT_SETTINGS };
let settingsLoaded = false;
const settingsListeners = new Set<() => void>();

const applySettings = (raw: unknown) => {
  settings = normalizeSettings(raw);
  settingsListeners.forEach((listener) => listener());
};

function ensureSettingsLoaded() {
  if (settingsLoaded) return;
  settingsLoaded = true;
  storage()
    ?.get(LIVE_WATCH_SETTINGS_KEY)
    .then((stored) => applySettings(stored?.[LIVE_WATCH_SETTINGS_KEY]))
    .catch(() => undefined);
  try {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes[LIVE_WATCH_SETTINGS_KEY]) {
        const next = normalizeSettings(changes[LIVE_WATCH_SETTINGS_KEY].newValue);
        // Our own writes come back here too; skip them when nothing changed
        if (JSON.stringify(next) !== JSON.stringify(settings)) applySettings(next);
      }
      const events = changes[LIVE_WATCH_EVENTS_KEY];
      if (events) {
        // Removed: "Clear" in some tab. Else merge: a tab that read the list before our last write landed
        // writes it back without our events, and our next write puts them back.
        setStoredEvents(events.newValue === undefined ? [] : mergeEvents(storedEvents, sanitizeEvents(events.newValue)));
      }
    });
  } catch {
    // No storage events (tests, standalone preview)
  }
}

export function getLiveWatchSettings(): LiveWatchSettings {
  ensureSettingsLoaded();
  return settings;
}

export function updateLiveWatchSettings(change: Partial<LiveWatchSettings>) {
  applySettings({ ...settings, ...change });
  storage()
    ?.set({ [LIVE_WATCH_SETTINGS_KEY]: settings })
    .catch(() => undefined);
}

export function setLiveWatchEnabled(enabled: boolean) {
  updateLiveWatchSettings({ enabled });
}

export function dismissPattern(patternId: string) {
  updateLiveWatchSettings({ dismissedPatterns: [...settings.dismissedPatterns.filter((id) => id !== patternId), patternId] });
}

/** "Show again": the pattern may be suggested again */
export function restorePattern(patternId: string) {
  updateLiveWatchSettings({ dismissedPatterns: settings.dismissedPatterns.filter((id) => id !== patternId) });
}

/** Forgets every "don't suggest again" choice, for patterns and fields */
export function restoreAllSuggestions() {
  updateLiveWatchSettings({ dismissedPatterns: [], mutedFields: [] });
}

export function muteField(xpath: string) {
  updateLiveWatchSettings({ mutedFields: [...settings.mutedFields.filter((id) => id !== xpath), xpath] });
}

const subscribeSettings = (listener: () => void) => {
  ensureSettingsLoaded();
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
};

export function useLiveWatchSettings(): LiveWatchSettings {
  return useSyncExternalStore(subscribeSettings, getLiveWatchSettings);
}

// ---- watched events ----

let pending: WatchEvent[] = [];
let flushTimer: number | null = null;
/** The stored list as last read or written; kept in step with storage by the onChanged listener */
let storedEvents: WatchEvent[] = [];
let storedLoaded = false;
let loading: Promise<void> | null = null;
const eventListeners = new Set<() => void>();

function setStoredEvents(events: WatchEvent[]) {
  storedEvents = events;
  storedLoaded = true;
  eventListeners.forEach((listener) => listener());
}

function ensureEventsLoaded(): Promise<void> {
  ensureSettingsLoaded();
  if (storedLoaded) return Promise.resolve();
  loading ??= (storage()?.get(LIVE_WATCH_EVENTS_KEY) ?? Promise.resolve(undefined))
    .then((stored) => {
      // A storage change may have been seen first: keep what it brought
      setStoredEvents(mergeEvents(sanitizeEvents(stored?.[LIVE_WATCH_EVENTS_KEY]), storedLoaded ? storedEvents : []));
    })
    .catch(() => undefined);
  return loading;
}

/** All stored events (every site), oldest first */
export async function loadWatchEvents(): Promise<WatchEvent[]> {
  await ensureEventsLoaded();
  return mergeEvents(storedEvents, pending);
}

/** Queues an event; it is written with the next batch */
export function queueWatchEvent(event: WatchEvent) {
  pending.push(event);
  if (flushTimer === null) flushTimer = window.setTimeout(flushWatchEvents, FLUSH_DELAY_MS);
}

/**
 * Writes the queued events now (the page is being hidden or closed). The write starts synchronously, from the
 * list kept in memory: a click that opens another page fires `pagehide` right away, and a read before the
 * write used to finish after the page was gone, so the actions that led to a navigation were lost.
 */
export function flushWatchEvents() {
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!pending.length) return;
  const batch = pending;
  pending = [];
  if (!storedLoaded) {
    // Nothing read yet: read first, other tabs add their own events to the same list
    ensureEventsLoaded().then(() => writeEvents(batch));
    return;
  }
  writeEvents(batch);
}

function writeEvents(batch: WatchEvent[]) {
  const events = mergeEvents(storedEvents, batch);
  setStoredEvents(events);
  try {
    storage()
      ?.set({ [LIVE_WATCH_EVENTS_KEY]: events })
      .catch(() => undefined);
  } catch {
    // Storage unavailable (extension reloaded): the batch is dropped, watching is best effort
  }
}

/** Forgets every watched event, in this tab and in storage */
export async function clearWatchEvents() {
  pending = [];
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  setStoredEvents([]);
  await storage()
    ?.remove(LIVE_WATCH_EVENTS_KEY)
    .catch(() => undefined);
}

const subscribeEvents = (listener: () => void) => {
  ensureEventsLoaded();
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
};

/** The stored events (every site, oldest first), for the log in the settings */
export function useStoredWatchEvents(): WatchEvent[] {
  return useSyncExternalStore(subscribeEvents, () => storedEvents);
}

/** How many events are stored (shown next to the "Clear" action) */
export function useStoredWatchEventCount(): number {
  return useStoredWatchEvents().length;
}
