import { describe, expect, it } from "vitest";
import { diffElement } from "../elementChanges";

const box = { top: 0, left: 0, width: 220, height: 220 };

describe("diffElement", () => {
  it("lists only what changed when a class is added", () => {
    const changes = diffElement(
      { classes: ["selected"], attributes: { style: "top: 20px" }, styles: { margin: "10px" }, bounds: box },
      {
        classes: ["selected", "bg-red"],
        attributes: { style: "top: 20px" },
        styles: { margin: "10px", "background-color": "rgb(239, 68, 68)", color: "rgb(255, 255, 255)", "caret-color": "rgb(255, 255, 255)" },
        bounds: box,
      },
    );
    expect(changes.classesAdded).toEqual(["bg-red"]);
    expect(changes.classesRemoved).toEqual([]);
    // Equal style attributes are not a change
    expect(changes.attributes).toEqual([]);
    // caret-color follows color, so only the two real changes are listed
    expect(changes.styles).toEqual([
      { name: "background-color", before: undefined, after: "rgb(239, 68, 68)" },
      { name: "color", before: undefined, after: "rgb(255, 255, 255)" },
    ]);
    expect(changes.unchangedStyles).toEqual([["margin", "10px"]]);
    expect(changes.total).toBe(3);
  });

  it("reports size, attribute and removed classes", () => {
    const changes = diffElement(
      { id: "a", classes: ["x"], attributes: { role: "button" }, bounds: box },
      { id: "b", classes: [], attributes: { role: "link" }, bounds: { ...box, width: 240.4 } },
    );
    expect(changes.classesRemoved).toEqual(["x"]);
    expect(changes.attributes).toEqual([
      { name: "id", before: "a", after: "b" },
      { name: "role", before: "button", after: "link" },
    ]);
    expect(changes.box).toEqual([{ name: "width", before: "220px", after: "240px" }]);
  });

  it("treats a missing side as everything added or removed", () => {
    const changes = diffElement(null, { classes: ["new"], styles: { color: "red" } });
    expect(changes.classesAdded).toEqual(["new"]);
    expect(changes.styles).toEqual([{ name: "color", before: undefined, after: "red" }]);
  });

  it("finds no changes between equal elements", () => {
    const el = { classes: ["a"], styles: { color: "red" }, bounds: box };
    expect(diffElement(el, { ...el }).total).toBe(0);
  });
});
