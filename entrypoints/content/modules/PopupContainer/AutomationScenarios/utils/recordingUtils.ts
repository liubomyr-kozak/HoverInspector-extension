/**
 * Utility functions for recording automation scenarios
 */
import { ScenarioStep, StepType } from "../types";
import { generateXPaths, validateAndImproveXPaths } from "./xpathUtils";

// Input types that are driven by clicks rather than typing
const NON_TEXT_INPUT_TYPES = ["checkbox", "radio", "button", "submit", "reset", "file", "image", "color", "range"];

// Selector for elements that represent a meaningful click target
const ACTIONABLE_SELECTOR =
  'a, button, input, textarea, select, option, label, summary, [role="button"], [role="link"], [role="checkbox"], ' +
  '[role="menuitem"], [role="tab"], [role="radio"], [role="switch"], [role="option"], [onclick], [contenteditable="true"]';

const EDITABLE_SELECTOR = '[contenteditable]:not([contenteditable="false"])';

/**
 * The outermost contenteditable element containing `element` (rich text editors), or null
 */
export function getEditableRoot(element: Element | null): HTMLElement | null {
  let root = (element?.closest?.(EDITABLE_SELECTOR) as HTMLElement | null) || null;
  while (root) {
    const outer = root.parentElement?.closest(EDITABLE_SELECTOR) as HTMLElement | null;
    if (!outer) break;
    root = outer;
  }
  return root;
}

/**
 * Returns true for elements the user types into (text inputs, textareas and contenteditable editors).
 */
export function isTextEntryElement(element: Element | null): boolean {
  if (!element) return false;
  if (element.tagName === "TEXTAREA") return true;
  if (getEditableRoot(element) === element) return true;
  if (element.tagName !== "INPUT") return false;
  const type = (element.getAttribute("type") || "text").toLowerCase();
  return !NON_TEXT_INPUT_TYPES.includes(type);
}

/**
 * Resolves the element that should be recorded for a click. Clicks usually land on an inner
 * <span>, <svg> or <path> of a button/link; recording that inner node produces fragile locators,
 * so we walk up to the closest actionable ancestor when there is one.
 */
export function getActionableTarget(element: Element | null): Element | null {
  if (!element) return null;
  const actionable = element.closest?.(ACTIONABLE_SELECTOR);
  if (actionable && actionable !== document.body) return actionable;
  // SVG internals are never useful targets
  const svgRoot = element.closest?.("svg");
  if (svgRoot && svgRoot.parentElement) return svgRoot.parentElement;
  return element;
}

/**
 * Creates a step object for a user action with XPath validation and auto-correction
 * 
 * @param type The type of action (click, input, select, hover)
 * @param element The DOM element for validation
 * @param xpath The primary XPath of the element
 * @param alternativeXpaths Array of alternative XPaths for the element
 * @param value Optional value for input and select actions
 * @returns A ScenarioStep object with validated XPath and auto-update flag
 */
function createStepObject(
  type: ScenarioStep["type"],
  element: Element,
  xpath: string, 
  alternativeXpaths: string[] = [],
  value?: string
): ScenarioStep {
  // Validate and improve XPaths for better uniqueness
  const validatedXPaths = validateAndImproveXPaths(element, xpath, alternativeXpaths);
  
  const step: ScenarioStep = {
    type,
    xpath: validatedXPaths.primaryXPath,
    alternativeXpaths: validatedXPaths.alternativeXpaths,
    xpathAutoUpdated: validatedXPaths.xpathAutoUpdated,
  };
  
  if (value !== undefined) {
    step.value = value;
  }
  
  return step;
}

/**
 * Creates a step object for a click action on an element
 *
 * @param element The element that was clicked
 * @returns A ScenarioStep object or null if the element is invalid
 */
export function recordClick(element: Element): ScenarioStep | null {
  element = getActionableTarget(element) as Element;
  if (!element) return null;

  const { primaryXPath, alternativeXpaths } = generateXPaths(element);
  // Clicks on checkboxes remember the state they lead to, so playback doesn't untick an already ticked box
  const checkboxState = getCheckboxTargetState(element) ?? undefined;
  return createStepObject(StepType.CLICK, element, primaryXPath, alternativeXpaths, checkboxState);
}

/**
 * Creates a step object for an input action (typing into a field)
 *
 * @param element The input element
 * @param value The value that was entered
 * @returns A ScenarioStep object or null if the element is invalid
 */
export function recordInput(element: Element, value: string): ScenarioStep | null {
  element = getEditableRoot(element) || element;
  if (!element || !isTextEntryElement(element)) return null;

  const { primaryXPath, alternativeXpaths } = generateXPaths(element);
  return createStepObject(StepType.INPUT, element, primaryXPath, alternativeXpaths, value);
}

/**
 * The text a field holds: its value, or the text of a contenteditable editor
 */
export function getTypedValue(element: Element): string {
  const editable = getEditableRoot(element);
  if (editable && !("value" in editable)) {
    // innerText keeps line breaks; jsdom has no layout and only knows textContent
    return (editable.innerText ?? editable.textContent ?? "").replace(/\n$/, "");
  }
  return (element as HTMLInputElement).value ?? "";
}

/**
 * The value recorded for a <select>: its value, or a JSON list of the chosen values for <select multiple>
 */
export function getSelectValue(select: HTMLSelectElement): string {
  if (!select.multiple) return select.value;
  return JSON.stringify(Array.from(select.options).filter((o) => o.selected).map((o) => o.value));
}

/**
 * Reads the values a select step chooses (see getSelectValue)
 */
export function parseSelectValues(value: string | undefined, multiple: boolean): string[] {
  const raw = value ?? "";
  if (multiple && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // not a list: use the value as it is
    }
  }
  return [raw];
}

/**
 * For a click that toggles a checkbox (directly or through its label): the state the click leads to.
 * Recorded on mousedown, so the box still has its previous state. Null for other elements.
 */
export function getCheckboxTargetState(element: Element): "checked" | "unchecked" | null {
  const box =
    element instanceof HTMLLabelElement ? element.control : element.tagName === "INPUT" ? (element as HTMLInputElement) : null;
  if (!(box instanceof HTMLInputElement) || box.type !== "checkbox") return null;
  return box.checked ? "unchecked" : "checked";
}

/**
 * Creates a step object for a select action (selecting an option from a dropdown)
 *
 * @param element The select element
 * @param value The value that was selected
 * @returns A ScenarioStep object or null if the element is invalid
 */
export function recordSelect(element: Element, value: string): ScenarioStep | null {
  if (!element) return null;

  const { primaryXPath, alternativeXpaths } = generateXPaths(element);
  return createStepObject(StepType.SELECT, element, primaryXPath, alternativeXpaths, value);
}

/**
 * Checks if an element is actionable (can be interacted with)
 * 
 * @param element The element to check
 * @returns True if the element is actionable, false otherwise
 */
function isActionableElement(element: Element): boolean {
  if (!element) return false;
  
  // Check element tag name for inherently actionable elements
  const tagName = element.tagName.toLowerCase();
  const actionableTags = ['a', 'button', 'input', 'textarea', 'select', 'option', 'label', 'details', 'summary'];
  
  if (actionableTags.includes(tagName)) {
    return true;
  }
  
  // Check for role attributes that indicate actionable elements
  const role = element.getAttribute('role');
  const actionableRoles = ['button', 'link', 'checkbox', 'menuitem', 'tab', 'radio', 'switch', 'textbox', 'combobox'];
  
  if (role && actionableRoles.includes(role)) {
    return true;
  }
  
  // Check for attributes that indicate interactivity
  if (
    element.hasAttribute('tabindex') || 
    element.hasAttribute('contenteditable') ||
    element.hasAttribute('onclick') ||
    element.hasAttribute('onmousedown') ||
    element.hasAttribute('onmouseup')
  ) {
    return true;
  }
  
  // Check computed style for cursor:pointer which often indicates clickable elements
  const computedStyle = window.getComputedStyle(element as Element);
  if (computedStyle.cursor === 'pointer') {
    return true;
  }
  
  return false;
}

/**
 * Creates a step object for a hover action on an element
 *
 * @param element The element that was hovered over
 * @returns A ScenarioStep object or null if the element is invalid or not actionable
 */
export function recordHover(element: Element): ScenarioStep | null {
  element = getActionableTarget(element) as Element;
  if (!element) return null;
  
  // Only record hover for actionable elements
  if (!isActionableElement(element)) {
    return null;
  }

  const { primaryXPath, alternativeXpaths } = generateXPaths(element);
  return createStepObject(StepType.HOVER, element, primaryXPath, alternativeXpaths);
}

/**
 * Creates a step object for a URL navigation action
 *
 * @param url The URL that was navigated to
 * @returns A ScenarioStep object for URL navigation
 */
export function recordUrlNavigation(url: string): ScenarioStep {
  return {
    type: StepType.NAVIGATE,
    value: url,
  };
}

/**
 * Builds a readable default title for a recorded scenario, e.g. "Checkout · shop.example.com · Oct 2, 21:15"
 */
export function generateScenarioTitle(date: Date = new Date()): string {
  const pageTitle = (document.title || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const host = window.location.hostname;
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return [pageTitle, host, `${day}, ${time}`].filter(Boolean).join(" · ");
}
