import { CSSSnapshot } from "../../types";

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
