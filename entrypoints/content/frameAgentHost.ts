import { browser } from "wxt/browser";

import { createFrameHub } from "@entrypoints/shared/frameAgent/hub";
import {
  FRAME_AGENT_ENSURE,
  FRAME_AGENT_EVENT,
  FRAME_AGENT_HELLO,
  FRAME_AGENT_STATE,
  FrameAgentState,
  IDLE_FRAME_AGENT_STATE,
  RemoteNodeSnapshot,
} from "@entrypoints/shared/frameAgent/protocol";
import { isRemoteFrameNode, RemoteFrameNode } from "@entrypoints/shared/frameAgent/remoteNode";
import { getAccessibleFrameWindow, mapRectFromWindow, mapRectThroughFrame } from "@entrypoints/shared/utils/frames";

type FrameElement = HTMLIFrameElement | HTMLFrameElement;

interface FrameAgentHostHandlers {
  /** `pointer`: the pointer position in the top viewport, when known */
  onHover(node: RemoteFrameNode, pointer: { x: number; y: number } | null): void;
  onSelect(node: RemoteFrameNode): void;
  /** Snapshots of known nodes changed in place (the frame scrolled or resized) */
  onUpdate(): void;
}

/**
 * The top frame's side of cross-origin frame inspection, alive while the Element Inspector listens.
 * It costs nothing on pages without cross-origin frames: extension messaging only starts once
 * `noteCrossOriginFrame` reports one. Then it has agents injected into the tab's frames, tells them
 * the inspector state, and turns their reports into RemoteFrameNodes for the overlays.
 */
export function startFrameAgentHost(handlers: FrameAgentHostHandlers, settings: Omit<FrameAgentState, "listening">) {
  let state: FrameAgentState = { ...settings, listening: true };
  let started = false;
  let stopped = false;
  let broadcastTimer = 0;
  let ensureTimer = 0;
  const nodes = new Map<string, RemoteFrameNode>();

  const upsert = (frame: FrameElement, key: string, snapshot: RemoteNodeSnapshot) => {
    const id = `${key}:${snapshot.id}`;
    let node = nodes.get(id);
    if (node) {
      node.frame = frame;
      node.snapshot = snapshot;
      return node;
    }
    node = new RemoteFrameNode(frame, snapshot);
    if (nodes.size >= 200) nodes.delete(nodes.keys().next().value!);
    nodes.set(id, node);
    return node;
  };

  const hub = createFrameHub((frame, event) => {
    if (stopped) return;
    const hover = event.hover && upsert(frame, event.key, event.hover);
    const select = event.select && upsert(frame, event.key, event.select);
    if (event.kind === "hover" && hover) {
      let pointer: { x: number; y: number } | null = null;
      if (event.pointer) {
        const point = { left: event.pointer.x, top: event.pointer.y, width: 0, height: 0 };
        const mapped = mapRectFromWindow(frame.ownerDocument.defaultView, mapRectThroughFrame(frame, point));
        pointer = { x: mapped.left, y: mapped.top };
      }
      handlers.onHover(hover, pointer);
    }
    else if (event.kind === "select" && select) handlers.onSelect(select);
    else handlers.onUpdate();
  });

  const send = (message: Record<string, unknown>) => {
    try {
      if (!browser.runtime?.id) return;
      browser.runtime.sendMessage({ timestamp: Date.now(), ...message }).catch(() => {});
    } catch {
      // The extension context is gone (reloaded)
    }
  };

  const broadcastState = () => send({ type: FRAME_AGENT_STATE, state });

  const scheduleBroadcast = () => {
    if (broadcastTimer || stopped) return;
    broadcastTimer = window.setTimeout(() => {
      broadcastTimer = 0;
      if (!stopped) broadcastState();
    }, 50);
  };

  const scheduleEnsure = () => {
    if (ensureTimer || stopped) return;
    ensureTimer = window.setTimeout(() => {
      ensureTimer = 0;
      if (!stopped) send({ type: FRAME_AGENT_ENSURE });
    }, 150);
  };

  const onRuntimeMessage = (message: any, sender: { id?: string }) => {
    if (stopped || !message || typeof message !== "object" || sender?.id !== browser.runtime.id) return;
    if (message.type === FRAME_AGENT_EVENT) hub.handleRuntimeMessage(message);
    else if (message.type === FRAME_AGENT_HELLO) scheduleBroadcast();
  };

  const host = {
    /** For watchSameOriginFrames: a frame whose document we can't reach was found or (re)loaded */
    noteCrossOriginFrame(_frame: FrameElement) {
      if (stopped) return;
      if (!started) {
        started = true;
        browser.runtime.onMessage.addListener(onRuntimeMessage);
      }
      scheduleEnsure();
      scheduleBroadcast();
    },

    /** Registrations arrive as `message` events on the window the agent's iframe is in */
    listenWindow(target: Window) {
      target.addEventListener("message", hub.onWindowMessage);
      return () => target.removeEventListener("message", hub.onWindowMessage);
    },

    setSettings(next: Omit<FrameAgentState, "listening">) {
      state = { ...next, listening: true };
      if (started) scheduleBroadcast();
    },

    hasAgent: (frame: Element) => hub.hasAgent(frame),

    stop() {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(broadcastTimer);
      window.clearTimeout(ensureTimer);
      if (started) {
        state = IDLE_FRAME_AGENT_STATE;
        broadcastState();
        browser.runtime.onMessage.removeListener(onRuntimeMessage);
      }
      hub.clear();
      nodes.clear();
      if (currentHost === host) currentHost = null;
    },
  };

  currentHost = host;
  return host;
}

let currentHost: ReturnType<typeof startFrameAgentHost> | null = null;

/**
 * A note for the tooltip about frames: the element is inside a cross-origin frame, or it is a
 * cross-origin <iframe> whose content can (an agent runs in it) or can't be inspected.
 */
export function describeFrameContext(node: unknown): { text: string; limited: boolean } | null {
  if (isRemoteFrameNode(node)) {
    // Opaque origins (data: URLs, sandboxed frames) serialize as "null"
    const origin = node.origin && node.origin !== "null" ? ` · ${node.origin}` : "";
    return { text: `In a cross-origin frame${origin}`, limited: false };
  }
  const el = node as Element | null;
  if (!el || (el.localName !== "iframe" && el.localName !== "frame")) return null;
  if (getAccessibleFrameWindow(el as FrameElement)) return null;
  if (currentHost?.hasAgent(el)) {
    return { text: "Cross-origin frame · point inside it to inspect its content", limited: false };
  }
  return { text: "Cross-origin frame · limited info: its content can't be inspected", limited: true };
}
