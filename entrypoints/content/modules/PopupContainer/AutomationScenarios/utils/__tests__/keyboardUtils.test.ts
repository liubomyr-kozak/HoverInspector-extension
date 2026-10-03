import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  describeKeyCombo,
  formatKeyCombo,
  moveFocus,
  parseKeyCombo,
  pressKey,
  shouldRecordKeyPress,
  submitFormWithEnter,
} from "../keyboardUtils";

const keydown = (key: string, init: KeyboardEventInit = {}) => new KeyboardEvent("keydown", { key, ...init });
const el = (id: string) => document.getElementById(id)!;

describe("key names", () => {
  it("formats keys with their modifiers", () => {
    expect(formatKeyCombo(keydown("Enter"))).toBe("Enter");
    expect(formatKeyCombo(keydown(" "))).toBe("Space");
    expect(formatKeyCombo(keydown("Tab", { shiftKey: true }))).toBe("Shift+Tab");
    expect(formatKeyCombo(keydown("ArrowDown", { ctrlKey: true, altKey: true }))).toBe("Ctrl+Alt+ArrowDown");
  });

  it("parses what formatKeyCombo writes and common aliases", () => {
    expect(parseKeyCombo("Space")).toMatchObject({ key: " ", code: "Space", keyCode: 32 });
    expect(parseKeyCombo("Shift+Tab")).toMatchObject({ key: "Tab", shiftKey: true, keyCode: 9 });
    expect(parseKeyCombo("esc")).toMatchObject({ key: "Escape", keyCode: 27 });
    expect(parseKeyCombo("ctrl+a")).toMatchObject({ key: "a", code: "KeyA", ctrlKey: true, keyCode: 65 });
    expect(parseKeyCombo("Ctrl++")).toMatchObject({ key: "+", ctrlKey: true });
    expect(parseKeyCombo("")).toBeNull();
    expect(parseKeyCombo("Hyper+Enter")).toBeNull();
    expect(describeKeyCombo("down")).toBe("ArrowDown");
  });
});

describe("shouldRecordKeyPress", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="text"><textarea id="area"></textarea><input type="checkbox" id="cb">
      <select id="sel"><option>a</option></select><button id="btn">B</button><a id="link" href="#x">L</a>
      <div id="lb" role="listbox" tabindex="0"></div>`;
  });

  it("records keys on custom widgets and the page", () => {
    for (const key of ["Enter", "Escape", "Tab", " ", "ArrowDown", "Home"]) {
      expect(shouldRecordKeyPress(keydown(key), el("lb"))).toBe(true);
    }
    expect(shouldRecordKeyPress(keydown("Escape"), document.body)).toBe(true);
  });

  it("skips keys whose effect is recorded by another step", () => {
    expect(shouldRecordKeyPress(keydown("a"), el("lb"))).toBe(false); // typing
    expect(shouldRecordKeyPress(keydown("ArrowDown"), el("sel"))).toBe(false); // select step
    expect(shouldRecordKeyPress(keydown(" "), el("cb"))).toBe(false); // recorded from the change
    expect(shouldRecordKeyPress(keydown("Enter"), el("btn"))).toBe(false); // recorded from the click
    expect(shouldRecordKeyPress(keydown(" "), el("link"))).toBe(false);
    expect(shouldRecordKeyPress(keydown("Tab"), el("btn"))).toBe(false);
    expect(shouldRecordKeyPress(keydown("ArrowLeft"), el("text"))).toBe(false); // caret move
    expect(shouldRecordKeyPress(keydown("Tab"), el("text"))).toBe(false);
    expect(shouldRecordKeyPress(keydown("Enter"), el("area"))).toBe(false); // line break
    expect(shouldRecordKeyPress(keydown("Enter", { isComposing: true }), el("text"))).toBe(false);
  });

  it("keeps Enter and Escape in a one-line field", () => {
    expect(shouldRecordKeyPress(keydown("Enter"), el("text"))).toBe(true);
    expect(shouldRecordKeyPress(keydown("Escape"), el("text"))).toBe(true);
    expect(shouldRecordKeyPress(keydown("Enter", { ctrlKey: true }), el("area"))).toBe(true);
  });
});

describe("submitFormWithEnter", () => {
  it("submits a form without a submit button that has a single field", () => {
    document.body.innerHTML = `<form id="f"><input id="q"></form>`;
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    el("f").addEventListener("submit", onSubmit);
    expect(submitFormWithEnter(el("q"))).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("presses the default button when there is one", () => {
    document.body.innerHTML = `<form id="f"><input id="q"><input id="r"><button id="go">Go</button></form>`;
    const onClick = vi.fn((e: Event) => e.preventDefault());
    el("go").addEventListener("click", onClick);
    expect(submitFormWithEnter(el("q"))).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not submit a form with several fields and no submit button", () => {
    document.body.innerHTML = `<form id="f"><input id="q"><input id="r"></form>`;
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    el("f").addEventListener("submit", onSubmit);
    expect(submitFormWithEnter(el("q"))).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("pressKey", () => {
  it("sends keydown and keyup with the legacy keyCode", () => {
    document.body.innerHTML = `<div id="lb" tabindex="0"></div>`;
    const seen: string[] = [];
    el("lb").addEventListener("keydown", (e) => seen.push(`down ${e.key} ${e.keyCode}`));
    el("lb").addEventListener("keyup", (e) => seen.push(`up ${e.key}`));
    pressKey(el("lb"), parseKeyCombo("ArrowDown")!);
    expect(seen).toEqual(["down ArrowDown 40", "up ArrowDown"]);
  });

  it("toggles a checkbox with Space unless the page cancels the key", () => {
    document.body.innerHTML = `<input type="checkbox" id="cb"><input type="checkbox" id="locked">`;
    pressKey(el("cb"), parseKeyCombo("Space")!);
    expect((el("cb") as HTMLInputElement).checked).toBe(true);
    el("locked").addEventListener("keydown", (e) => e.preventDefault());
    pressKey(el("locked"), parseKeyCombo("Space")!);
    expect((el("locked") as HTMLInputElement).checked).toBe(false);
  });

  it("steps through a select with the arrow keys", () => {
    document.body.innerHTML = `<select id="s"><option>a</option><option disabled>b</option><option>c</option></select>`;
    const onChange = vi.fn();
    el("s").addEventListener("change", onChange);
    pressKey(el("s"), parseKeyCombo("ArrowDown")!);
    expect((el("s") as HTMLSelectElement).value).toBe("c");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("moves the focus with Tab and Shift+Tab", () => {
    document.body.innerHTML = `<input id="a"><div id="lb" role="listbox"></div><button id="b">B</button><input id="c" tabindex="-1">`;
    el("a").focus();
    pressKey(el("a"), parseKeyCombo("Tab")!);
    expect(document.activeElement?.id).toBe("b");
    pressKey(el("b"), parseKeyCombo("Shift+Tab")!);
    expect(document.activeElement?.id).toBe("a");
    // From an element that can't have the focus, Tab continues from its place in the page
    expect(moveFocus(el("lb"), false)?.id).toBe("b");
  });
});
