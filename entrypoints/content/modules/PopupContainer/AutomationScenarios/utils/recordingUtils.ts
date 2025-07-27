/**
 * Utility functions for recording automation scenarios
 */
import { ScenarioStep } from "../types";
import { generateXPath } from "./xpathUtils";

/**
 * Creates a step object for a user action
 * 
 * @param type The type of action (click, input, select, hover)
 * @param xpath The XPath of the element
 * @param value Optional value for input and select actions
 * @returns A ScenarioStep object
 */
function createStepObject(type: string, xpath: string, value?: string): ScenarioStep {
  const step: ScenarioStep = {
    type,
    xpath,
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
  if (!element) return null;

  const xpath = generateXPath(element);
  return createStepObject("click", xpath);
}

/**
 * Creates a step object for an input action (typing into a field)
 *
 * @param element The input element
 * @param value The value that was entered
 * @returns A ScenarioStep object or null if the element is invalid
 */
export function recordInput(element: Element, value: string): ScenarioStep | null {
  if (!element) return null;

  const xpath = generateXPath(element);
  return createStepObject("input", xpath, value);
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

  const xpath = generateXPath(element);
  return createStepObject("select", xpath, value);
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
  if (!element) return null;
  
  // Only record hover for actionable elements
  if (!isActionableElement(element)) {
    return null;
  }

  const xpath = generateXPath(element);
  return createStepObject("hover", xpath);
}
