import type { CSSDiff } from "../../../../../utils/cssParser.ts";

export interface CSSBlocks {
  left: string;
  right: string;
}

interface NodeWithClassRules {
  classRules?: Record<string, Record<string, any>>;
}

const SPECIAL_PROPERTIES = ["attributes", "bounds", "classes", "styles"];

const isSpecialProperty = (prop: string): boolean => {
  return SPECIAL_PROPERTIES.includes(prop);
};

const formatProperty = (prop: string, value: any): string => {
  if (isSpecialProperty(prop)) {
    return `  ${prop}:${value}`;
  }
  return `  ${prop}: ${value};`;
};

/**
 * Generates CSS blocks for computed view from diff data
 */
export const generateComputedCSS = (diff: CSSDiff | null, selectorName = "ElementProperties"): CSSBlocks => {
  if (!diff) return { left: "", right: "" };

  const leftProperties: string[] = [];
  const rightProperties: string[] = [];

  // Build left snapshot CSS (original values)
  Object.entries(diff.removed).forEach(([prop, value]) => {
    leftProperties.push(formatProperty(prop, value));
  });

  Object.entries(diff.modified).forEach(([prop, change]) => {
    leftProperties.push(formatProperty(prop, change.old));
  });

  // Build right snapshot CSS (new values)
  Object.entries(diff.added).forEach(([prop, value]) => {
    rightProperties.push(formatProperty(prop, value));
  });

  Object.entries(diff.modified).forEach(([prop, change]) => {
    rightProperties.push(formatProperty(prop, change.new));
  });

  const leftCSS = leftProperties.length > 0 
    ? `${selectorName} {\n${leftProperties.join("\n")}\n}` 
    : "";
  
  const rightCSS = rightProperties.length > 0 
    ? `${selectorName} {\n${rightProperties.join("\n")}\n}` 
    : "";

  return { left: leftCSS, right: rightCSS };
};

/**
 * Generates CSS blocks for class view from node data
 */
export const generateClassCSS = (
  leftNode: NodeWithClassRules | null, 
  rightNode: NodeWithClassRules | null
): CSSBlocks => {
  const buildClassCSS = (node: NodeWithClassRules | null): string => {
    if (!node?.classRules) return "";

    const cssRules: string[] = [];

    Object.entries(node.classRules).forEach(([className, rules]) => {
      if (rules && typeof rules === "object" && Object.keys(rules).length > 0) {
        const properties = Object.entries(rules)
          .map(([prop, value]) => `  ${prop}: ${value};`)
          .join("\n");

        cssRules.push(`.${className} {\n${properties}\n}`);
      }
    });

    return cssRules.join("\n\n");
  };

  const leftCSS = buildClassCSS(leftNode);
  const rightCSS = buildClassCSS(rightNode);

  return { left: leftCSS, right: rightCSS };
};