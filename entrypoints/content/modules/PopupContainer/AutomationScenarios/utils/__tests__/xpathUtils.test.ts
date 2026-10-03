import { beforeEach, describe, expect, it } from "vitest";
import { generateXPaths, isLikelyDynamicValue, xpathLiteral } from "../xpathUtils";
import {
  getActionableTarget,
  getCheckboxTargetState,
  getEditableRoot,
  getSelectValue,
  getTypedValue,
  isTextEntryElement,
  parseSelectValues,
  recordClick,
  recordInput,
} from "../recordingUtils";
import automationReducer, { automationActions } from "../../../../../store/automation/automation.slice";
import { StepType } from "../../types";

const resolve = (xpath: string) => {
  const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  return Array.from({ length: result.snapshotLength }, (_, i) => result.snapshotItem(i));
};

describe("xpathLiteral", () => {
  it("quotes plain values and values containing one quote type", () => {
    expect(xpathLiteral("Save")).toBe('"Save"');
    expect(xpathLiteral('Say "hi"')).toBe(`'Say "hi"'`);
  });

  it("uses concat() for values containing both quote types", () => {
    document.body.innerHTML = `<button>It's "great"</button>`;
    const literal = xpathLiteral(`It's "great"`);
    expect(literal.startsWith("concat(")).toBe(true);
    expect(resolve(`//button[normalize-space(.)=${literal}]`)).toHaveLength(1);
  });
});

describe("isLikelyDynamicValue", () => {
  it("flags generated ids and hashed classes", () => {
    expect(isLikelyDynamicValue(":r1a:")).toBe(true);
    expect(isLikelyDynamicValue("ember1234")).toBe(true);
    expect(isLikelyDynamicValue("css-1x2y3z4")).toBe(true);
    expect(isLikelyDynamicValue("item-1696262400000")).toBe(true);
    expect(isLikelyDynamicValue("3f2b8c1e-1234-4abc-9def-0123456789ab")).toBe(true);
    expect(isLikelyDynamicValue("late-x3k9a")).toBe(true);
    expect(isLikelyDynamicValue("dropdown_menu_a8f3k2")).toBe(true);
  });

  it("keeps human readable values", () => {
    expect(isLikelyDynamicValue("login-button")).toBe(false);
    expect(isLikelyDynamicValue("email")).toBe(false);
    expect(isLikelyDynamicValue("btn-primary")).toBe(false);
    expect(isLikelyDynamicValue("step-2")).toBe(false);
    expect(isLikelyDynamicValue("user-profile1")).toBe(false);
  });
});

describe("generateXPaths", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("prefers test ids", () => {
    document.body.innerHTML = `<div><button data-testid="submit-order" class="btn">Buy</button></div>`;
    const button = document.querySelector("button")!;
    const { primaryXPath, alternativeXpaths } = generateXPaths(button);
    expect(primaryXPath).toBe('//*[@data-testid="submit-order"]');
    expect(alternativeXpaths).not.toContain(primaryXPath);
    expect(alternativeXpaths[alternativeXpaths.length - 1]).toMatch(/^\/html/);
  });

  it("skips dynamic ids and uses a stable attribute instead", () => {
    document.body.innerHTML = `<form><input id=":r3:" name="email" /><input id=":r4:" name="password" /></form>`;
    const input = document.querySelector('input[name="password"]')!;
    const { primaryXPath } = generateXPaths(input);
    expect(primaryXPath).toBe('//input[@name="password"]');
  });

  it("uses visible text for buttons and returns a unique locator", () => {
    document.body.innerHTML = `<div><button class="x">Cancel</button><button class="x">Save changes</button></div>`;
    const save = document.querySelectorAll("button")[1];
    const { primaryXPath } = generateXPaths(save);
    expect(resolve(primaryXPath)).toEqual([save]);
    expect(primaryXPath).toContain("Save changes");
  });

  it("always returns a primary XPath that resolves to the element", () => {
    document.body.innerHTML = `<ul><li><span>Item</span></li><li><span>Item</span></li><li><span>Item</span></li></ul>`;
    const third = document.querySelectorAll("span")[2];
    const { primaryXPath, alternativeXpaths } = generateXPaths(third);
    expect(resolve(primaryXPath)).toEqual([third]);
    for (const xpath of alternativeXpaths) {
      expect(resolve(xpath)).toContain(third);
    }
  });

  it("scopes non-unique candidates to a stable ancestor", () => {
    document.body.innerHTML = `
      <section id="billing"><input placeholder="City" /></section>
      <section id="shipping"><input placeholder="City" /></section>`;
    const shippingCity = document.querySelector("#shipping input")!;
    const { primaryXPath } = generateXPaths(shippingCity);
    expect(resolve(primaryXPath)).toEqual([shippingCity]);
    expect(primaryXPath).toContain("shipping");
  });

  it("produces valid XPaths for values with quotes", () => {
    document.body.innerHTML = `<button aria-label='Say "hello"'>x</button>`;
    const button = document.querySelector("button")!;
    const { primaryXPath } = generateXPaths(button);
    expect(resolve(primaryXPath)).toEqual([button]);
  });
});

describe("recording helpers", () => {
  it("records clicks on the actionable ancestor instead of inner icons", () => {
    document.body.innerHTML = `<button data-testid="like"><svg><path d="M0"></path></svg><span>Like</span></button>`;
    const path = document.querySelector("path")!;
    expect(getActionableTarget(path)).toBe(document.querySelector("button"));
    expect(recordClick(document.querySelector("span")!)?.xpath).toBe('//*[@data-testid="like"]');
  });

  it("only records typing for text-like fields", () => {
    document.body.innerHTML = `<input type="checkbox" name="agree" /><input type="email" name="email" /><textarea name="note"></textarea>`;
    const [checkbox, email] = Array.from(document.querySelectorAll("input"));
    expect(isTextEntryElement(checkbox)).toBe(false);
    expect(isTextEntryElement(email)).toBe(true);
    expect(isTextEntryElement(document.querySelector("textarea"))).toBe(true);
    expect(recordInput(checkbox, "on")).toBeNull();
    expect(recordInput(email, "a@b.c")).toMatchObject({ type: StepType.INPUT, value: "a@b.c" });
  });

  it("records typing into contenteditable editors on their outermost editable element", () => {
    document.body.innerHTML = `<div id="ed" contenteditable="true"><p>Hello <b>world</b></p></div><div contenteditable="false">x</div>`;
    const editor = document.getElementById("ed")!;
    const bold = document.querySelector("b")!;
    expect(getEditableRoot(bold)).toBe(editor);
    expect(isTextEntryElement(editor)).toBe(true);
    expect(isTextEntryElement(bold)).toBe(false);
    expect(isTextEntryElement(document.querySelector('[contenteditable="false"]'))).toBe(false);
    expect(getTypedValue(bold)).toBe("Hello world");
    expect(recordInput(bold, "Hello world")).toMatchObject({ type: StepType.INPUT, xpath: '//*[@id="ed"]' });
    // the typed text is no locator: it isn't there yet on playback
    expect(generateXPaths(editor).alternativeXpaths.some((xpath) => xpath.includes("Hello"))).toBe(false);
  });

  it("records every chosen option of a multiple select", () => {
    document.body.innerHTML = `<select multiple><option value="x" selected>X</option><option value="y">Y</option><option value="z" selected>Z</option></select><select><option value="a">A</option><option value="b" selected>B</option></select>`;
    const [multi, single] = Array.from(document.querySelectorAll("select"));
    expect(getSelectValue(multi)).toBe('["x","z"]');
    expect(getSelectValue(single)).toBe("b");
    expect(parseSelectValues('["x","z"]', true)).toEqual(["x", "z"]);
    expect(parseSelectValues("x", true)).toEqual(["x"]);
    expect(parseSelectValues('["x"]', false)).toEqual(['["x"]']);
    expect(parseSelectValues("[not json", true)).toEqual(["[not json"]);
  });

  it("remembers the state a checkbox click leads to", () => {
    document.body.innerHTML = `<label for="cb">Agree</label><input type="checkbox" id="cb" /><input type="radio" id="r" /><button>Go</button>`;
    const box = document.getElementById("cb") as HTMLInputElement;
    expect(getCheckboxTargetState(box)).toBe("checked");
    expect(getCheckboxTargetState(document.querySelector("label")!)).toBe("checked");
    box.checked = true;
    expect(getCheckboxTargetState(box)).toBe("unchecked");
    expect(recordClick(box)).toMatchObject({ type: StepType.CLICK, value: "unchecked" });
    expect(getCheckboxTargetState(document.getElementById("r")!)).toBeNull();
    expect(recordClick(document.querySelector("button")!)?.value).toBeUndefined();
  });
});

describe("automation slice: upsertLastStep", () => {
  it("replaces the last step on the same element and appends otherwise", () => {
    let state = automationReducer(undefined, { type: "init" });
    state = automationReducer(state, automationActions.upsertLastStep({ type: StepType.SELECT, xpath: "//s", value: '["x"]' }));
    state = automationReducer(state, automationActions.upsertLastStep({ type: StepType.SELECT, xpath: "//s", value: '["x","z"]' }));
    state = automationReducer(state, automationActions.upsertLastStep({ type: StepType.CLICK, xpath: "//s" }));
    expect(state.currentSteps).toEqual([
      { type: StepType.SELECT, xpath: "//s", value: '["x","z"]' },
      { type: StepType.CLICK, xpath: "//s" },
    ]);
  });
});

describe("automation slice: upsertInputStep", () => {
  it("merges consecutive typing into the same field", () => {
    let state = automationReducer(undefined, { type: "init" });
    state = automationReducer(
      state,
      automationActions.upsertInputStep({ type: StepType.INPUT, xpath: "//a", value: "h" }),
    );
    state = automationReducer(
      state,
      automationActions.upsertInputStep({ type: StepType.INPUT, xpath: "//a", value: "hello" }),
    );
    state = automationReducer(
      state,
      automationActions.upsertInputStep({ type: StepType.INPUT, xpath: "//b", value: "x" }),
    );
    expect(state.currentSteps).toEqual([
      { type: StepType.INPUT, xpath: "//a", value: "hello" },
      { type: StepType.INPUT, xpath: "//b", value: "x" },
    ]);
  });
});
