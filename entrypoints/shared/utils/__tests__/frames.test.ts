import { afterEach, describe, expect, it } from "vitest";

import { getFrameClipRect, getFrameScale, getRectInTopViewport, intersectRects, mapRectThroughFrame } from "../frames";
import { clipOverlayTo } from "../../../core/utils";

/** jsdom has no layout: give an iframe a box (border 6, padding 10) and an optional 0.5 scale */
function makeFrame(scale = 1) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "border: 6px solid; padding: 10px;";
  document.body.appendChild(frame);
  const layoutWidth = 332; // 300 content + 2 * (10 + 6)
  const layoutHeight = 232;
  Object.defineProperty(frame, "offsetWidth", { value: layoutWidth });
  Object.defineProperty(frame, "offsetHeight", { value: layoutHeight });
  Object.defineProperty(frame, "clientWidth", { value: 320 });
  Object.defineProperty(frame, "clientHeight", { value: 220 });
  frame.getBoundingClientRect = () => new DOMRect(100, 50, layoutWidth * scale, layoutHeight * scale);
  return frame;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("frame geometry", () => {
  it("maps a rect through the frame's border, padding and scale", () => {
    const frame = makeFrame();
    expect(mapRectThroughFrame(frame, { left: 10, top: 20, width: 30, height: 40 })).toEqual({
      left: 100 + 16 + 10,
      top: 50 + 16 + 20,
      width: 30,
      height: 40,
    });

    const scaled = makeFrame(0.5);
    expect(mapRectThroughFrame(scaled, { left: 10, top: 20, width: 30, height: 40 })).toEqual({
      left: 100 + 8 + 5,
      top: 50 + 8 + 10,
      width: 15,
      height: 20,
    });
  });

  it("leaves elements of the top document alone", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const rect = new DOMRect(1, 2, 3, 4);
    el.getBoundingClientRect = () => rect;
    expect(getFrameClipRect(el)).toBeNull();
    expect(getFrameScale(el)).toBe(1);
    expect(getRectInTopViewport(el)).toBe(rect);
  });

  it("maps and clips elements inside a same-origin frame", () => {
    const frame = makeFrame(0.5);
    const doc = frame.contentDocument!;
    const el = doc.createElement("div");
    doc.body.appendChild(el);
    el.getBoundingClientRect = () => new DOMRect(280, 0, 100, 10);

    expect(getFrameScale(el)).toBe(0.5);
    const rect = getRectInTopViewport(el);
    expect([rect.left, rect.top, rect.width, rect.height]).toEqual([108 + 140, 58, 50, 5]);
    // The frame's content box: 300 x 200 at half scale
    expect(getFrameClipRect(el)).toEqual({ left: 108, top: 58, width: 150, height: 100 });
  });

  it("intersects rects", () => {
    expect(intersectRects({ left: 0, top: 0, width: 10, height: 10 }, { left: 5, top: 5, width: 10, height: 10 })).toEqual({
      left: 5,
      top: 5,
      width: 5,
      height: 5,
    });
    expect(intersectRects({ left: 0, top: 0, width: 1, height: 1 }, { left: 5, top: 5, width: 1, height: 1 }).width).toBe(0);
  });

  it("clips an overlay box with clip-path and removes it again", () => {
    const overlay = document.createElement("div");
    overlay.style.cssText = "left: 100px; top: 50px; width: 200px; height: 100px;";
    clipOverlayTo(overlay, { left: 120, top: 40, width: 150, height: 300 });
    expect(overlay.style.clipPath).toBe("inset(0px 30px 0px 20px)");
    clipOverlayTo(overlay, null);
    expect(overlay.style.clipPath).toBe("");
  });
});
