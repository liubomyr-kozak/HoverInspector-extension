import { Ext } from "@entrypoints/features/extension/Ext";
import {
  AUTOMATION_TAB_PORT,
  EXECUTION_HANDOFF_KEY,
  EXECUTION_SESSION_KEY,
  ExecutionHandoff,
  ExecutionSession,
  getSessionOwner,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/executionSession.ts";
import { isDomainTriggerMatch } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/validationUtils.ts";
import { TriggerConfig } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types.ts";
import { AUTOMATION_SCENARIO_PREFIX } from "@entrypoints/core/constants/automation.ts";

/**
 * Background side of scenario automation across tabs:
 * - tells a content script which tab it runs in (needed to own a playback session)
 * - when a playing (or recording) tab opens a new tab, moves the playback there and turns the extension on
 *   in that tab, so the scenario continues in it
 * - turns the extension on in tabs whose URL matches an enabled domain trigger, so the trigger can start
 *   its scenario without the user opening Hover Inspector first
 */

const EDITING_STATE_KEY = "AUTOMATION_SCENARIO_automation_scenario_editing_state";

// A new tab is linked to the playback only if the session was moved forward this recently
const HANDOFF_WINDOW = 15000;

// New tabs waiting for their page to load before the extension is turned on in them
const tabsToActivate = new Set<number>();

/**
 * Answers the content script port asking for its tab id. Returns true when the port was handled.
 */
export function handleAutomationTabPort(port: chrome.runtime.Port): boolean {
  if (port.name !== AUTOMATION_TAB_PORT) return false;
  port.postMessage({ tabId: port.sender?.tab?.id ?? null });
  return true;
}

function isRecording(rawEditingState: unknown): boolean {
  return parseStored<{ status?: string }>(rawEditingState)?.status === "recording";
}

async function onTabCreated(tab: chrome.tabs.Tab) {
  const openerTabId = tab.openerTabId;
  if (!tab.id || openerTabId === undefined) return;

  const items = await chrome.storage.local.get([EXECUTION_SESSION_KEY, EXECUTION_HANDOFF_KEY, EDITING_STATE_KEY]);
  const session = items[EXECUTION_SESSION_KEY] as ExecutionSession | undefined;
  const handoff = items[EXECUTION_HANDOFF_KEY] as ExecutionHandoff | undefined;

  if (
    session &&
    getSessionOwner(session, handoff) === openerTabId &&
    Date.now() - session.updatedAt < HANDOFF_WINDOW
  ) {
    // The step that was just run opened this tab: the playback continues here
    const newHandoff: ExecutionHandoff = { scenarioId: session.scenarioId, fromTabId: openerTabId, toTabId: tab.id };
    await chrome.storage.local.set({ [EXECUTION_HANDOFF_KEY]: newHandoff });
    tabsToActivate.add(tab.id);
  } else if (Ext.session.isActive(openerTabId) && isRecording(items[EDITING_STATE_KEY])) {
    // Keep recording in the tab the user opened from the recorded page
    tabsToActivate.add(tab.id);
  }
}

const TRIGGER_KEY_PREFIX = `${AUTOMATION_SCENARIO_PREFIX}tr_`;

function parseStored<T>(value: unknown): T | null {
  try {
    return (typeof value === "string" ? JSON.parse(value) : value) as T;
  } catch {
    return null;
  }
}

// Triggers by storage key, read once and refreshed when a trigger changes
let triggersCache: Promise<Record<string, TriggerConfig | null>> | null = null;

async function loadTriggers(): Promise<Record<string, TriggerConfig | null>> {
  const storage = chrome.storage.local as typeof chrome.storage.local & { getKeys?: () => Promise<string[]> };
  let items: Record<string, unknown>;
  if (typeof storage.getKeys === "function") {
    const keys = (await storage.getKeys()).filter((key) => key.startsWith(TRIGGER_KEY_PREFIX));
    items = keys.length > 0 ? await chrome.storage.local.get(keys) : {};
  } else {
    items = await chrome.storage.local.get(null);
  }

  return Object.fromEntries(
    Object.keys(items)
      .filter((key) => key.startsWith(TRIGGER_KEY_PREFIX))
      .map((key) => [key, parseStored<TriggerConfig>(items[key])]),
  );
}

function getTriggers() {
  if (!triggersCache) {
    triggersCache = loadTriggers().catch((error) => {
      triggersCache = null;
      throw error;
    });
  }
  return triggersCache;
}

// The domain triggers that turned the extension on in each tab, per site: a trigger runs once per tab and
// site (see TriggerScenarioEvaluator), so the extension isn't turned on again for it after the user closed it.
// Kept in session storage so it survives the service worker restarting.
const TRIGGER_ACTIVATIONS_KEY = "automation_trigger_activations";

type TriggerActivations = Record<string, string[]>;

async function getTriggerActivations(): Promise<TriggerActivations> {
  try {
    const items = await chrome.storage.session.get(TRIGGER_ACTIVATIONS_KEY);
    return (items[TRIGGER_ACTIVATIONS_KEY] as TriggerActivations) || {};
  } catch {
    return {};
  }
}

async function setTriggerActivations(activations: TriggerActivations) {
  try {
    await chrome.storage.session.set({ [TRIGGER_ACTIVATIONS_KEY]: activations });
  } catch {
    // ignore
  }
}

async function forgetTriggerActivations(tabId: number) {
  const activations = await getTriggerActivations();
  if (activations[tabId]) {
    delete activations[tabId];
    await setTriggerActivations(activations);
  }
}

async function activateIfTriggered(tabId: number, url: string | undefined) {
  if (!url || !/^https?:/.test(url) || Ext.session.isActive(tabId)) return;

  const triggers = await getTriggers();
  const origin = new URL(url).origin;
  const matching = Object.keys(triggers)
    .filter((key) => isDomainTriggerMatch(triggers[key], url))
    .map((key) => `${key}|${origin}`);
  if (matching.length === 0) return;

  // Already turned on for these triggers on this site: the triggers have run, or the user closed it
  const activations = await getTriggerActivations();
  const done = activations[tabId] || [];
  const pending = matching.filter((entry) => !done.includes(entry));
  if (pending.length === 0) return;

  activations[tabId] = [...done, ...pending];
  await setTriggerActivations(activations);
  await Ext.session.activate(tabId);
}

export function registerAutomationTabListeners() {
  chrome.tabs.onCreated.addListener((tab) => {
    onTabCreated(tab).catch((error) => console.error("Error handling new tab for automation:", error));
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") return;

    if (tabsToActivate.has(tabId)) {
      tabsToActivate.delete(tabId);
      Ext.session.activate(tabId).catch((error) => console.error("Error activating automation tab:", error));
      return;
    }

    activateIfTriggered(tabId, tab.url).catch((error) => console.error("Error checking URL triggers:", error));
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    tabsToActivate.delete(tabId);
    forgetTriggerActivations(tabId).catch(() => {});
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && Object.keys(changes).some((key) => key.startsWith(TRIGGER_KEY_PREFIX))) {
      triggersCache = null;
    }
  });
}
