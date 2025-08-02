import { CSSSnapshot } from "../../types";
import React from "react";

/**
 * Types of changes when comparing snapshots
 */
export enum ChangeType {
  ADDED = "added",
  REMOVED = "removed",
  CHANGED = "changed",
  UNCHANGED = "unchanged",
}

/**
 * Categories for CSS properties
 */
export enum PropertyCategory {
  LAYOUT = "Layout",
  TYPOGRAPHY = "Typography",
  VISUAL = "Visual",
  TABLE = "Table",
  LIST = "List",
  OTHER = "Other",
}

/**
 * Represents a change in position properties
 */
export interface PositionChange {
  property: "top" | "left" | "width" | "height";
  valueA: number;
  valueB: number;
  difference: number;
  percentage: number;
}

/**
 * Represents a comparison between elements
 */
export interface ElementComparison {
  path: string;
  changeType: ChangeType;
  changes: {
    property: string;
    valueA: string | null;
    valueB: string | null;
    changeType: ChangeType;
  }[];
  positionChanges?: PositionChange[];
  hasMoved?: boolean;
}

/**
 * Interface for element position information
 */
export interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  position: string;
  display: string;
}

/**
 * Interface for element style information
 */
export interface ElementStyle {
  tagName: string;
  id: string | null;
  classes: string[];
  styles: Record<string, string>;
}

/**
 * Props for the SnapshotCompare component
 */
export interface SnapshotCompareProps {
  snapshotA: CSSSnapshot;
  snapshotB: CSSSnapshot;
  onBack: () => void;
}

/**
 * Props for the SummaryPanel component
 */
export interface SummaryPanelProps {
  comparison: ElementComparison[];
}

/**
 * Props for the PropertyList component
 */
export interface PropertyListProps {
  selectedElementData: ElementComparison | null;
  filteredProperties: Array<{
    property: string;
    valueA: string | null;
    valueB: string | null;
    changeType: string;
  }>;
  highlightDifferences: (valueA: string, valueB: string) => { valueA: React.ReactNode; valueB: React.ReactNode };
}

/**
 * Props for the PositionChanges component
 */
export interface PositionChangesProps {
  selectedElementData: ElementComparison | null;
}

/**
 * Props for the PositionView component
 */
export interface PositionViewProps {
  selectedElementData: ElementComparison | null;
}

/**
 * Props for the CSSView component
 */
export interface CSSViewProps {
  selectedElementData: ElementComparison | null;
  filteredProperties: Array<{
    property: string;
    valueA: string | null;
    valueB: string | null;
    changeType: string;
  }>;
}


/**
 * Props for the ElementList component
 */
export interface ElementListProps {
  filteredElements: ElementComparison[];
  selectedElement: string | null;
  setSelectedElement: (path: string) => void;
  scrollToAndHighlightElement: (path: string) => void;
  stylesA: Record<string, ElementStyle>;
  stylesB: Record<string, ElementStyle>;
  elementRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}