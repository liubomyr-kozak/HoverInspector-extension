import { describe, expect, it } from "vitest";
import { EMPTY_SELECTION, moveFocus, pruneSelection, selectAll, selectedInOrder, selectRow } from "../selection";

const ids = ["a", "b", "c", "d", "e"];
const picked = (state: { selected: ReadonlySet<string> }) => [...state.selected].sort();

describe("selectRow", () => {
  it("selects one row on a plain click", () => {
    const state = selectRow(selectRow(EMPTY_SELECTION, ids, "b"), ids, "d");
    expect(picked(state)).toEqual(["d"]);
    expect(state.anchor).toBe("d");
  });

  it("selects the range from the anchor on Shift+click, in both directions", () => {
    const anchored = selectRow(EMPTY_SELECTION, ids, "b");
    expect(picked(selectRow(anchored, ids, "d", { range: true }))).toEqual(["b", "c", "d"]);
    expect(picked(selectRow(selectRow(EMPTY_SELECTION, ids, "d"), ids, "a", { range: true }))).toEqual(["a", "b", "c", "d"]);
  });

  it("keeps the anchor across Shift+clicks, so the range can shrink", () => {
    let state = selectRow(EMPTY_SELECTION, ids, "b");
    state = selectRow(state, ids, "e", { range: true });
    state = selectRow(state, ids, "c", { range: true });
    expect(picked(state)).toEqual(["b", "c"]);
  });

  it("adds and removes rows on Ctrl/Cmd+click", () => {
    let state = selectRow(EMPTY_SELECTION, ids, "a");
    state = selectRow(state, ids, "c", { toggle: true });
    state = selectRow(state, ids, "e", { toggle: true });
    expect(picked(state)).toEqual(["a", "c", "e"]);
    state = selectRow(state, ids, "c", { toggle: true });
    expect(picked(state)).toEqual(["a", "e"]);
  });

  it("adds a range to the selection on Ctrl+Shift+click", () => {
    let state = selectRow(EMPTY_SELECTION, ids, "a");
    state = selectRow(state, ids, "c", { toggle: true });
    state = selectRow(state, ids, "e", { range: true, toggle: true });
    expect(picked(state)).toEqual(["a", "c", "d", "e"]);
  });

  it("starts a Shift range at the clicked row when the anchor is gone", () => {
    const state = selectRow({ selected: new Set(), anchor: "gone", focus: null }, ids, "c", { range: true });
    expect(picked(state)).toEqual(["c"]);
  });
});

describe("keyboard and list changes", () => {
  it("moves with the arrows and extends with Shift+arrows", () => {
    let state = moveFocus(EMPTY_SELECTION, ids, 1, false);
    expect(picked(state)).toEqual(["a"]);
    state = moveFocus(state, ids, 1, true);
    state = moveFocus(state, ids, 1, true);
    expect(picked(state)).toEqual(["a", "b", "c"]);
    expect(moveFocus(state, ids, 100, false).focus).toBe("e");
  });

  it("selects every row", () => {
    expect(picked(selectAll(ids))).toEqual(ids);
  });

  it("forgets rows that were removed from the list and keeps the same object when nothing changed", () => {
    const state = selectRow(selectRow(EMPTY_SELECTION, ids, "a"), ids, "c", { toggle: true });
    expect(pruneSelection(state, ids)).toBe(state);
    const pruned = pruneSelection(state, ["b", "c"]);
    expect(picked(pruned)).toEqual(["c"]);
    expect(pruned.anchor).toBe("c");
  });

  it("returns the selected rows in list order, not click order", () => {
    let state = selectRow(EMPTY_SELECTION, ids, "d");
    state = selectRow(state, ids, "a", { toggle: true });
    expect(selectedInOrder(ids.map((id) => ({ id })), state).map((item) => item.id)).toEqual(["a", "d"]);
  });
});
