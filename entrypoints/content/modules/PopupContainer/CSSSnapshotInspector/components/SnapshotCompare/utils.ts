import { PropertyCategory, ChangeType, ElementComparison, ElementStyle, ElementPosition } from "./types";
import { CSSSnapshot, SnapshotNode } from "../../types";

/**
 * Map of property category to color
 */
export const CategoryColors: Record<PropertyCategory, string> = {
  [PropertyCategory.LAYOUT]: "#4285f4", // Blue
  [PropertyCategory.TYPOGRAPHY]: "#0f9d58", // Green
  [PropertyCategory.VISUAL]: "#db4437", // Red
  [PropertyCategory.TABLE]: "#f4b400", // Yellow
  [PropertyCategory.LIST]: "#9c27b0", // Purple
  [PropertyCategory.OTHER]: "#757575", // Gray
};

/**
 * List of common default styles to skip when capturing and comparing
 */
export const defaultStylesToSkip = [
  "animation",
  "transition",
  "margin-block",
  "padding-block",
  "text-rendering",
  "appearance",
  "user-select",
  "box-sizing",
  "backface-visibility",
  "perspective",
  "mask",
  "clip",
  "filter",
];

/**
 * Default values to skip when comparing
 */
export const defaultValuesToSkip = ["none", "normal", "auto", "0px", "medium", "inherit", "initial", "unset"];

/**
 * Helper function to check if a value is a default value
 */
export const isDefaultValue = (value: string | null): boolean => {
  if (!value) return true;
  return defaultValuesToSkip.includes(value);
};

/**
 * Helper function to check if a property should be skipped
 */
export const shouldSkipProperty = (property: string): boolean => {
  return defaultStylesToSkip.some((defaultStyle) => property.includes(defaultStyle));
};

/**
 * Helper function to get the category of a CSS property
 */
export const getPropertyCategory = (property: string): PropertyCategory => {
  // Layout properties
  if (
    /^(margin|padding|width|height|top|right|bottom|left|position|display|flex|grid|box|align|justify|order|float|clear)/.test(
      property,
    )
  ) {
    return PropertyCategory.LAYOUT;
  }

  // Typography properties
  if (/^(font|text|line|letter|word|white|writing|vertical|hyphens)/.test(property)) {
    return PropertyCategory.TYPOGRAPHY;
  }

  // Visual properties
  if (
    /^(color|background|border|outline|box-shadow|opacity|visibility|overflow|clip|mask|filter|backdrop|transition|animation|transform)/.test(
      property,
    )
  ) {
    return PropertyCategory.VISUAL;
  }

  // Table properties
  if (/^(table|caption|empty-cells|border-collapse|border-spacing)/.test(property)) {
    return PropertyCategory.TABLE;
  }

  // List properties
  if (/^(list)/.test(property)) {
    return PropertyCategory.LIST;
  }

  // Other properties
  return PropertyCategory.OTHER;
};

/**
 * Helper function to get styles from snapshot
 */
export const getStylesFromSnapshot = (snapshot: CSSSnapshot): Record<string, ElementStyle> => {
  // For backward compatibility
  if ((snapshot as any).styles) {
    return (snapshot as any).styles;
  }

  // Generate styles from snapshot.root
  const result: Record<string, ElementStyle> = {};

  const processNode = (node: SnapshotNode, path: string[] = []) => {
    const currentPath = path.join(" > ");

    // Convert to ElementStyle format
    result[currentPath] = {
      tagName: node.tag,
      id: node.elementId || null,
      classes: Array.from(node.classes),
      styles: node.styles,
    };

    // Process children
    for (const child of node.children) {
      processNode(child, [...path, child.id]);
    }
  };

  // Start processing from the root node
  if (snapshot.root) {
    processNode(snapshot.root, [snapshot.root.id]);
  }

  return result;
};

/**
 * Helper function to get positions from snapshot
 */
export const getPositionsFromSnapshot = (snapshot: CSSSnapshot): Record<string, ElementPosition> => {
  // For backward compatibility
  if ((snapshot as any).positions) {
    return (snapshot as any).positions;
  }

  // Generate positions from snapshot.root
  const result: Record<string, ElementPosition> = {};

  const processNode = (node: SnapshotNode, path: string[] = []) => {
    const currentPath = path.join(" > ");

    result[currentPath] = {
      top: node.bounds.top,
      left: node.bounds.left,
      width: node.bounds.width,
      height: node.bounds.height,
      zIndex: parseInt(node.styles["z-index"] || "0"),
      position: node.styles["position"] || "static",
      display: node.styles["display"] || "block",
    };

    // Process children
    for (const child of node.children) {
      processNode(child, [...path, child.id]);
    }
  };

  // Start processing from the root node
  if (snapshot.root) {
    processNode(snapshot.root, [snapshot.root.id]);
  }

  return result;
};

/**
 * Compare snapshots and identify changes
 */
export const compareSnapshots = (
  stylesA: Record<string, ElementStyle>,
  stylesB: Record<string, ElementStyle>,
  positionsA?: Record<string, ElementPosition>,
  positionsB?: Record<string, ElementPosition>
): ElementComparison[] => {
  const result: ElementComparison[] = [];

  // Get all unique element paths from both snapshots
  const allPaths = new Set([...Object.keys(stylesA), ...Object.keys(stylesB)]);

  // Compare each element
  allPaths.forEach((path) => {
    const elementA = stylesA[path];
    const elementB = stylesB[path];
    const positionA = positionsA ? positionsA[path] : undefined;
    const positionB = positionsB ? positionsB[path] : undefined;

    let changeType: ChangeType = ChangeType.UNCHANGED;
    const changes: ElementComparison["changes"] = [];
    const positionChanges: PositionChange[] = [];
    let hasMoved = false;

    // Element exists only in snapshot A
    if (!elementB) {
      changeType = ChangeType.REMOVED;

      // Add all properties as removed
      if (elementA) {
        Object.entries(elementA.styles).forEach(([property, value]) => {
          changes.push({
            property,
            valueA: value as string,
            valueB: null,
            changeType: ChangeType.REMOVED,
          });
        });
      }
    }
    // Element exists only in snapshot B
    else if (!elementA) {
      changeType = ChangeType.ADDED;

      // Add all properties as added
      Object.entries(elementB.styles).forEach(([property, value]) => {
        changes.push({
          property,
          valueA: null,
          valueB: value as string,
          changeType: ChangeType.ADDED,
        });
      });
    }
    // Element exists in both snapshots
    else {
      // Compare styles
      const allProperties = new Set([...Object.keys(elementA.styles), ...Object.keys(elementB.styles)]);

      let hasChanges = false;

      allProperties.forEach((property) => {
        const valueA = elementA.styles[property];
        const valueB = elementB.styles[property];

        // Property exists only in A
        if (valueB === undefined) {
          hasChanges = true;
          changes.push({
            property,
            valueA: valueA as string,
            valueB: null,
            changeType: ChangeType.REMOVED,
          });
        }
        // Property exists only in B
        else if (valueA === undefined) {
          hasChanges = true;
          changes.push({
            property,
            valueA: null,
            valueB: valueB as string,
            changeType: ChangeType.ADDED,
          });
        }
        // Property exists in both but values differ
        else if (valueA !== valueB) {
          hasChanges = true;
          changes.push({
            property,
            valueA: valueA as string,
            valueB: valueB as string,
            changeType: ChangeType.CHANGED,
          });
        }
      });

      // Compare positions if available
      if (positionA && positionB) {
        // Check position properties
        const positionProps: Array<"top" | "left" | "width" | "height"> = ["top", "left", "width", "height"];

        positionProps.forEach((prop) => {
          const valueA = positionA[prop];
          const valueB = positionB[prop];

          // Calculate absolute and percentage differences
          const difference = valueB - valueA;
          const percentage = valueA !== 0 ? (difference / valueA) * 100 : 0;

          // Consider significant changes (more than 1px or 1%)
          if (Math.abs(difference) > 1 || Math.abs(percentage) > 1) {
            positionChanges.push({
              property: prop,
              valueA,
              valueB,
              difference,
              percentage,
            });

            // Mark element as moved if position changed
            if (prop === "top" || prop === "left") {
              hasMoved = true;
            }
          }
        });
      }

      if (hasChanges || positionChanges.length > 0) {
        changeType = ChangeType.CHANGED;
      }
    }

    // Only add elements with changes to the result
    if (changeType !== ChangeType.UNCHANGED || positionChanges.length > 0) {
      result.push({
        path,
        changeType,
        changes,
        positionChanges: positionChanges.length > 0 ? positionChanges : undefined,
        hasMoved: hasMoved || undefined,
      });
    }
  });

  return result;
};

/**
 * Format date for display
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};