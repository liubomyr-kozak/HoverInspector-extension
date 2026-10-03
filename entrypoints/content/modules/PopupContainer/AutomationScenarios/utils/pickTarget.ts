import { StepType } from "../types";
import { getActionableTarget, getEditableRoot } from "./recordingUtils";

const FIELD_SELECTOR = "input, textarea, select";
const FOCUSABLE_SELECTOR = 'input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])';

// A <label> stands for its field
const labelledField = (element: Element): Element | null =>
  element instanceof HTMLLabelElement ? element.control : null;

/**
 * The element a step should use when the user picks `element` on the page. The click usually lands on an
 * inner <span>, <svg> or label: a click step wants the button around it, a typing step the field, a select
 * step the <select>. Steps that read the element (get text, wait) keep exactly what was picked.
 */
export function resolvePickedElement(element: Element, type: StepType): Element {
  switch (type) {
    case StepType.CLICK:
    case StepType.HOVER:
      return getActionableTarget(element) || element;
    case StepType.INPUT:
    case StepType.VALUE:
      return getEditableRoot(element) || labelledField(element) || element.closest(FIELD_SELECTOR) || element;
    case StepType.SELECT:
      return (
        element.closest("select") ||
        (labelledField(element) instanceof HTMLSelectElement ? labelledField(element)! : null) ||
        element.querySelector("select") ||
        element
      );
    case StepType.KEY_PRESS:
      return getEditableRoot(element) || labelledField(element) || element.closest(FOCUSABLE_SELECTOR) || element;
    default:
      return element;
  }
}
