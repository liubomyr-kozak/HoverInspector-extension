import { CSSSnapshot } from "../../../types";

/**
 * Props for the main SnapshotViewer component
 */
export interface SnapshotViewerProps {
  readonly snapshot: CSSSnapshot;
  readonly onBack: () => void;
}

/**
 * Props for the TreeNode component
 */
export interface TreeNodeProps {
  node: any;
  path: string[];
  level: number;
  selectedElement: number | null;
  onSelect: (path: string, elementData?: any) => void;
  expandedNodes: Set<string>;
  toggleNode: (path: string) => void;
  comparisonNode?: any;
  showDiff?: boolean;
}

/**
 * Props for the SectionHeader component
 */
export interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  description?: string;
}

/**
 * Props for the ElementList component
 */
export interface ElementListProps {
  elements: Array<{ path: string; element: any; nodeId: number }>;
  selectedElement: number | null;
  onElementSelect: (path: string, elementData?: any) => void;
}

/**
 * Props for the ElementTree component
 */
export interface ElementTreeProps {
  root: any;
  selectedElement: number | null;
  onElementSelect: (path: string, elementData?: any) => void;
  expandedNodes: Set<string>;
  toggleNode: (path: string) => void;
  comparisonRoot?: any;
  showDiff?: boolean;
}

/**
 * Props for the ElementDetails component
 */
export interface ElementDetailsProps {
  selectedElement: number | null;
  selectedElementData: any;
  selectedElementStyles: Array<[string, any]>;
}

/**
 * Props for the ElementHeader component
 */
export interface ElementHeaderProps {
  selectedElementData: any;
}

/**
 * Props for the ElementSelector component
 */
export interface ElementSelectorProps {
  selectedElementData: any;
}

/**
 * Props for the ElementProperties component
 */
export interface ElementPropertiesProps {
  selectedElementData: any;
}

/**
 * Props for the StyleProperties component
 */
export interface StylePropertiesProps {
  selectedElementStyles: Array<[string, any]>;
}