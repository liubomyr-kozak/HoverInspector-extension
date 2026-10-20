/**
 * Between the live watching capture script (started with every page) and the background: the capture asks
 * whether this tab is watched (live watching is on and Hover Inspector is switched on in the tab).
 */
export const LIVE_WATCH_CAPTURE_QUERY = "hiLiveWatchCaptureQuery";

/** The capture script, registered with scripting.registerContentScripts while live watching is on */
export const LIVE_WATCH_CAPTURE_SCRIPT_ID = "hi-live-watch-capture";
export const LIVE_WATCH_CAPTURE_SCRIPT_FILE = "content-scripts/watch-capture.js";

export interface CaptureQuery {
  type: typeof LIVE_WATCH_CAPTURE_QUERY;
}

export interface CaptureAnswer {
  capture: boolean;
  /** The tab the capture runs in (content scripts can't know it) */
  tabId: number | null;
}

export function isCaptureQuery(message: unknown): message is CaptureQuery {
  return !!message && typeof message === "object" && (message as { type?: unknown }).type === LIVE_WATCH_CAPTURE_QUERY;
}

export function isCaptureAnswer(message: unknown): message is CaptureAnswer {
  if (!message || typeof message !== "object") return false;
  const answer = message as { capture?: unknown; tabId?: unknown };
  return typeof answer.capture === "boolean" && (answer.tabId === null || typeof answer.tabId === "number");
}
