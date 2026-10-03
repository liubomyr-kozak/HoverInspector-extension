export interface ElementData {
  styles?: Record<string, any>;
  classRules?: Record<string, Record<string, any>>;
  attributes?: Record<string, string>;
  classes?: string[];
}

export interface ElementDiffSingleColumnProps {
  left: ElementData;
  right: ElementData;
  // CSS selector of the element shown above its properties
  selector?: string;
}

export interface CSSPropertyChange {
  property: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  oldValue?: string;
  newValue?: string;
  currentValue: string;
}

export interface ShorthandPropertyChange {
  shorthand: string;
  individual: string[];
  isCollapsed: boolean;
  values: Record<string, string>;
  changeType: "added" | "removed" | "modified" | "unchanged";
}

export interface CSSCategory {
  name: string;
  label: string;
  properties: CSSPropertyChange[];
  shorthands: ShorthandPropertyChange[];
}

export interface AttributeChange {
  attribute: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  oldValue?: string;
  newValue?: string;
  currentValue: string;
}

export interface ClassChange {
  className: string;
  changeType: "added" | "removed";
}
