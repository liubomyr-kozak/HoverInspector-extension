import { CSSSnapshot, BaseElementNode } from "../../types";

/**
 * Interface for element style information
 */
export interface ElementStyle extends BaseElementNode {
  // Override id to allow null for compatibility with existing code paths
  id: string | null;
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
