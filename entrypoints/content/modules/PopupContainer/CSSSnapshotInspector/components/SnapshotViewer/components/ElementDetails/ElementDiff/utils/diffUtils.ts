import { AttributeChange, CSSCategory, CSSPropertyChange, ClassChange, ShorthandPropertyChange } from "../types.ts";

export const CSS_CATEGORIES: Record<string, string[]> = {
  boxModel: [
    "width",
    "height",
    "min-width",
    "max-width",
    "min-height",
    "max-height",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-style",
    "border-right-style",
    "border-bottom-style",
    "border-left-style",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
  ],
  typography: [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "font-variant",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "text-align",
    "text-decoration",
    "text-transform",
    "text-indent",
    "text-shadow",
    "color",
    "text-overflow",
    "white-space",
    "word-wrap",
    "word-break",
  ],
  background: [
    "background",
    "background-color",
    "background-image",
    "background-repeat",
    "background-position",
    "background-size",
    "background-attachment",
    "background-clip",
  ],
  layout: [
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "float",
    "clear",
    "z-index",
    "overflow",
    "overflow-x",
    "overflow-y",
    "visibility",
    "opacity",
  ],
  flexbox: [
    "flex",
    "flex-direction",
    "flex-wrap",
    "flex-flow",
    "justify-content",
    "align-items",
    "align-content",
    "align-self",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  boxModel: "Box Model",
  typography: "Typography",
  background: "Background",
  layout: "Layout",
  flexbox: "Flexbox",
};

export const SHORTHAND_PROPERTIES: Record<string, string[]> = {
  margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  border: ["border-width", "border-style", "border-color"],
  "border-width": ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"],
  "border-style": ["border-top-style", "border-right-style", "border-bottom-style", "border-left-style"],
  "border-color": ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
  "border-radius": [
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
  ],
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const compareProperties = (
  leftStyles: Record<string, any> = {},
  rightStyles: Record<string, any> = {},
): CSSPropertyChange[] => {
  const changes: CSSPropertyChange[] = [];
  const allProperties = new Set([...Object.keys(leftStyles), ...Object.keys(rightStyles)]);

  for (const property of allProperties) {
    const leftValue = leftStyles[property];
    const rightValue = rightStyles[property];
    const leftFormatted = formatValue(leftValue);
    const rightFormatted = formatValue(rightValue);

    if (leftValue === undefined) {
      changes.push({ property, changeType: "added", newValue: rightFormatted, currentValue: rightFormatted });
    } else if (rightValue === undefined) {
      changes.push({ property, changeType: "removed", oldValue: leftFormatted, currentValue: leftFormatted });
    } else if (leftFormatted !== rightFormatted) {
      changes.push({
        property,
        changeType: "modified",
        oldValue: leftFormatted,
        newValue: rightFormatted,
        currentValue: rightFormatted,
      });
    } else {
      changes.push({ property, changeType: "unchanged", currentValue: rightFormatted });
    }
  }

  return changes.sort((a, b) => a.property.localeCompare(b.property));
};

export const consolidateShorthands = (
  properties: CSSPropertyChange[],
): { consolidated: ShorthandPropertyChange[]; remaining: CSSPropertyChange[] } => {
  const consolidated: ShorthandPropertyChange[] = [];
  const used = new Set<string>();
  const remaining: CSSPropertyChange[] = [];

  Object.entries(SHORTHAND_PROPERTIES).forEach(([shorthand, individuals]) => {
    const individualProps = individuals
      .map((prop) => properties.find((p) => p.property === prop && !used.has(p.property)))
      .filter(Boolean) as CSSPropertyChange[];

    if (individualProps.length === individuals.length) {
      const values: Record<string, string> = {};
      let overallChangeType: "added" | "removed" | "modified" | "unchanged" = "unchanged";

      individuals.forEach((prop, index) => {
        const change = individualProps[index];
        values[prop] = change.currentValue;
        used.add(prop);
        if (change.changeType !== "unchanged") overallChangeType = change.changeType;
      });

      let shorthandValue = "";
      if (shorthand === "margin" || shorthand === "padding") {
        const [top, right, bottom, left] = individuals.map((prop) => values[prop]);
        if (top === right && right === bottom && bottom === left) shorthandValue = top;
        else if (top === bottom && right === left) shorthandValue = `${top} ${right}`;
        else if (right === left) shorthandValue = `${top} ${right} ${bottom}`;
        else shorthandValue = `${top} ${right} ${bottom} ${left}`;
      } else if (shorthand === "border-style" || shorthand === "border-width" || shorthand === "border-color") {
        const [top, right, bottom, left] = individuals.map((prop) => values[prop]);
        if (top === right && right === bottom && bottom === left) shorthandValue = top;
        else if (top === bottom && right === left) shorthandValue = `${top} ${right}`;
        else if (right === left) shorthandValue = `${top} ${right} ${bottom}`;
        else shorthandValue = `${top} ${right} ${bottom} ${left}`;
      } else {
        shorthandValue = individuals.map((prop) => values[prop]).join(" ");
      }

      consolidated.push({
        shorthand,
        individual: individuals,
        isCollapsed: true,
        values,
        changeType: overallChangeType,
      });
    }
  });

  properties.forEach((prop) => {
    if (!used.has(prop.property)) remaining.push(prop);
  });

  return { consolidated, remaining };
};

export const categorizePropertiesWithDiff = (
  leftStyles: Record<string, any> = {},
  rightStyles: Record<string, any> = {},
): CSSCategory[] => {
  const allChanges = compareProperties(leftStyles, rightStyles);
  const categorized: Record<string, { properties: CSSPropertyChange[]; shorthands: ShorthandPropertyChange[] }> = {};

  Object.keys(CSS_CATEGORIES).forEach((category) => {
    categorized[category] = { properties: [], shorthands: [] };
  });

  Object.entries(CSS_CATEGORIES).forEach(([category, props]) => {
    const categoryChanges = allChanges.filter((change) => props.includes(change.property));
    const { consolidated, remaining } = consolidateShorthands(categoryChanges);
    categorized[category].properties = remaining;
    categorized[category].shorthands = consolidated;
  });

  const usedProperties = new Set<string>();
  Object.values(categorized).forEach((cat) => {
    cat.properties.forEach((prop) => usedProperties.add(prop.property));
    cat.shorthands.forEach((sh) => sh.individual.forEach((p) => usedProperties.add(p)));
  });

  const uncategorized = allChanges.filter((change) => !usedProperties.has(change.property));
  const { consolidated: uncategorizedSh, remaining: uncategorizedRem } = consolidateShorthands(uncategorized);
  categorized.layout.properties.push(...uncategorizedRem);
  categorized.layout.shorthands.push(...uncategorizedSh);

  return Object.entries(categorized)
    .map(([name, { properties, shorthands }]) => ({
      name,
      label: CATEGORY_LABELS[name] || name,
      properties: properties.sort((a, b) => a.property.localeCompare(b.property)),
      shorthands: shorthands.sort((a, b) => a.shorthand.localeCompare(b.shorthand)),
    }))
    .filter((c) => c.properties.length > 0 || c.shorthands.length > 0);
};

export const compareAttributes = (
  leftAttributes: Record<string, string> = {},
  rightAttributes: Record<string, string> = {},
): AttributeChange[] => {
  const changes: AttributeChange[] = [];
  const allAttributes = new Set([...Object.keys(leftAttributes), ...Object.keys(rightAttributes)]);

  for (const attribute of allAttributes) {
    const leftValue = leftAttributes[attribute];
    const rightValue = rightAttributes[attribute];
    if (leftValue === undefined) {
      changes.push({ attribute, changeType: "added", newValue: rightValue, currentValue: rightValue });
    } else if (rightValue === undefined) {
      changes.push({ attribute, changeType: "removed", oldValue: leftValue, currentValue: leftValue });
    } else if (leftValue !== rightValue) {
      changes.push({
        attribute,
        changeType: "modified",
        oldValue: leftValue,
        newValue: rightValue,
        currentValue: rightValue,
      });
    } else {
      changes.push({ attribute, changeType: "unchanged", currentValue: rightValue });
    }
  }
  return changes.sort((a, b) => a.attribute.localeCompare(b.attribute));
};

export const compareClasses = (leftClasses: string[] = [], rightClasses: string[] = []): ClassChange[] => {
  const changes: ClassChange[] = [];
  const leftSet = new Set(leftClasses);
  const rightSet = new Set(rightClasses);
  rightClasses.forEach((cls) => {
    if (!leftSet.has(cls)) changes.push({ className: cls, changeType: "added" });
  });
  leftClasses.forEach((cls) => {
    if (!rightSet.has(cls)) changes.push({ className: cls, changeType: "removed" });
  });
  return changes.sort((a, b) => a.className.localeCompare(b.className));
};
