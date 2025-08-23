import { useState, useCallback } from "react";
import type { CSSDiff } from "../../../../../utils/cssParser.ts";
import { convertElementDiffToCSSDiff } from "../../../../../utils/cssParser.ts";

export interface UseChildStylesResult {
  showChildStyles: boolean;
  childStyleDiff: CSSDiff | null;
  toggleChildStyles: () => void;
  hasChildStyles: boolean;
}

interface NodeWithChildren {
  children?: Array<{
    styles?: Record<string, any>;
  }>;
}

const collectDirectChildStyles = (node: NodeWithChildren | null): Record<string, string> => {
  const styles: Record<string, string> = {};
  
  if (!node?.children) return styles;

  node.children.forEach((child, index) => {
    if (child.styles) {
      Object.entries(child.styles).forEach(([prop, value]) => {
        styles[`child[${index}].${prop}`] = String(value);
      });
    }
  });

  return styles;
};

export const useChildStyles = (
  leftNode: NodeWithChildren | null,
  rightNode: NodeWithChildren | null,
  parentDiff: CSSDiff | null
): UseChildStylesResult => {
  const [showChildStyles, setShowChildStyles] = useState(false);
  const [childStyleDiff, setChildStyleDiff] = useState<CSSDiff | null>(null);

  const toggleChildStyles = useCallback(() => {
    if (!leftNode || !rightNode) {
      console.warn("No element data available for child style checking");
      return;
    }

    if (showChildStyles) {
      setShowChildStyles(false);
      setChildStyleDiff(null);
      return;
    }

    const leftChildStyles = collectDirectChildStyles(leftNode);
    const rightChildStyles = collectDirectChildStyles(rightNode);

    if (Object.keys(leftChildStyles).length === 0 && Object.keys(rightChildStyles).length === 0) {
      return;
    }

    const childDiff = convertElementDiffToCSSDiff(
      leftChildStyles,
      rightChildStyles,
      `${parentDiff?.selector || "Element"} > children`
    );

    setChildStyleDiff(childDiff);
    setShowChildStyles(true);
  }, [leftNode, rightNode, showChildStyles, parentDiff]);

  const hasChildStyles = Boolean(
    leftNode?.children?.some(child => child.styles) ||
    rightNode?.children?.some(child => child.styles)
  );

  return {
    showChildStyles,
    childStyleDiff,
    toggleChildStyles,
    hasChildStyles,
  };
};