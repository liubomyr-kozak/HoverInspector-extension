import { Ext } from "@entrypoints/features/extension/Ext";
import {
  AUTOMATION_TAB_PORT,
  EXECUTION_HANDOFF_KEY,
  EXECUTION_SESSION_KEY,
  ExecutionHandoff,
  ExecutionSession,
  getSessionOwner,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/executionSession.ts";

/**
 * Background side of scenario automation across tabs:
 * - tells a content script which tab it runs in (needed to own a playback session)
 * - when a playing (or recording) tab opens a new tab, moves the playback there and turns the extension on
 *   in that tab, so the scenario continues in it
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
  try {
    const state = typeof rawEditingState === "string" ? JSON.parse(rawEditingState) : rawEditingState;
    return (state as { status?: string } | undefined)?.status === "recording";
  } catch {
    return false;
  }
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

export function registerAutomationTabListeners() {
  chrome.tabs.onCreated.addListener((tab) => {
    onTabCreated(tab).catch((error) => console.error("Error handling new tab for automation:", error));
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== "complete" || !tabsToActivate.has(tabId)) return;
    tabsToActivate.delete(tabId);
    Ext.session.activate(tabId).catch((error) => console.error("Error activating automation tab:", error));
  });

  chrome.tabs.onRemoved.addListener((tabId) => tabsToActivate.delete(tabId));
}
