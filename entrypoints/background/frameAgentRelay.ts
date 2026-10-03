import { Ext } from "@entrypoints/features/extension/Ext";
import {
  FRAME_AGENT_ENSURE,
  FRAME_AGENT_EVENT,
  FRAME_AGENT_FILE,
  FRAME_AGENT_HELLO,
  FRAME_AGENT_STATE,
  isFrameAgentRuntimeMessage,
} from "@entrypoints/shared/frameAgent/protocol";

const ENSURE_INTERVAL = 400;
const lastEnsure = new Map<number, number>();
const pendingEnsure = new Map<number, ReturnType<typeof setTimeout>>();

async function injectFrameAgents(tabId: number) {
  lastEnsure.set(tabId, Date.now());
  try {
    // Frames the extension may not script are skipped; the agent exits at once in the top frame and in
    // frames whose parent reaches them directly, and only wakes up again in frames that already had it
    await browser.scripting.executeScript({ target: { tabId, allFrames: true }, files: [FRAME_AGENT_FILE] });
  } catch {
    // The tab closed or navigated meanwhile
  }
}

function ensureFrameAgents(tabId: number) {
  if (pendingEnsure.has(tabId)) return;
  const wait = Math.max(0, (lastEnsure.get(tabId) || 0) + ENSURE_INTERVAL - Date.now());
  pendingEnsure.set(
    tabId,
    setTimeout(async () => {
      pendingEnsure.delete(tabId);
      await Ext.session.ready;
      // Only while the extension is on in that tab: nothing is ever injected into frames otherwise
      if (Ext.session.isActive(tabId)) await injectFrameAgents(tabId);
    }, wait),
  );
}

/**
 * Relays the frame agent messages between the frames of a tab (content scripts can only message the
 * background). See shared/frameAgent/protocol.ts.
 */
export function registerFrameAgentRelay() {
  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    if (!isFrameAgentRuntimeMessage(message)) return;
    // From content scripts of this extension only
    const tabId = sender.tab?.id;
    if (sender.id !== browser.runtime.id || tabId == null || sender.frameId == null) return;

    const forward = (options?: { frameId: number }) => {
      const sent = options ? browser.tabs.sendMessage(tabId, message, options) : browser.tabs.sendMessage(tabId, message);
      // Frames without a listener (no agent) make the promise reject; nothing to do about it
      Promise.resolve(sent).catch(() => {});
    };

    switch (message.type) {
      case FRAME_AGENT_EVENT:
        // From an agent to the hub above it: the top frame, or (nested frames) whichever agent registered it
        if (sender.frameId === 0) return;
        forward(message.toTop === true ? { frameId: 0 } : undefined);
        break;
      case FRAME_AGENT_HELLO:
        if (sender.frameId === 0) return;
        forward({ frameId: 0 });
        break;
      case FRAME_AGENT_STATE:
        // Only the top frame's inspector decides what agents do
        if (sender.frameId !== 0) return;
        forward();
        break;
      case FRAME_AGENT_ENSURE:
        ensureFrameAgents(tabId);
        break;
    }
    // No response
    return undefined;
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    lastEnsure.delete(tabId);
    const pending = pendingEnsure.get(tabId);
    if (pending) clearTimeout(pending);
    pendingEnsure.delete(tabId);
  });
}
