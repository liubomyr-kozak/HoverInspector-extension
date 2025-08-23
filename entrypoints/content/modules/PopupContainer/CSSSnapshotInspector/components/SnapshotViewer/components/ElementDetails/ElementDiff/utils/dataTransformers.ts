import type { CSSDiff } from "../../../../../utils/cssParser.ts";

export interface PropertyDiff {
  property: string;
  leftValue: string | null;
  rightValue: string | null;
  changeType: "added" | "removed" | "modified";
}

/**
 * Transforms CSSDiff data into PropertyDiff array for UI rendering
 */
export const transformDiffToProperties = (diff: CSSDiff | null): PropertyDiff[] => {
  if (!diff) return [];

  const properties: PropertyDiff[] = [];

  // Added properties
  Object.entries(diff.added).forEach(([prop, value]) => {
    properties.push({
      property: prop,
      leftValue: null,
      rightValue: value,
      changeType: "added",
    });
  });

  // Removed properties
  Object.entries(diff.removed).forEach(([prop, value]) => {
    properties.push({
      property: prop,
      leftValue: value,
      rightValue: null,
      changeType: "removed",
    });
  });

  // Modified properties
  Object.entries(diff.modified).forEach(([prop, change]) => {
    properties.push({
      property: prop,
      leftValue: change.old,
      rightValue: change.new,
      changeType: "modified",
    });
  });

  return properties.sort((a, b) => a.property.localeCompare(b.property));
};

/**
 * Checks if a CSSDiff has any changes
 */
export const hasDiffChanges = (diff: CSSDiff | null): boolean => {
  if (!diff) return false;
  
  return (
    Object.keys(diff.added).length +
    Object.keys(diff.removed).length +
    Object.keys(diff.modified).length
  ) > 0;
};

/**
 * Counts total number of changes in a CSSDiff
 */
export const countDiffChanges = (diff: CSSDiff | null): number => {
  if (!diff) return 0;
  
  return (
    Object.keys(diff.added).length +
    Object.keys(diff.removed).length +
    Object.keys(diff.modified).length
  );
};