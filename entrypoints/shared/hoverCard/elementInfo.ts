import { getEffectiveBackgroundColor } from "@entrypoints/shared/utils/colorAnalysis";

/**
 * Element facts the hover card needs beyond computed styles. Used in the top frame for local elements and
 * by the frame agent, which sends them along with a cross-origin element's snapshot.
 */

const MAX_LABEL = 200;

/** Explicit role and the accessible name given by aria-label or aria-labelledby */
export function readA11yAttributes(el: Element): { role: string | null; ariaLabel: string | null } {
  const role = el.getAttribute("role")?.trim() || null;
  let label = el.getAttribute("aria-label")?.trim() || "";
  if (!label) {
    const ids = el.getAttribute("aria-labelledby")?.trim().split(/\s+/) || [];
    label = ids
      .map((id) => el.ownerDocument?.getElementById(id)?.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ");
  }
  return { role: role ? role.slice(0, 60) : null, ariaLabel: label ? label.slice(0, MAX_LABEL) : null };
}

/** The background visible behind the element's text, or "" when it can't be worked out */
export function readEffectiveBackground(el: Element): string {
  try {
    return getEffectiveBackgroundColor(el);
  } catch {
    return "";
  }
}
