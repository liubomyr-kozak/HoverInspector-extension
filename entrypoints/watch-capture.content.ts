import { browser } from "wxt/browser";
import { startWatchCapture } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/liveWatch/capture";
import {
  isCaptureAnswer,
  LIVE_WATCH_CAPTURE_QUERY,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/liveWatch/captureProtocol";

/**
 * Live watching capture, from the very start of every page while live watching is on (the background
 * registers it then, see background/liveWatchCapture.ts). It notes the user's actions only in tabs where
 * Hover Inspector is switched on; elsewhere it stops as soon as the background says so.
 */
export default defineContentScript({
  matches: ["*://*/*"],
  registration: "runtime",
  runAt: "document_start",
  main() {
    const confirmed = browser.runtime
      .sendMessage({ type: LIVE_WATCH_CAPTURE_QUERY })
      .then((answer: unknown) => (isCaptureAnswer(answer) ? answer : { capture: false, tabId: null }))
      .catch(() => ({ capture: false, tabId: null }));
    startWatchCapture({ pageStart: true, confirmed });
  },
});
