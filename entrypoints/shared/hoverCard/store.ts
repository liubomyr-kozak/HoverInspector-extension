import { useSyncExternalStore } from "react";
import { browser } from "wxt/browser";
import { defaultConfig, HoverCardConfig, normalizeConfig } from "./catalog";

/**
 * The hover card layout, kept in browser.storage.local so it survives reloads and follows the user to
 * other tabs. The card and the editor read it through useHoverCardConfig(); changes apply at once.
 */
export const HOVER_CARD_STORAGE_KEY = "hoverCardConfig";

let current: HoverCardConfig = defaultConfig();
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const apply = (raw: unknown) => {
  current = normalizeConfig(raw);
  emit();
};

const storage = () => browser?.storage?.local;

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  const local = storage();
  if (!local) return;
  local
    .get(HOVER_CARD_STORAGE_KEY)
    .then((stored) => {
      if (stored?.[HOVER_CARD_STORAGE_KEY]) apply(stored[HOVER_CARD_STORAGE_KEY]);
    })
    .catch(() => undefined);
  try {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[HOVER_CARD_STORAGE_KEY]) return;
      const next = changes[HOVER_CARD_STORAGE_KEY].newValue;
      // Our own writes come back here too; skip them when nothing changed
      if (JSON.stringify(normalizeConfig(next)) !== JSON.stringify(current)) apply(next);
    });
  } catch {
    // No storage events (tests, standalone preview)
  }
}

export function getHoverCardConfig(): HoverCardConfig {
  ensureLoaded();
  return current;
}

export function setHoverCardConfig(next: HoverCardConfig) {
  apply(next);
  storage()
    ?.set({ [HOVER_CARD_STORAGE_KEY]: current })
    .catch(() => undefined);
}

export function resetHoverCardConfig() {
  setHoverCardConfig(defaultConfig());
}

const subscribe = (listener: () => void) => {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useHoverCardConfig(): HoverCardConfig {
  return useSyncExternalStore(subscribe, getHoverCardConfig);
}
