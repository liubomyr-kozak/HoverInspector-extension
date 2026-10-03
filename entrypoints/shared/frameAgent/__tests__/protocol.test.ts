import { describe, expect, it } from "vitest";

import {
  createFrameKey,
  FRAME_AGENT_EVENT,
  FRAME_AGENT_NS,
  isFrameAgentRuntimeMessage,
  isFrameRegistration,
  sanitizeEvent,
  sanitizeSnapshot,
  sanitizeState,
} from "../protocol";

const snapshot = (over: Record<string, unknown> = {}) => ({
  id: "3",
  rect: { left: 10, top: 20, width: 100, height: 50 },
  clip: { left: 0, top: 0, width: 300, height: 200 },
  tag: "div",
  elId: "m",
  className: "box main",
  isSvg: false,
  hasText: true,
  computed: { "padding-top": "20px", color: "rgb(0, 0, 0)" },
  zoom: 1,
  rootFontSize: 16,
  parentFontSize: 16,
  alt: null,
  naturalWidth: 0,
  naturalHeight: 0,
  origin: "http://127.0.0.1:8802",
  ...over,
});

const event = (over: Record<string, unknown> = {}) => ({
  type: FRAME_AGENT_EVENT,
  timestamp: 1,
  ns: FRAME_AGENT_NS,
  key: createFrameKey(),
  toTop: true,
  kind: "hover",
  hover: snapshot(),
  ...over,
});

describe("frame agent protocol", () => {
  it("creates 128-bit hex keys", () => {
    const key = createFrameKey();
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(createFrameKey()).not.toBe(key);
  });

  it("accepts a well-formed hover event", () => {
    const result = sanitizeEvent(event({ pointer: { x: 5, y: 6 } }));
    expect(result?.hover?.rect).toEqual({ left: 10, top: 20, width: 100, height: 50 });
    expect(result?.pointer).toEqual({ x: 5, y: 6 });
  });

  it("rejects events without the namespace, a valid key or the snapshot their kind needs", () => {
    expect(sanitizeEvent(event({ ns: "other" }))).toBeNull();
    expect(sanitizeEvent(event({ key: "short" }))).toBeNull();
    expect(sanitizeEvent(event({ kind: "eval" }))).toBeNull();
    expect(sanitizeEvent(event({ hover: undefined }))).toBeNull();
    expect(sanitizeEvent(event({ kind: "select" }))).toBeNull();
    expect(sanitizeEvent("string")).toBeNull();
  });

  it("drops unknown style properties and caps sizes", () => {
    const result = sanitizeSnapshot(
      snapshot({
        computed: { color: "red", "--evil": "x", behavior: "url(x)", "padding-top": "1".repeat(5000) },
        className: "c".repeat(5000),
      }),
    );
    expect(Object.keys(result!.computed).sort()).toEqual(["color", "padding-top"]);
    expect(result!.computed["padding-top"].length).toBeLessThanOrEqual(600);
    expect(result!.className.length).toBeLessThanOrEqual(400);
  });

  it("clamps numbers and rejects odd tags", () => {
    const result = sanitizeSnapshot(
      snapshot({ rect: { left: Infinity, top: "1", width: -5, height: 1e12 }, zoom: -1 }),
    );
    expect(result!.rect).toEqual({ left: 0, top: 0, width: 0, height: 1e7 });
    expect(result!.zoom).toBe(1);
    expect(sanitizeSnapshot(snapshot({ tag: "<img onerror=x>" }))).toBeNull();
  });

  it("reads only booleans from the state", () => {
    expect(sanitizeState({ listening: "yes", preventDefault: true, showAllBorders: 1 })).toEqual({
      listening: false,
      preventDefault: true,
      showAllBorders: false,
    });
    expect(sanitizeState(null)).toBeNull();
  });

  it("recognizes registrations and relayed message types", () => {
    expect(isFrameRegistration({ ns: FRAME_AGENT_NS, kind: "register", key: createFrameKey() })).toBe(true);
    expect(isFrameRegistration({ ns: FRAME_AGENT_NS, kind: "register", key: "x" })).toBe(false);
    expect(isFrameAgentRuntimeMessage({ type: FRAME_AGENT_EVENT })).toBe(true);
    expect(isFrameAgentRuntimeMessage({ type: "HOVER_INSPECTOR_ACTIVATE" })).toBe(false);
  });
});
