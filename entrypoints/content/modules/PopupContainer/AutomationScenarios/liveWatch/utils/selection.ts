/**
 * Selection of log rows, like a file list: a click selects one row, Shift+click selects the range from the
 * anchor, Ctrl/Cmd+click adds or removes one row. Rows are identified by id, so the selection survives new
 * rows arriving and old ones being forgotten.
 */
export interface ListSelection {
  selected: ReadonlySet<string>;
  /** Where a Shift range starts: the row clicked last without Shift */
  anchor: string | null;
  /** The row the keyboard is on */
  focus: string | null;
}

export const EMPTY_SELECTION: ListSelection = { selected: new Set(), anchor: null, focus: null };

export interface SelectModifiers {
  /** Shift: select the range from the anchor */
  range?: boolean;
  /** Ctrl or Cmd: add or remove one row */
  toggle?: boolean;
}

/** A click (or Space / arrow key) on a row */
export function selectRow(state: ListSelection, ids: readonly string[], id: string, { range, toggle }: SelectModifiers = {}): ListSelection {
  if (range) {
    const anchor = state.anchor && ids.includes(state.anchor) ? state.anchor : id;
    const from = ids.indexOf(anchor);
    const to = ids.indexOf(id);
    if (to < 0) return state;
    const span = ids.slice(Math.min(from, to), Math.max(from, to) + 1);
    // Ctrl+Shift adds the range to what is selected; Shift alone replaces it
    const selected = new Set(toggle ? [...state.selected, ...span] : span);
    return { selected, anchor, focus: id };
  }
  if (toggle) {
    const selected = new Set(state.selected);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    return { selected, anchor: id, focus: id };
  }
  return { selected: new Set([id]), anchor: id, focus: id };
}

export function selectAll(ids: readonly string[]): ListSelection {
  return { selected: new Set(ids), anchor: ids[0] ?? null, focus: ids[ids.length - 1] ?? null };
}

/** Moves the keyboard focus by `delta` rows; with Shift, extends the range from the anchor */
export function moveFocus(state: ListSelection, ids: readonly string[], delta: number, extend: boolean): ListSelection {
  if (!ids.length) return state;
  const current = state.focus ? ids.indexOf(state.focus) : -1;
  const next = ids[Math.max(0, Math.min(ids.length - 1, current < 0 ? (delta > 0 ? 0 : ids.length - 1) : current + delta))];
  return extend ? selectRow(state, ids, next, { range: true }) : selectRow(state, ids, next);
}

/** Drops rows that are no longer listed */
export function pruneSelection(state: ListSelection, ids: readonly string[]): ListSelection {
  const listed = new Set(ids);
  const selected = [...state.selected].filter((id) => listed.has(id));
  const keepAnchor = state.anchor !== null && listed.has(state.anchor);
  const keepFocus = state.focus !== null && listed.has(state.focus);
  if (selected.length === state.selected.size && keepAnchor === (state.anchor !== null) && keepFocus === (state.focus !== null)) {
    return state;
  }
  return { selected: new Set(selected), anchor: keepAnchor ? state.anchor : null, focus: keepFocus ? state.focus : null };
}

/** The selected rows in list order */
export function selectedInOrder<T extends { id: string }>(items: readonly T[], state: ListSelection): T[] {
  return items.filter((item) => state.selected.has(item.id));
}
