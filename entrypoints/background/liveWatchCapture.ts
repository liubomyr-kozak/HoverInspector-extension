import { Ext } from "@entrypoints/features/extension/Ext";
import { LIVE_WATCH_SETTINGS_KEY } from "@entrypoints/core/constants/automation.ts";
import {
  CaptureAnswer,
  isCaptureQuery,
  LIVE_WATCH_CAPTURE_SCRIPT_FILE,
  LIVE_WATCH_CAPTURE_SCRIPT_ID,
} from "@entrypoints/content/modules/PopupContainer/LiveWatch/captureProtocol.ts";

/**
 * Background side of live watching:
 * - while live watching is on, registers the capture script for every page load (document_start), so the
 *   user's first click on a new page is noted even though the panel's content script comes ~1 s later
 * - answers the capture script: it notes actions only in tabs where Hover Inspector is switched on
 * - lets content scripts use storage.session, where the text typed in watched fields is kept (memory only)
 */

const isEnabled = (raw: unknown) => !!raw && typeof raw === "object" && (raw as { enabled?: unknown }).enabled === true;

// Registration calls must not overlap: two quick toggles would register the script twice and fail
let registration: Promise<void> = Promise.resolve();

/**
 * Makes the registration match the setting. The setting is read inside the queue, not passed in: the read
 * at startup can resolve after a newer change, and a stale "off" would unregister the script for good.
 */
function syncRegistration() {
  registration = registration
    .then(async () => {
      const stored = await chrome.storage.local.get(LIVE_WATCH_SETTINGS_KEY);
      const enabled = isEnabled(stored[LIVE_WATCH_SETTINGS_KEY]);
      const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [LIVE_WATCH_CAPTURE_SCRIPT_ID] });
      if (enabled && existing.length === 0) {
        await chrome.scripting.registerContentScripts([
          {
            id: LIVE_WATCH_CAPTURE_SCRIPT_ID,
            js: [LIVE_WATCH_CAPTURE_SCRIPT_FILE],
            matches: ["*://*/*"],
            runAt: "document_start",
            allFrames: false,
            persistAcrossSessions: true,
          },
        ]);
      } else if (!enabled && existing.length > 0) {
        await chrome.scripting.unregisterContentScripts({ ids: [LIVE_WATCH_CAPTURE_SCRIPT_ID] });
      }
    })
    .catch((error) => console.warn("Live watching: could not update the capture script", error));
}

async function answerCaptureQuery(tabId: number): Promise<CaptureAnswer> {
  const stored = await chrome.storage.local.get(LIVE_WATCH_SETTINGS_KEY);
  await Ext.session.ready;
  return { capture: isEnabled(stored[LIVE_WATCH_SETTINGS_KEY]) && Ext.session.isActive(tabId), tabId };
}

export function registerLiveWatchCapture() {
  chrome.storage.session
    ?.setAccessLevel?.({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
    .catch(() => undefined);

  syncRegistration();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[LIVE_WATCH_SETTINGS_KEY]) return;
    const was = isEnabled(changes[LIVE_WATCH_SETTINGS_KEY].oldValue);
    const now = isEnabled(changes[LIVE_WATCH_SETTINGS_KEY].newValue);
    if (was !== now) syncRegistration();
  });

  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isCaptureQuery(message)) return false;
    const tabId = sender.tab?.id;
    if (sender.id !== chrome.runtime.id || tabId === undefined || sender.frameId !== 0) {
      sendResponse({ capture: false, tabId: null } satisfies CaptureAnswer);
      return false;
    }
    answerCaptureQuery(tabId)
      .then(sendResponse)
      .catch(() => sendResponse({ capture: false, tabId } satisfies CaptureAnswer));
    return true;
  });
}
