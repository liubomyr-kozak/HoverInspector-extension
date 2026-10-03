import { beforeEach, describe, expect, it } from "vitest";
import { StepType } from "../../types";
import { resolvePickedElement } from "../pickTarget";
import { describeXPath, summarizeStep } from "../../components/StepForm/stepSummary";
import { validateStep } from "../../components/StepForm/stepValidation";

describe("resolvePickedElement", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="buy"><span><svg><path></path></svg>Buy</span></button>
      <label id="city-label" for="city">City</label><input id="city" />
      <label id="size-label">Size <select id="size"><option>S</option><option>M</option></select></label>
      <div id="editor" contenteditable="true"><p id="para">Hello</p></div>
      <p id="note"><b id="bold">Price</b></p>`;
  });

  const byId = (id: string) => document.getElementById(id)!;

  it("uses the button around an inner icon for clicks and hovers", () => {
    expect(resolvePickedElement(document.querySelector("path")!, StepType.CLICK)).toBe(byId("buy"));
    expect(resolvePickedElement(document.querySelector("span")!, StepType.HOVER)).toBe(byId("buy"));
  });

  it("uses the field of a label, and the editor root, for typing steps", () => {
    expect(resolvePickedElement(byId("city-label"), StepType.INPUT)).toBe(byId("city"));
    expect(resolvePickedElement(byId("para"), StepType.VALUE)).toBe(byId("editor"));
  });

  it("uses the select inside or around the picked element for select steps", () => {
    expect(resolvePickedElement(byId("size-label"), StepType.SELECT)).toBe(byId("size"));
    expect(resolvePickedElement(document.querySelector("option")!, StepType.SELECT)).toBe(byId("size"));
  });

  it("keeps exactly what was picked for steps that read the element", () => {
    expect(resolvePickedElement(byId("bold"), StepType.GET_TEXT)).toBe(byId("bold"));
    expect(resolvePickedElement(byId("bold"), StepType.WAIT_ELEMENT_VISIBLE)).toBe(byId("bold"));
  });
});

describe("describeXPath", () => {
  it("reads the name of the element from the XPath", () => {
    expect(describeXPath('//button[normalize-space(.)="Save changes"]')).toBe('"Save changes"');
    expect(describeXPath('//*[@id="email"]')).toBe("#email");
    expect(describeXPath('//input[@name="city"]')).toBe("name: city");
    expect(describeXPath('//input[@placeholder="Search"]')).toBe('"Search"');
    expect(describeXPath('//*[@data-testid="submit-order"]')).toBe("submit-order");
    expect(describeXPath('(//div[contains(concat(" ", normalize-space(@class), " "), " card ")])[3]')).toBe(".card");
    expect(describeXPath("/html[1]/body[1]/div[14]")).toBe("div #14");
    expect(describeXPath("")).toBe("");
  });
});

describe("summarizeStep", () => {
  it("shows the element and the value of a typing step", () => {
    expect(summarizeStep({ type: StepType.INPUT, xpath: '//input[@name="q"]', value: "shoes" })).toEqual({
      label: "Type text",
      target: "name: q",
      value: "shoes",
    });
  });

  it("shows the address, the time or the message of other steps", () => {
    expect(summarizeStep({ type: StepType.NAVIGATE, value: "https://www.example.com/cart" }).target).toBe("example.com/cart");
    expect(summarizeStep({ type: StepType.WAIT, value: "1500" }).target).toBe("1500 ms");
    expect(summarizeStep({ type: StepType.GET_TEXT, xpath: '//*[@id="total"]', value: "total" }).value).toBe("${total}");
    expect(summarizeStep({ type: StepType.NOT_SET }).label).toBe("Choose a type");
  });
});

describe("validateStep", () => {
  it("keeps the get text key and the wait timeout optional", () => {
    expect(validateStep({ type: StepType.GET_TEXT, xpath: "//p", value: "" })).toEqual({});
    expect(validateStep({ type: StepType.WAIT_ELEMENT_VISIBLE, xpath: "//p", value: "" })).toEqual({});
  });

  it("asks for a whole number of milliseconds", () => {
    expect(validateStep({ type: StepType.WAIT, value: "abc" }).value).toBeDefined();
    expect(validateStep({ type: StepType.WAIT, value: "0" }).value).toBeDefined();
    expect(validateStep({ type: StepType.WAIT, value: "500" })).toEqual({});
    expect(validateStep({ type: StepType.WAIT_ELEMENT_VISIBLE, xpath: "//p", value: "soon" }).value).toBeDefined();
  });

  it("needs the element of element steps and a type", () => {
    expect(validateStep({ type: StepType.CLICK, xpath: " " }).xpath).toBeDefined();
    expect(validateStep({ type: StepType.NOT_SET }).type).toBeDefined();
    expect(validateStep({ type: StepType.KEY_PRESS, value: "Shift+Tab" })).toEqual({});
  });
});
