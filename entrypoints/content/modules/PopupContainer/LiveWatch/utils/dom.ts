/**
 * DOM helpers for live watching. Kept small and synchronous: they run inside page event listeners.
 */

const LABEL_MAX_LENGTH = 40;

/** Whether the event happened in the extension's own UI (the shadow host is the target seen from the page) */
export function isExtensionTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest("hover-inspector");
}

const ACTIONABLE_SELECTOR =
  'a[href], button, input, label, summary, [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], ' +
  '[role="tab"], [role="radio"], [role="switch"], [role="option"], [onclick]';

/**
 * Whether a click on this element is an action worth learning (a button, a link, a tab...). Clicks on plain
 * text or empty space (selecting text, closing a popup) would only add noise to the patterns.
 */
export function isActionableElement(element: Element): boolean {
  if (element.matches(ACTIONABLE_SELECTOR)) return true;
  // Custom widgets built from <div>s usually show a pointer
  return window.getComputedStyle(element).cursor === "pointer";
}

/** The first element found by any of the locators, or null */
export function findElementByXPaths(xpath: string, alternativeXpaths: string[] = []): Element | null {
  for (const candidate of [xpath, ...alternativeXpaths]) {
    if (!candidate) continue;
    try {
      const node = document.evaluate(candidate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (node instanceof Element) return node;
    } catch {
      // A locator that is not valid on this page: try the next one
    }
  }
  return null;
}

const clean = (text: string | null | undefined) => (text || "").replace(/\s+/g, " ").trim().slice(0, LABEL_MAX_LENGTH);

/** A short human name for an element: its accessible name, visible text, placeholder or field name */
export function elementLabel(element: Element): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  const labelledText = labelledBy ? clean(document.getElementById(labelledBy.split(" ")[0])?.textContent) : "";
  const label =
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
      ? element.labels?.[0]
      : undefined;
  // A <label> that wraps its field also holds the field's text (the options of a <select>): use its own text
  const fieldLabel = label
    ? clean(
        Array.from(label.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent)
          .join(" "),
      ) || clean(label.textContent)
    : "";
  return (
    clean(element.getAttribute("aria-label")) ||
    labelledText ||
    fieldLabel ||
    clean(element.getAttribute("placeholder")) ||
    // textContent, not innerText: innerText forces a layout inside a click handler
    (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? "" : clean(element.textContent)) ||
    clean(element.getAttribute("title")) ||
    clean(element.getAttribute("name")) ||
    element.tagName.toLowerCase()
  );
}

/** Fields whose content must never be kept, even in memory: passwords, card data, one-time codes */
export function isSensitiveField(element: Element): boolean {
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.type === "password") return true;
  const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase();
  return autocomplete.startsWith("cc-") || autocomplete === "one-time-code" || autocomplete.includes("password");
}
