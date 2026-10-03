/**
 * Messages between the inspector in the top frame and the frame agents in cross-origin frames.
 *
 * Trust model:
 * - Everything with content (hovered element rects and styles, the inspector state) goes through the
 *   extension's own messaging (runtime -> background -> tabs.sendMessage). Pages can't send or read
 *   those messages, so a frame's contents never reach the scripts of the page around it, and a page
 *   can't switch an agent on or make it act.
 * - The only page-visible message is the registration an agent posts to its parent window: a random
 *   key, no content. The parent learns from `event.source` which <iframe> element the key belongs to,
 *   which is the one thing extension messaging can't tell it. A page that replays a key can at worst
 *   make overlays land on the wrong frame of its own; the first registration of a key wins.
 * - Every message is shape-checked and size-capped here before use; values are only ever shown as text.
 */
import { styleRulesList } from "@entrypoints/core/services/dom/nodeStyle";

/** The agent bundle (an unlisted script), injected with scripting.executeScript into every frame. */
export const FRAME_AGENT_FILE = "frame-agent.js";

/** Marks the page-visible registration message. */
export const FRAME_AGENT_NS = "hover-inspector:frame-agent:1";

// Runtime messages. All of them carry `type` and `timestamp`, the shape @webext-core/messaging expects
// in the top frame's content script (it ignores types without a handler).
/** Agent -> background -> the hub above it: a hover / select / scroll update inside the frame. */
export const FRAME_AGENT_EVENT = "HOVER_INSPECTOR_FRAME_AGENT_EVENT";
/** Agent -> background -> top frame: an agent (re)started and wants the current state. */
export const FRAME_AGENT_HELLO = "HOVER_INSPECTOR_FRAME_AGENT_HELLO";
/** Top frame -> background -> every frame: what agents should do (listen, block clicks, outline). */
export const FRAME_AGENT_STATE = "HOVER_INSPECTOR_FRAME_AGENT_STATE";
/** Top frame or agent -> background: a cross-origin frame without an agent showed up; inject agents. */
export const FRAME_AGENT_ENSURE = "HOVER_INSPECTOR_FRAME_AGENT_ENSURE";

export interface FrameAgentState {
  /** The inspector is open: report hover and clicks */
  listening: boolean;
  /** "Prevent default": swallow clicks so links and buttons don't act */
  preventDefault: boolean;
  /** "Show all borders": outline every element */
  showAllBorders: boolean;
}

export const IDLE_FRAME_AGENT_STATE: FrameAgentState = { listening: false, preventDefault: false, showAllBorders: false };

export interface SnapshotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** One element inside a cross-origin frame, as its agent saw it. Rects are in the frame's viewport. */
export interface RemoteNodeSnapshot {
  /** Stable for the element while the frame's document lives */
  id: string;
  rect: SnapshotRect;
  /** The part of the frame's viewport where the element can be seen (inner frames cut it down) */
  clip: SnapshotRect;
  tag: string;
  elId: string;
  className: string;
  isSvg: boolean;
  hasText: boolean;
  /** Computed values of the properties in COMPUTED_PROPS */
  computed: Record<string, string>;
  /** CSS px of the element -> px of the frame's viewport (CSS zoom, scaled inner frames) */
  zoom: number;
  rootFontSize: number;
  parentFontSize: number;
  alt: string | null;
  naturalWidth: number;
  naturalHeight: number;
  /** The frame's origin, shown in the tooltip */
  origin: string;
}

export type FrameAgentEventKind = "hover" | "select" | "update";

export interface FrameAgentEvent {
  type: typeof FRAME_AGENT_EVENT;
  timestamp: number;
  ns: typeof FRAME_AGENT_NS;
  /** The sending agent's key (see registration) */
  key: string;
  /** The frame's parent is the top frame: the background delivers to it alone instead of to all frames */
  toTop: boolean;
  kind: FrameAgentEventKind;
  hover?: RemoteNodeSnapshot;
  select?: RemoteNodeSnapshot;
  /** With "hover": where the pointer is, in the frame's viewport */
  pointer?: { x: number; y: number };
}

export interface FrameRegistration {
  ns: typeof FRAME_AGENT_NS;
  kind: "register";
  key: string;
}

export const COMPUTED_PROPS: readonly string[] = [...new Set([...styleRulesList, "display", "fill", "stroke"])];

const KEY_RE = /^[0-9a-f]{32}$/;
const MAX_VALUE = 600;
const MAX_ID = 160;

export function createFrameKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isFrameKey(value: unknown): value is string {
  return typeof value === "string" && KEY_RE.test(value);
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const finite = (value: unknown, fallback = 0, limit = 1e7): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(-limit, Math.min(limit, value)) : fallback;

const text = (value: unknown, max = MAX_VALUE): string => (typeof value === "string" ? value.slice(0, max) : "");

function sanitizeRect(value: unknown): SnapshotRect | null {
  if (!isObject(value)) return null;
  return {
    left: finite(value.left),
    top: finite(value.top),
    width: Math.max(0, finite(value.width)),
    height: Math.max(0, finite(value.height)),
  };
}

export function sanitizeSnapshot(value: unknown): RemoteNodeSnapshot | null {
  if (!isObject(value)) return null;
  const rect = sanitizeRect(value.rect);
  const clip = sanitizeRect(value.clip);
  const id = text(value.id, MAX_ID);
  const tag = text(value.tag, 64).toLowerCase();
  if (!rect || !clip || !id || !/^[a-z][a-z0-9:._-]*$/.test(tag)) return null;

  const computed: Record<string, string> = {};
  if (isObject(value.computed)) {
    for (const prop of COMPUTED_PROPS) {
      const v = value.computed[prop];
      if (typeof v === "string") computed[prop] = v.slice(0, MAX_VALUE);
    }
  }

  const zoom = finite(value.zoom, 1, 100);
  return {
    id,
    rect,
    clip,
    tag,
    elId: text(value.elId, 200),
    className: text(value.className, 400),
    isSvg: value.isSvg === true,
    hasText: value.hasText === true,
    computed,
    zoom: zoom > 0 ? zoom : 1,
    rootFontSize: finite(value.rootFontSize, 16, 1000) || 16,
    parentFontSize: finite(value.parentFontSize, 16, 1000) || 16,
    alt: typeof value.alt === "string" ? value.alt.slice(0, 300) : null,
    naturalWidth: Math.max(0, finite(value.naturalWidth)),
    naturalHeight: Math.max(0, finite(value.naturalHeight)),
    origin: text(value.origin, 200),
  };
}

export function sanitizeEvent(value: unknown): FrameAgentEvent | null {
  if (!isObject(value) || value.type !== FRAME_AGENT_EVENT || value.ns !== FRAME_AGENT_NS) return null;
  if (!isFrameKey(value.key)) return null;
  const kind = value.kind;
  if (kind !== "hover" && kind !== "select" && kind !== "update") return null;

  const event: FrameAgentEvent = {
    type: FRAME_AGENT_EVENT,
    timestamp: finite(value.timestamp),
    ns: FRAME_AGENT_NS,
    key: value.key,
    toTop: value.toTop === true,
    kind,
  };
  if (value.hover !== undefined) {
    const hover = sanitizeSnapshot(value.hover);
    if (!hover) return null;
    event.hover = hover;
  }
  if (value.select !== undefined) {
    const select = sanitizeSnapshot(value.select);
    if (!select) return null;
    event.select = select;
  }
  if (isObject(value.pointer)) event.pointer = { x: finite(value.pointer.x), y: finite(value.pointer.y) };
  if (kind === "hover" && !event.hover) return null;
  if (kind === "select" && !event.select) return null;
  return event;
}

export function sanitizeState(value: unknown): FrameAgentState | null {
  if (!isObject(value)) return null;
  return {
    listening: value.listening === true,
    preventDefault: value.preventDefault === true,
    showAllBorders: value.showAllBorders === true,
  };
}

export function isFrameRegistration(value: unknown): value is FrameRegistration {
  return isObject(value) && value.ns === FRAME_AGENT_NS && value.kind === "register" && isFrameKey(value.key);
}

/** The messages the background relays (anything else is not ours and is left alone). */
export function isFrameAgentRuntimeMessage(value: unknown): value is { type: string; [key: string]: unknown } {
  return (
    isObject(value) &&
    (value.type === FRAME_AGENT_EVENT ||
      value.type === FRAME_AGENT_HELLO ||
      value.type === FRAME_AGENT_STATE ||
      value.type === FRAME_AGENT_ENSURE)
  );
}
