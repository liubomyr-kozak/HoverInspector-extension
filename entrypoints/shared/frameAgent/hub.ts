import { findFrameElementForWindow } from "@entrypoints/shared/utils/frames";
import { FrameAgentEvent, isFrameRegistration, sanitizeEvent } from "./protocol";

type FrameElement = HTMLIFrameElement | HTMLFrameElement;

/**
 * The receiving end for frame agents one level down: the top frame's inspector, or an agent whose
 * frame holds further cross-origin frames. Agents register with the window they are embedded in (a
 * key, posted to their parent); their events arrive through extension messaging, carrying that key.
 */
export function createFrameHub(onEvent: (frame: FrameElement, event: FrameAgentEvent) => void) {
  const registrations = new Map<string, { source: Window; frame: FrameElement }>();

  /** `message` listener, for this window and the windows of its same-origin frames */
  const onWindowMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!isFrameRegistration(data)) return;
    const source = event.source as Window | null;
    if (!source || source === window) return;

    const known = registrations.get(data.key);
    // The first registration of a key wins; a replayed key from another window is ignored
    if (known && known.source !== source) return;

    const frame = findFrameElementForWindow(source);
    if (!frame) return;
    registrations.set(data.key, { source, frame });
  };

  const findFrame = (key: string): FrameElement | null => {
    const entry = registrations.get(key);
    if (!entry) return null;
    if (entry.frame.isConnected && entry.frame.contentWindow === entry.source) return entry.frame;
    // The iframe was moved or replaced in the DOM; its window may still be around elsewhere
    const frame = findFrameElementForWindow(entry.source);
    if (!frame) {
      registrations.delete(key);
      return null;
    }
    entry.frame = frame;
    return frame;
  };

  /** For runtime messages; ignores anything malformed or from a frame that didn't register here */
  const handleRuntimeMessage = (message: unknown): boolean => {
    const event = sanitizeEvent(message);
    if (!event) return false;
    const frame = findFrame(event.key);
    if (!frame) return false;
    onEvent(frame, event);
    return true;
  };

  /** Whether an agent in this frame has registered (its content can be inspected) */
  const hasAgent = (frame: Element): boolean => {
    for (const entry of registrations.values()) {
      if (entry.frame === frame && entry.frame.contentWindow === entry.source) return true;
    }
    return false;
  };

  return {
    onWindowMessage,
    handleRuntimeMessage,
    hasAgent,
    clear: () => registrations.clear(),
  };
}

export type FrameHub = ReturnType<typeof createFrameHub>;
