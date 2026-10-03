import { describe, expect, it } from "vitest";
import { generateXPathVariants } from "../xpathGenerator";

const find = (xpath: string) =>
  document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

describe("optimized XPath", () => {
  it("never picks a selector shared with another element", () => {
    document.body.innerHTML = `<div class="selected"><div class="selected" style="top: 20px">Target</div></div>`;
    const target = document.querySelector(".selected .selected")!;
    expect(find(generateXPathVariants(target).optimized)).toBe(target);
  });

  it("uses every class, matched as whole class names", () => {
    document.body.innerHTML = `<div class="card"><div class="card active">A</div><div class="card-active">B</div></div>`;
    const target = document.querySelector(".card.active")!;
    const { optimized } = generateXPathVariants(target);
    expect(optimized).toContain("' active '");
    expect(find(optimized)).toBe(target);
  });

  it("prefers a unique id", () => {
    document.body.innerHTML = `<p id="intro" class="text">Hi</p>`;
    expect(generateXPathVariants(document.getElementById("intro")!).optimized).toBe("//p[@id='intro']");
  });
});
