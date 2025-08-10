import { CSSSnapshot } from "../../types";

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
  activeView?: "diff" | "tree" | "stats";
  setActiveView?: (view: "diff" | "tree" | "stats") => void;
  splitView?: boolean;
  setSplitView?: (split: boolean) => void;
}