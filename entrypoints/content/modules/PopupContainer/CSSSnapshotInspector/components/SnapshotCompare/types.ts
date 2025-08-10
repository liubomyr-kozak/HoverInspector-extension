import { CSSSnapshot } from "../../types";

/**
 * Interface for element style information
 */
export interface ElementStyle {
  /** HTML tag name */
  tagName: string;
  /** Element ID (optional) */
  id: string | null;
  /** CSS classes array */
  classes: string[];
  /** All CSS styles as key-value pairs */
  styles: Record<string, string>;
  /** Inline styles from style attribute */
  inlineStyles: Record<string, string>;
  /** Element attributes (excluding id and class) */
  attributes?: Record<string, string>;
  /** Element bounds/position information */
  bounds?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Text content for leaf nodes */
  text?: string;
}

/**
 * Props for the SnapshotCompare component
 */
export interface SnapshotCompareProps {
  snapshotA: CSSSnapshot;
  snapshotB: CSSSnapshot;
  onBack: () => void;
  activeView?: "diff" | "tree" | "stats";
  setActiveView?: (view: "diff" | "tree" | "stats") => void;
  splitView?: boolean;
  showLineNumbers?: boolean;
  setSplitView?: (split: boolean) => void;
}
