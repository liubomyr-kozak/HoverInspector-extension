import { useSyncExternalStore } from "react";
import { browser } from "wxt/browser";
import { LIVE_WATCH_EVENTS_KEY, LIVE_WATCH_SETTINGS_KEY } from "@entrypoints/core/constants/liveWatch";
import { LiveWatchSettings, WatchEvent } from "./types";
import { mergeEvents, sanitizeEvents } from "./utils/patterns";

/**
 * Live watching state, kept in browser.storage.local (the extension's storage in this browser profile).
 * Nothing here is ever sent anywhere. The settings follow the user to other tabs at once; the watched
 * events are written in batches so a busy page does not cause a storage write per click.
 */

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
      if (changes[LIVE_WATCH_EVENTS_KEY]) {
        storedCount = sanitizeEvents(changes[LIVE_WATCH_EVENTS_KEY].newValue).length;
        countListeners.forEach((listener) => listener());
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
let storedCount = 0;
let countLoaded = false;
const countListeners = new Set<() => void>();

/** All stored events (every site), oldest first */
export async function loadWatchEvents(): Promise<WatchEvent[]> {
  const stored = await storage()?.get(LIVE_WATCH_EVENTS_KEY);
  return mergeEvents(sanitizeEvents(stored?.[LIVE_WATCH_EVENTS_KEY]), pending);
}

/** Queues an event; it is written with the next batch */
export function queueWatchEvent(event: WatchEvent) {
  pending.push(event);
  if (flushTimer === null) flushTimer = window.setTimeout(flushWatchEvents, FLUSH_DELAY_MS);
}

/** Writes the queued events now (the page is being hidden or closed) */
export async function flushWatchEvents() {
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!pending.length) return;
  const batch = pending;
  pending = [];
  try {
    // Read first: other tabs add their own events to the same list
    const stored = await storage()?.get(LIVE_WATCH_EVENTS_KEY);
    const events = mergeEvents(sanitizeEvents(stored?.[LIVE_WATCH_EVENTS_KEY]), batch);
    await storage()?.set({ [LIVE_WATCH_EVENTS_KEY]: events });
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
  await storage()
    ?.remove(LIVE_WATCH_EVENTS_KEY)
    .catch(() => undefined);
  storedCount = 0;
  countListeners.forEach((listener) => listener());
}

const subscribeCount = (listener: () => void) => {
  ensureSettingsLoaded();
  if (!countLoaded) {
    countLoaded = true;
    storage()
      ?.get(LIVE_WATCH_EVENTS_KEY)
      .then((stored) => {
        storedCount = sanitizeEvents(stored?.[LIVE_WATCH_EVENTS_KEY]).length;
        countListeners.forEach((l) => l());
      })
      .catch(() => undefined);
  }
  countListeners.add(listener);
  return () => countListeners.delete(listener);
};

/** How many events are stored (shown next to the "Clear" action) */
export function useStoredWatchEventCount(): number {
  return useSyncExternalStore(subscribeCount, () => storedCount);
}
