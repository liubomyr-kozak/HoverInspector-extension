import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderNoteMarkup, stripNoteMarkup } from "../noteMarkup";

const html = (text: string) => renderToStaticMarkup(<>{renderNoteMarkup(text)}</>);

describe("noteMarkup", () => {
  it("drops a blocked javascript: link without leaving a stray parenthesis", () => {
    expect(html("a [bad](javascript:alert(1)) b")).toBe("a bad b");
    expect(stripNoteMarkup("a [bad](javascript:alert(1)) b")).toBe("a bad b");
  });

  it("keeps parentheses inside allowed URLs", () => {
    expect(html("[wiki](https://en.wikipedia.org/wiki/Foo_(bar)).")).toContain(
      'href="https://en.wikipedia.org/wiki/Foo_(bar)"',
    );
    expect(html("[wiki](https://en.wikipedia.org/wiki/Foo_(bar)).")).toMatch(/<\/a>\.$/);
  });

  it("still renders a link followed by text in parentheses", () => {
    expect(html("[ok](https://example.com) (see)")).toMatch(/<\/a> \(see\)$/);
  });
});
