import { useSyncExternalStore } from "react";
import { browser } from "wxt/browser";
import { LIVE_WATCH_SETTINGS_KEY } from "@entrypoints/core/constants/automation";
import { LiveWatchSettings, WatchLogMode, WatchPanelLayout } from "./types";

/**
 * Live watching preferences, kept in browser.storage.local (the extension's storage in this browser
 * profile). Nothing here is ever sent anywhere. The settings follow the user to other tabs at once.
 * The watched actions themselves are in watchLogStorage.ts.
 */
export { LIVE_WATCH_SETTINGS_KEY };

/** Remembered "don't suggest again" choices; the oldest are forgotten first */
const DISMISSED_LIMIT = 200;

/** How many actions the log can keep: the choices offered in the panel */
export const WATCH_LIMIT_OPTIONS = [100, 250, 500, 1000, 2000, 5000];
export const DEFAULT_WATCH_LIMIT = 1000;

export const DEFAULT_PANEL: WatchPanelLayout = { open: true, x: 16, y: 96, width: 360, height: 460 };

const DEFAULT_SETTINGS: LiveWatchSettings = {
  enabled: false,
  dismissedPatterns: [],
  mutedFields: [],
  mode: WatchLogMode.SMART,
  limit: DEFAULT_WATCH_LIMIT,
  panel: DEFAULT_PANEL,
};

const storage = () => browser?.storage?.local;

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(-DISMISSED_LIMIT) : [];

const finite = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

function normalizePanel(raw: unknown): WatchPanelLayout {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PANEL };
  const value = raw as Partial<WatchPanelLayout>;
  return {
    open: typeof value.open === "boolean" ? value.open : DEFAULT_PANEL.open,
    x: Math.max(0, finite(value.x, DEFAULT_PANEL.x)),
    y: Math.max(0, finite(value.y, DEFAULT_PANEL.y)),
    width: Math.max(280, finite(value.width, DEFAULT_PANEL.width)),
    height: Math.max(240, finite(value.height, DEFAULT_PANEL.height)),
  };
}

export function normalizeSettings(raw: unknown): LiveWatchSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS, panel: { ...DEFAULT_PANEL } };
  const value = raw as Partial<LiveWatchSettings>;
  return {
    enabled: value.enabled === true,
    dismissedPatterns: stringList(value.dismissedPatterns),
    mutedFields: stringList(value.mutedFields),
    mode: value.mode === WatchLogMode.RAW ? WatchLogMode.RAW : WatchLogMode.SMART,
    limit: WATCH_LIMIT_OPTIONS.includes(value.limit as number) ? (value.limit as number) : DEFAULT_WATCH_LIMIT,
    panel: normalizePanel(value.panel),
  };
}

// ---- settings ----

let settings: LiveWatchSettings = normalizeSettings(undefined);
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
      if (area !== "local" || !changes[LIVE_WATCH_SETTINGS_KEY]) return;
      const next = normalizeSettings(changes[LIVE_WATCH_SETTINGS_KEY].newValue);
      // Our own writes come back here too; skip them when nothing changed
      if (JSON.stringify(next) !== JSON.stringify(settings)) applySettings(next);
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
  // Turning watching on shows the log, so the user sees at once that it works
  updateLiveWatchSettings(enabled ? { enabled, panel: { ...settings.panel, open: true } } : { enabled });
}

/**
 * The launcher button of the tool: turns watching on, shows a hidden log, or turns watching off
 */
export function toggleLiveWatch() {
  if (!settings.enabled || !settings.panel.open) setLiveWatchEnabled(true);
  else setLiveWatchEnabled(false);
}

export function updateWatchPanel(change: Partial<WatchPanelLayout>) {
  updateLiveWatchSettings({ panel: { ...settings.panel, ...change } });
}

export function dismissPattern(patternId: string) {
  updateLiveWatchSettings({ dismissedPatterns: [...settings.dismissedPatterns.filter((id) => id !== patternId), patternId] });
}

/** Brings back every suggestion hidden with "Don't suggest again" */
export function restoreDismissedPatterns() {
  updateLiveWatchSettings({ dismissedPatterns: [] });
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
