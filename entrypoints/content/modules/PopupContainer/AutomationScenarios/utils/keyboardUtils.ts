/**
 * Keyboard helpers for the recorder and the player: which key presses become "key press" steps,
 * how a key is written in a step ("Enter", "Shift+Tab", "Space"...), and what the browser would do
 * for a key that a synthetic event can't trigger on its own (submitting a form, moving the focus...).
 */
import { isTextEntryElement } from "./recordingUtils";

// Keys that act on the page without typing text. Plain characters are recorded as input steps instead.
export const RECORDED_KEYS = [
  "Enter",
  "Escape",
  "Tab",
  " ",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Backspace",
  "Delete",
];

// Keys suggested in the step editor
export const KEY_PRESS_OPTIONS = [
  "Enter",
  "Escape",
  "Tab",
  "Shift+Tab",
  "Space",
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Backspace",
  "Delete",
];

const MODIFIERS = ["Ctrl", "Alt", "Shift", "Meta"] as const;

const KEY_CODES: Record<string, number> = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  " ": 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Delete: 46,
};

// Elements on which Enter or Space fire a click (the click or change is recorded, not the key)
const CLICK_ON_KEY_INPUT_TYPES = ["button", "submit", "reset", "image", "checkbox", "radio", "file", "color"];

export interface KeyCombo {
  key: string;
  code: string;
  keyCode: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * The value a key press step stores for a keyboard event, e.g. "Enter", "Shift+Tab", "Ctrl+ArrowDown", "Space"
 */
export function formatKeyCombo(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");
  parts.push(event.key === " " ? "Space" : event.key);
  return parts.join("+");
}

/**
 * Reads the key of a key press step (see formatKeyCombo). Names are matched case-insensitively ("enter", "esc").
 */
export function parseKeyCombo(value: string | undefined): KeyCombo | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  // "+" alone (or at the end, "Ctrl++") is the plus key itself
  const parts = raw === "+" ? ["+"] : raw.endsWith("++") ? [...raw.slice(0, -2).split("+"), "+"] : raw.split("+");
  const combo: KeyCombo = { key: "", code: "", keyCode: 0, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false };
  for (let i = 0; i < parts.length - 1; i++) {
    const name = parts[i].trim().toLowerCase();
    if (name === "ctrl" || name === "control") combo.ctrlKey = true;
    else if (name === "alt" || name === "option") combo.altKey = true;
    else if (name === "shift") combo.shiftKey = true;
    else if (name === "meta" || name === "cmd" || name === "command") combo.metaKey = true;
    else return null;
  }
  const key = normalizeKeyName(parts[parts.length - 1]);
  if (!key) return null;
  combo.key = key;
  combo.code = getKeyCode(key);
  combo.keyCode = KEY_CODES[key] ?? (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
  return combo;
}

function normalizeKeyName(name: string): string {
  const trimmed = name === " " ? " " : name.trim();
  if (!trimmed) return "";
  if (trimmed.length === 1) return trimmed;
  const lower = trimmed.toLowerCase();
  const aliases: Record<string, string> = {
    space: " ",
    spacebar: " ",
    esc: "Escape",
    return: "Enter",
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    del: "Delete",
  };
  if (aliases[lower]) return aliases[lower];
  const known = [...Object.keys(KEY_CODES), ...MODIFIERS].find((k) => k.toLowerCase() === lower);
  return known || trimmed;
}

function getKeyCode(key: string): string {
  if (key === " ") return "Space";
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;
  return key.length === 1 ? "" : key;
}

/**
 * A readable name for a key press step, e.g. "Space" or "Shift+Tab"
 */
export function describeKeyCombo(value: string | undefined): string {
  const combo = parseKeyCombo(value);
  if (!combo) return value || "";
  return formatKeyCombo(combo);
}

/**
 * Whether Enter / Space on this element make the browser fire a click (buttons, links, checkboxes...)
 */
export function isClickOnKeyElement(element: Element): boolean {
  const tag = element.tagName;
  if (tag === "BUTTON" || tag === "SUMMARY") return true;
  if (tag === "A" && element.hasAttribute("href")) return true;
  if (tag === "INPUT") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    return CLICK_ON_KEY_INPUT_TYPES.includes(type);
  }
  return false;
}

function isFormControl(element: Element): boolean {
  return ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(element.tagName) || isTextEntryElement(element);
}

/**
 * Whether a key press is recorded as its own step. Keys whose effect another step already captures are not:
 * typing (input steps), keys in a <select> (select step), Enter / Space on buttons, links and checkboxes
 * (the click or change they cause is recorded), and caret / focus moves inside form fields.
 * Enter in a text field is recorded only when it doesn't submit the form (the recorder checks that).
 */
export function shouldRecordKeyPress(event: KeyboardEvent, target: Element): boolean {
  if (event.isComposing || !RECORDED_KEYS.includes(event.key)) return false;
  if (target.closest("select")) return false;
  const key = event.key;
  if (isTextEntryElement(target)) {
    // Enter in a one-line field may run a search or submit; in a textarea / editor it is a line break,
    // but Ctrl/Cmd+Enter there is the usual "send" shortcut
    if (key === "Enter") return target.tagName === "INPUT" || event.ctrlKey || event.metaKey;
    return key === "Escape";
  }
  if (isClickOnKeyElement(target)) {
    // Enter / Space click it (the click is recorded); Tab away from a button or a link only moves the focus
    if (key === "Enter" || key === " " || key === "Tab") return false;
  }
  if (isFormControl(target)) {
    // Arrow keys on radios check another radio (recorded from its change), Tab only moves the focus
    return key === "Escape" || key === "Enter";
  }
  return true;
}

/**
 * The button that Enter in a field of this form presses: its first submit button, if any
 */
export function getDefaultButton(form: HTMLFormElement): HTMLElement | null {
  const candidates = Array.from(form.elements).filter(
    (element) =>
      (element instanceof HTMLButtonElement && element.type === "submit") ||
      (element instanceof HTMLInputElement && (element.type === "submit" || element.type === "image")),
  ) as HTMLElement[];
  return candidates[0] || null;
}

// Input types that block implicit submission when a form has no submit button and more than one of them
const IMPLICIT_SUBMISSION_BLOCKING_TYPES = [
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
  "number",
];

/**
 * Does what pressing Enter in a field does: presses the form's default button, or submits a form that has none
 * when it has a single text field (the HTML implicit submission rules). Returns whether the form was submitted.
 */
export function submitFormWithEnter(field: Element): boolean {
  const form = field instanceof HTMLFormElement ? field : ((field as HTMLInputElement).form ?? field.closest("form"));
  if (!form) return false;
  const button = getDefaultButton(form);
  if (button) {
    if ((button as HTMLButtonElement).disabled) return false;
    button.click();
    return true;
  }
  if (!(field instanceof HTMLFormElement)) {
    const blocking = Array.from(form.elements).filter(
      (element) =>
        element instanceof HTMLInputElement &&
        IMPLICIT_SUBMISSION_BLOCKING_TYPES.includes(element.type) &&
        !element.disabled,
    );
    if (blocking.length > 1) return false;
  }
  if (typeof form.requestSubmit === "function") {
    form.requestSubmit();
  } else if (form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))) {
    form.submit();
  }
  return true;
}

const TABBABLE_SELECTOR =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';

/**
 * The elements Tab visits, in order (positive tabindex first, then document order)
 */
export function getTabbableElements(root: Document = document): HTMLElement[] {
  const hasLayout = root.documentElement.getClientRects().length > 0;
  const elements = Array.from(root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter((element) => {
    if ((element as HTMLButtonElement).disabled) return false;
    if (element.tabIndex < 0) return false;
    if (element instanceof HTMLInputElement && element.type === "hidden") return false;
    if (element.closest("hover-inspector")) return false;
    const style = window.getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return false;
    // Inside a hidden ancestor the element has no boxes (only checked where there is a layout, not in jsdom)
    if (hasLayout && element.getClientRects().length === 0) return false;
    return true;
  });
  const positive = elements.filter((element) => element.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const natural = elements.filter((element) => element.tabIndex === 0);
  return [...positive, ...natural];
}

/**
 * Moves the focus like Tab / Shift+Tab from `from`. Returns the newly focused element.
 */
export function moveFocus(from: Element | null, backwards: boolean): HTMLElement | null {
  const tabbable = getTabbableElements();
  if (!tabbable.length) return null;
  const index = from ? tabbable.indexOf(from as HTMLElement) : -1;
  let next: HTMLElement | undefined;
  if (index !== -1) {
    next = tabbable[(index + (backwards ? -1 : 1) + tabbable.length) % tabbable.length];
  } else if (from && from !== document.body && from !== document.documentElement) {
    // Not tabbable itself (e.g. an item of a custom listbox): continue from its place in the document
    const after = (element: HTMLElement) => !!(from.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
    next = backwards
      ? [...tabbable].reverse().find((element) => !after(element) && !element.contains(from)) || tabbable[tabbable.length - 1]
      : tabbable.find(after) || tabbable[0];
  } else {
    next = backwards ? tabbable[tabbable.length - 1] : tabbable[0];
  }
  next?.focus();
  return next || null;
}

function isPageRoot(element: Element): boolean {
  return element === document.body || element === document.documentElement;
}

/**
 * Scrolls the page like the scrolling keys do when nothing focused handles them
 */
function scrollPageForKey(combo: KeyCombo): void {
  const page = window.innerHeight * 0.875;
  const line = 40;
  switch (combo.key) {
    case " ":
      window.scrollBy(0, combo.shiftKey ? -page : page);
      break;
    case "PageDown":
      window.scrollBy(0, page);
      break;
    case "PageUp":
      window.scrollBy(0, -page);
      break;
    case "ArrowDown":
      window.scrollBy(0, line);
      break;
    case "ArrowUp":
      window.scrollBy(0, -line);
      break;
    case "Home":
      window.scrollTo(window.scrollX, 0);
      break;
    case "End":
      window.scrollTo(window.scrollX, document.documentElement.scrollHeight);
      break;
  }
}

/**
 * Moves a one-line <select> to the previous / next enabled option, like the arrow keys do
 */
function stepSelect(select: HTMLSelectElement, direction: 1 | -1): void {
  if (select.multiple) return;
  const options = Array.from(select.options);
  let index = select.selectedIndex;
  do {
    index += direction;
  } while (index >= 0 && index < options.length && options[index].disabled);
  if (index < 0 || index >= options.length || index === select.selectedIndex) return;
  select.selectedIndex = index;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * What the browser does for a key that the page did not cancel. Synthetic key events have no default action,
 * so the player does it itself: Enter submits the form or activates the button, Space toggles / presses,
 * Tab moves the focus, arrows step through a <select>, scrolling keys scroll the page.
 */
export function performDefaultKeyAction(target: Element, combo: KeyCombo): void {
  if (combo.ctrlKey || combo.altKey || combo.metaKey) return;
  const isToggle =
    target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio");
  switch (combo.key) {
    case "Enter":
      if (target instanceof HTMLInputElement && (isTextEntryElement(target) || isToggle)) {
        submitFormWithEnter(target);
      } else if (isClickOnKeyElement(target)) {
        (target as HTMLElement).click();
      }
      return;
    case " ":
      if (isClickOnKeyElement(target) && target.tagName !== "A") {
        (target as HTMLElement).click();
      } else if (isPageRoot(target)) {
        scrollPageForKey(combo);
      }
      return;
    case "Tab":
      moveFocus(target, combo.shiftKey);
      return;
    case "ArrowDown":
    case "ArrowUp":
      if (target instanceof HTMLSelectElement) {
        stepSelect(target, combo.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (isPageRoot(target)) scrollPageForKey(combo);
      return;
    case "PageUp":
    case "PageDown":
    case "Home":
    case "End":
      if (isPageRoot(target)) scrollPageForKey(combo);
      return;
  }
}

/**
 * Presses a key on an element: keydown, keypress (for Enter and characters), the browser's default action
 * when the page didn't cancel the key, then keyup (on the element that has the focus by then, as Tab moves it)
 */
export function pressKey(target: Element, combo: KeyCombo): void {
  const base = {
    key: combo.key,
    code: combo.code,
    keyCode: combo.keyCode,
    which: combo.keyCode,
    ctrlKey: combo.ctrlKey,
    altKey: combo.altKey,
    shiftKey: combo.shiftKey,
    metaKey: combo.metaKey,
    bubbles: true,
    cancelable: true,
    composed: true,
  };
  let proceed = target.dispatchEvent(new KeyboardEvent("keydown", base));
  const printable = combo.key === "Enter" || combo.key.length === 1;
  if (proceed && printable && !combo.ctrlKey && !combo.metaKey) {
    const charCode = combo.key === "Enter" ? 13 : combo.key.charCodeAt(0);
    proceed = target.dispatchEvent(
      new KeyboardEvent("keypress", { ...base, keyCode: charCode, which: charCode, charCode }),
    );
  }
  if (proceed) performDefaultKeyAction(target, combo);
  const upTarget =
    combo.key === "Tab" && document.activeElement && document.activeElement !== target ? document.activeElement : target;
  upTarget.dispatchEvent(new KeyboardEvent("keyup", base));
}
