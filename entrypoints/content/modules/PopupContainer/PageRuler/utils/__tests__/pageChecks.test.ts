import { afterEach, describe, expect, it } from "vitest";
import { findHorizontalOverflow, findSmallInputFonts, findSmallTargets, parseViewportMeta, runPageChecks } from "../pageChecks";
import { CheckStatus } from "../../types";

/** jsdom has no layout: give an element the box a browser would */
const setBox = (el: Element, left: number, top: number, width: number, height: number) => {
  el.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;
};

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("parseViewportMeta", () => {
  it("handles a missing tag", () => {
    expect(parseViewportMeta(null)).toMatchObject({ present: false, hasDeviceWidth: false, blocksZoom: false });
  });

  it("accepts the standard tag", () => {
    expect(parseViewportMeta("width=device-width, initial-scale=1")).toMatchObject({ hasDeviceWidth: true, blocksZoom: false });
  });

  it("flags blocked zoom", () => {
    expect(parseViewportMeta("width=device-width, user-scalable=no").blocksZoom).toBe(true);
    expect(parseViewportMeta("width=device-width; user-scalable=0").blocksZoom).toBe(true);
    expect(parseViewportMeta("width=device-width, maximum-scale=1").blocksZoom).toBe(true);
    expect(parseViewportMeta("width=device-width, maximum-scale=5").blocksZoom).toBe(false);
  });
});

describe("findHorizontalOverflow", () => {
  it("reports the outermost element past the right edge, not its children", () => {
    document.body.innerHTML = `<div id="ok"></div><div id="wide"><span id="child"></span></div>`;
    setBox(document.getElementById("ok")!, 0, 0, 300, 20);
    setBox(document.getElementById("wide")!, 0, 20, 500, 20);
    setBox(document.getElementById("child")!, 0, 20, 500, 20);
    expect(findHorizontalOverflow(document, 320).map((el) => el.id)).toEqual(["wide"]);
  });

  it("ignores content inside scroll containers and the extension's own UI", () => {
    document.body.innerHTML = `<div id="scroller" style="overflow-x: auto"><div id="table"></div></div><hover-inspector><div id="own"></div></hover-inspector>`;
    setBox(document.getElementById("scroller")!, 0, 0, 320, 20);
    setBox(document.getElementById("table")!, 0, 0, 900, 20);
    setBox(document.getElementById("own")!, 0, 0, 900, 20);
    expect(findHorizontalOverflow(document, 320)).toEqual([]);
  });
});

describe("findSmallTargets", () => {
  it("reports controls under 24px and skips links inside text", () => {
    document.body.innerHTML = `
      <button id="small">x</button>
      <button id="big">Save</button>
      <p>Read the <a id="inline" href="#" style="display: inline">terms</a> first.</p>
      <button id="hidden-btn" disabled>x</button>`;
    setBox(document.getElementById("small")!, 0, 0, 16, 16);
    setBox(document.getElementById("big")!, 0, 0, 80, 32);
    setBox(document.getElementById("inline")!, 0, 0, 30, 16);
    setBox(document.getElementById("hidden-btn")!, 0, 0, 16, 16);
    expect(findSmallTargets(document).map((el) => el.id)).toEqual(["small"]);
  });

  it("accepts a small checkbox with a big enough label", () => {
    document.body.innerHTML = `<input id="box" type="checkbox"><label id="lbl" for="box">Remember me</label>`;
    setBox(document.getElementById("box")!, 0, 0, 13, 13);
    setBox(document.getElementById("lbl")!, 0, 0, 120, 24);
    expect(findSmallTargets(document)).toEqual([]);
  });
});

describe("findSmallInputFonts", () => {
  it("reports text fields below 16px", () => {
    document.body.innerHTML = `<input id="small" style="font-size: 14px"><input id="ok" style="font-size: 16px"><input type="checkbox" style="font-size: 10px">`;
    ["small", "ok"].forEach((id) => setBox(document.getElementById(id)!, 0, 0, 200, 32));
    expect(findSmallInputFonts(document).map((el) => el.id)).toEqual(["small"]);
  });
});

describe("runPageChecks", () => {
  it("fails the zoom check when the viewport tag blocks zoom", () => {
    document.head.innerHTML = `<meta name="viewport" content="width=device-width, maximum-scale=1">`;
    const checks = runPageChecks(document);
    expect(checks.find((c) => c.id === "viewport-meta")?.status).toBe(CheckStatus.Pass);
    expect(checks.find((c) => c.id === "zoom")?.status).toBe(CheckStatus.Fail);
  });

  it("warns when the viewport tag is missing", () => {
    expect(runPageChecks(document).find((c) => c.id === "viewport-meta")?.status).toBe(CheckStatus.Warn);
  });
});
