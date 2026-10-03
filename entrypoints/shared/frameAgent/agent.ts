import { browser } from "wxt/browser";

import { HOVER_INSPECTOR_DEACTIVATE } from "@entrypoints/shared/globalEvents";
import { setAllBordersVisible } from "@entrypoints/shared/utils/allBorders";
import {
  getFrameClipRect,
  getFrameContentBox,
  getFrameContentClip,
  getFrameScale,
  getRectInTopViewport,
  intersectRects,
  mapRectFromWindow,
  mapRectThroughFrame,
  PlainRect,
  watchSameOriginFrames,
} from "@entrypoints/shared/utils/frames";
import { createFrameHub } from "./hub";
import {
  COMPUTED_PROPS,
  createFrameKey,
  FRAME_AGENT_ENSURE,
  FRAME_AGENT_EVENT,
  FRAME_AGENT_HELLO,
  FRAME_AGENT_NS,
  FRAME_AGENT_STATE,
  FrameAgentEvent,
  FrameAgentEventKind,
  FrameAgentState,
  IDLE_FRAME_AGENT_STATE,
  RemoteNodeSnapshot,
  sanitizeState,
} from "./protocol";

/**
 * The frame agent: runs in cross-origin frames (injected into every frame of the tab while the
 * inspector is open; it exits at once in the top frame and in frames the frame above can reach). It
 * mounts no UI. While the top frame says the inspector is listening, it reports the element under the
 * pointer, clicks and scrolls, with the element's rect and computed styles in its own viewport; the
 * top frame draws everything. Same-origin frames inside this one are handled here the way the top frame
 * handles its own; cross-origin frames inside it get their own agent, whose reports this one maps into
 * its viewport and passes up.
 */
export function runFrameAgent() {
  if (window === window.top) return;

  // A parent of the same origin reaches this document directly (see watchSameOriginFrames)
  let parentReachable = false;
  try {
    parentReachable = !!window.frameElement;
  } catch {
    parentReachable = false;
  }
  if (parentReachable) return;

  const global = globalThis as any;
  if (global.__hoverInspectorFrameAgent) {
    // Injected again (a new frame appeared, or the extension was switched back on)
    global.__hoverInspectorFrameAgent.revive();
    return;
  }
  global.__hoverInspectorFrameAgent = createFrameAgent();
}

type Tracked =
  | { el: Element }
  | { frame: HTMLIFrameElement | HTMLFrameElement; key: string; snapshot: RemoteNodeSnapshot }
  | null;

function createFrameAgent() {
  const key = createFrameKey();
  const toTop = window.parent === window.top;
  let active = false;
  let state: FrameAgentState = IDLE_FRAME_AGENT_STATE;
  let stopListening: (() => void) | null = null;
  let stopBorders: (() => void) | null = null;
  let hovered: Tracked = null;
  let selected: Tracked = null;
  let lastTarget: EventTarget | null = null;
  /** Pointer position in this frame's viewport, sent along with hover reports */
  let pointer: { x: number; y: number } | undefined;
  let updateFrame = 0;
  let ensureTimer = 0;

  const ids = new WeakMap<Element, string>();
  let nextId = 1;
  const idOf = (el: Element) => {
    let id = ids.get(el);
    if (!id) {
      id = String(nextId++);
      ids.set(el, id);
    }
    return id;
  };

  const send = (message: Record<string, unknown>) => {
    // The extension was reloaded or removed: this copy is an orphan and must go quiet
    if (!browser.runtime?.id) {
      deactivate();
      return;
    }
    try {
      browser.runtime.sendMessage({ timestamp: Date.now(), ...message }).catch(() => {});
    } catch {
      deactivate();
    }
  };

  /** Tells the parent window which <iframe> this key belongs to (the key is all it carries) */
  const register = () => {
    const parentOrigin = window.location.ancestorOrigins?.[0];
    const targetOrigin = parentOrigin && parentOrigin !== "null" ? parentOrigin : "*";
    try {
      window.parent.postMessage({ ns: FRAME_AGENT_NS, kind: "register", key }, targetOrigin);
    } catch {
      // The parent went away
    }
  };

  const viewport = (): PlainRect => ({
    left: 0,
    top: 0,
    width: document.documentElement?.clientWidth || window.innerWidth,
    height: document.documentElement?.clientHeight || window.innerHeight,
  });

  const snapshotElement = (el: Element): RemoteNodeSnapshot => {
    const win = el.ownerDocument.defaultView || window;
    const computedStyle = win.getComputedStyle(el);
    const computed: Record<string, string> = {};
    for (const prop of COMPUTED_PROPS) computed[prop] = computedStyle.getPropertyValue(prop);

    const frameClip = getFrameClipRect(el);
    const fontSize = (target: Element | null) => (target ? parseFloat(win.getComputedStyle(target).fontSize) || 16 : 16);
    const cssZoom = (el as any).currentCSSZoom;
    const isImage = el.localName === "img";

    return {
      id: idOf(el),
      rect: plain(getRectInTopViewport(el)),
      clip: frameClip ? intersectRects(frameClip, viewport()) : viewport(),
      tag: el.localName,
      elId: el.id || "",
      className: typeof (el as HTMLElement).className === "string" ? (el as HTMLElement).className : "",
      isSvg: el.namespaceURI === "http://www.w3.org/2000/svg",
      hasText: Array.prototype.some.call(el.childNodes, (node: Node) => node.nodeType === Node.TEXT_NODE),
      computed,
      zoom: (typeof cssZoom === "number" && cssZoom > 0 ? cssZoom : 1) * getFrameScale(el),
      rootFontSize: fontSize(el.ownerDocument.documentElement),
      parentFontSize: fontSize(el.parentElement),
      alt: isImage ? el.getAttribute("alt") : null,
      naturalWidth: isImage ? (el as HTMLImageElement).naturalWidth || 0 : 0,
      naturalHeight: isImage ? (el as HTMLImageElement).naturalHeight || 0 : 0,
      origin: window.location.origin,
    };
  };

  /** A snapshot from an agent further down, mapped into this frame's viewport */
  const mapChildSnapshot = (
    frame: HTMLIFrameElement | HTMLFrameElement,
    childKey: string,
    snapshot: RemoteNodeSnapshot,
  ): RemoteNodeSnapshot => {
    const ownerWin = frame.ownerDocument.defaultView;
    const map = (rect: PlainRect) => mapRectFromWindow(ownerWin, mapRectThroughFrame(frame, rect));
    return {
      ...snapshot,
      id: `${childKey.slice(0, 8)}/${snapshot.id}`.slice(0, 160),
      rect: map(snapshot.rect),
      clip: intersectRects(intersectRects(map(snapshot.clip), getFrameContentClip(frame)), viewport()),
      zoom: snapshot.zoom * getFrameContentBox(frame).scaleX * getFrameScale(frame),
    };
  };

  const describe = (tracked: Tracked): RemoteNodeSnapshot | undefined => {
    if (!tracked) return undefined;
    if ("el" in tracked) return tracked.el.isConnected ? snapshotElement(tracked.el) : undefined;
    return tracked.frame.isConnected ? mapChildSnapshot(tracked.frame, tracked.key, tracked.snapshot) : undefined;
  };

  const report = (kind: FrameAgentEventKind) => {
    const hover = kind === "select" ? undefined : describe(hovered);
    const select = kind === "hover" ? undefined : describe(selected);
    if (kind === "hover" && !hover) return;
    if (kind === "select" && !select) return;
    if (kind === "update" && !hover && !select) return;
    send({
      type: FRAME_AGENT_EVENT,
      ns: FRAME_AGENT_NS,
      key,
      toTop,
      kind,
      hover,
      select,
      pointer: kind === "hover" ? pointer : undefined,
    });
  };

  const scheduleUpdate = () => {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(() => {
      updateFrame = 0;
      if (state.listening) report("update");
    });
  };

  const hub = createFrameHub((frame, event: FrameAgentEvent) => {
    if (!state.listening) return;
    if (event.pointer) {
      const mapped = mapRectFromWindow(
        frame.ownerDocument.defaultView,
        mapRectThroughFrame(frame, { left: event.pointer.x, top: event.pointer.y, width: 0, height: 0 }),
      );
      pointer = { x: mapped.left, y: mapped.top };
    }
    if (event.hover) hovered = { frame, key: event.key, snapshot: event.hover };
    if (event.select) selected = { frame, key: event.key, snapshot: event.select };
    report(event.kind);
  });

  const blockIfAsked = (event: Event) => {
    if (!state.preventDefault) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const onMouseMove = (event: MouseEvent) => {
    const target = event.target;
    const point = mapRectFromWindow(event.view, { left: event.clientX, top: event.clientY, width: 0, height: 0 });
    pointer = { x: point.left, y: point.top };
    // Not instanceof: elements of same-origin inner frames come from another realm
    if (target === lastTarget || !target || (target as Node).nodeType !== Node.ELEMENT_NODE) return;
    lastTarget = target;
    hovered = { el: target as Element };
    report("hover");
  };

  const onMouseDown = (event: MouseEvent) => {
    blockIfAsked(event);
    const target = event.target as Element | null;
    if (!target || target.nodeType !== Node.ELEMENT_NODE) return;
    selected = { el: target };
    hovered = { el: target };
    lastTarget = target;
    report("select");
  };

  const listen = (target: Window) => {
    const listeners: Array<[string, EventListener]> = [
      ["mousemove", onMouseMove as EventListener],
      ["mousedown", onMouseDown as EventListener],
      ["mouseup", blockIfAsked],
      ["click", blockIfAsked],
      ["scroll", scheduleUpdate],
    ];
    listeners.forEach(([type, listener]) => target.addEventListener(type, listener, { capture: true }));
    if (target !== window) target.addEventListener("message", hub.onWindowMessage);
    return () => {
      listeners.forEach(([type, listener]) => target.removeEventListener(type, listener, { capture: true }));
      if (target !== window) target.removeEventListener("message", hub.onWindowMessage);
    };
  };

  /** Cross-origin frames inside this one need their own agent */
  const requestAgents = () => {
    if (ensureTimer) return;
    ensureTimer = window.setTimeout(() => {
      ensureTimer = 0;
      if (state.listening) send({ type: FRAME_AGENT_ENSURE });
    }, 250);
  };

  const applyState = (next: FrameAgentState) => {
    state = next;

    if (next.listening && !stopListening) {
      const unlisten = listen(window);
      const stopFrames = watchSameOriginFrames(listen, requestAgents);
      window.addEventListener("resize", scheduleUpdate);
      stopListening = () => {
        unlisten();
        stopFrames();
        window.removeEventListener("resize", scheduleUpdate);
      };
    } else if (!next.listening && stopListening) {
      stopListening();
      stopListening = null;
      hovered = selected = null;
      lastTarget = null;
      if (updateFrame) cancelAnimationFrame(updateFrame);
      updateFrame = 0;
    }

    if (next.showAllBorders && !stopBorders) {
      setAllBordersVisible(document, true);
      const stopFrames = watchSameOriginFrames((win) => {
        setAllBordersVisible(win.document, true);
        return () => setAllBordersVisible(win.document, false);
      });
      stopBorders = () => {
        setAllBordersVisible(document, false);
        stopFrames();
      };
    } else if (!next.showAllBorders && stopBorders) {
      stopBorders();
      stopBorders = null;
    }
  };

  const onRuntimeMessage = (message: any, sender: { id?: string }) => {
    if (!message || typeof message !== "object" || sender?.id !== browser.runtime.id) return;

    if (message.type === HOVER_INSPECTOR_DEACTIVATE) {
      deactivate();
    } else if (message.type === FRAME_AGENT_STATE) {
      const next = sanitizeState(message.state);
      if (!next) return;
      applyState(next);
      // A hub above may have started after this agent did
      register();
    } else if (message.type === FRAME_AGENT_EVENT) {
      hub.handleRuntimeMessage(message);
    }
    // No response: the top frame's content script answers the messages that need one
  };

  function deactivate() {
    if (!active) return;
    active = false;
    applyState(IDLE_FRAME_AGENT_STATE);
    window.clearTimeout(ensureTimer);
    ensureTimer = 0;
    hub.clear();
    window.removeEventListener("message", hub.onWindowMessage);
    try {
      browser.runtime.onMessage.removeListener(onRuntimeMessage);
    } catch {
      // Orphaned: the API is gone already
    }
  }

  function revive() {
    if (!browser.runtime?.id) return;
    if (!active) {
      active = true;
      browser.runtime.onMessage.addListener(onRuntimeMessage);
      window.addEventListener("message", hub.onWindowMessage);
    }
    register();
    // The top frame answers with the current state
    send({ type: FRAME_AGENT_HELLO });
  }

  revive();
  return { revive };
}

const plain = (rect: PlainRect): PlainRect => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
