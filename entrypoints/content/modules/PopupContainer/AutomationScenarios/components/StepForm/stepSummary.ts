import { ScenarioStep, StepType, stepTypeOptions } from "../../types";

// The attributes of a generated XPath that name the element, most readable first
const NAMING_ATTRIBUTES = ["aria-label", "placeholder", "title", "alt", "name", "data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "id", "href", "for", "value"];

const LITERAL = String.raw`("[^"]*"|'[^']*')`;

const unquote = (literal: string) => literal.slice(1, -1);

const shorten = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * A short, readable name for the element an XPath points to, read from the XPath itself (no DOM lookup, so it is
 * cheap enough for every step of a long list): `"Save"`, `#email`, `name: city`, `.card`, `div #14`.
 */
export function describeXPath(xpath: string | undefined): string {
  const value = (xpath || "").trim();
  if (!value) return "";

  const text = value.match(new RegExp(String.raw`normalize-space\(\.?\)\s*=\s*${LITERAL}`));
  if (text) return `"${shorten(unquote(text[1]), 32)}"`;

  for (const attr of NAMING_ATTRIBUTES) {
    const match = value.match(new RegExp(String.raw`@${attr}\s*=\s*${LITERAL}`));
    if (!match) continue;
    const attrValue = shorten(unquote(match[1]), 32);
    if (attr === "id") return `#${attrValue}`;
    if (attr.startsWith("data-")) return attrValue;
    return attr === "aria-label" || attr === "placeholder" || attr === "title" || attr === "alt"
      ? `"${attrValue}"`
      : `${attr}: ${attrValue}`;
  }

  // contains(concat(" ", normalize-space(@class), " "), " card ")
  const cls = value.match(/,\s*["'] ([^\s"']+) ["']\)/);
  if (cls) return `.${shorten(cls[1], 32)}`;

  // A positional path: its last element and position
  const last = value.match(/([a-z][\w-]*)(?:\[(\d+)\])?\)?(?:\[(\d+)\])?\s*$/i);
  if (last) {
    const position = last[3] || last[2];
    return position ? `${last[1]} #${position}` : last[1];
  }
  return shorten(value, 32);
}

export interface StepSummary {
  /** The type's label, e.g. "Click" */
  label: string;
  /** What the step acts on: the element, the address, the key... */
  target: string;
  /** The value the step uses, shown apart (a typed text, a stored value key...) */
  value: string;
}

const typeLabel = (type: StepType) =>
  stepTypeOptions.find((option) => option.value === type)?.label || stepTypeOptions[0].label;

const firstLine = (text: string | undefined) => (text || "").split("\n").find((line) => line.trim())?.trim() || "";

/** What a collapsed step card says about the step */
export function summarizeStep(step: ScenarioStep, functionTitle?: (id: string) => string | undefined): StepSummary {
  const type = step.type || StepType.NOT_SET;
  const element = describeXPath(step.xpath);
  const value = step.value || "";
  const summary = (target: string, shownValue = "") => ({ label: typeLabel(type), target, value: shownValue });

  switch (type) {
    case StepType.CLICK:
    case StepType.HOVER:
    case StepType.WAIT_ELEMENT_VISIBLE:
      return summary(element);
    case StepType.INPUT:
    case StepType.VALUE:
    case StepType.SELECT:
      return summary(element, shorten(value, 40));
    case StepType.KEY_PRESS:
      return summary(element, value);
    case StepType.GET_TEXT:
      return summary(element, value ? `\${${value}}` : "");
    case StepType.NAVIGATE:
    case StepType.REDIRECT:
      return summary(shorten(value.replace(/^https?:\/\/(www\.)?/, ""), 60));
    case StepType.WAIT:
      return summary(value ? `${value} ms` : "");
    case StepType.CODE:
      return summary(shorten(firstLine(value), 60));
    case StepType.FUNCTION:
      return summary(functionTitle?.(value) || value);
    case StepType.CONFIRMATION:
    case StepType.NOTIFICATION:
      return summary(shorten(firstLine(value), 60));
    default:
      return summary("");
  }
}
