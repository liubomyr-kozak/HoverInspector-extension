import type { CSSSnapshot } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/types";
import {
  getStylesFromSnapshot,
  isElementRooted,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotCompare/utils";
import {
  buildDOMTree,
  type DOMTreeNode,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";
import {
  compareDOMTrees,
  getComparisonSummary,
  type ComparisonOptions,
  type ModifiedElement,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeComparison";

export interface SnapshotDiffOptions extends ComparisonOptions {
  /** Most elements listed per group (added, removed, modified); the summary still counts all */
  limit?: number;
}

export const DEFAULT_DIFF_LIMIT = 100;

interface ElementRef {
  path: string;
  tagName: string;
  id?: string | null;
  classes: readonly string[];
  xpath?: string;
}

const describeSnapshot = (snapshot: CSSSnapshot) => ({
  id: snapshot.id,
  title: snapshot.title,
  url: snapshot.url,
  timestamp: snapshot.timestamp,
  elementCount: snapshot.elementCount,
});

const toRef = (node: DOMTreeNode): ElementRef => ({
  path: node.pathString,
  tagName: node.tagName,
  id: node.id || undefined,
  classes: node.classes,
  xpath: node.xpath?.optimized || node.xpath?.absolute,
});

const toModified = (item: ModifiedElement) => ({
  ...toRef(item.elementB),
  styleChanges: item.styleChanges,
  attributeChanges: item.attributeChanges,
  positionChanges: item.positionChanges,
});

/**
 * The same comparison the Snapshot Compare view shows, as plain JSON for an agent: two element snapshots
 * are compared relative to their root element, like in the panel.
 */
export function diffSnapshots(snapshotA: CSSSnapshot, snapshotB: CSSSnapshot, options: SnapshotDiffOptions = {}) {
  const { limit = DEFAULT_DIFF_LIMIT, ...comparisonOptions } = options;
  const relative = isElementRooted(snapshotA) && isElementRooted(snapshotB);
  const comparison = compareDOMTrees(
    buildDOMTree(getStylesFromSnapshot(snapshotA, relative)),
    buildDOMTree(getStylesFromSnapshot(snapshotB, relative)),
    comparisonOptions,
  );

  return {
    before: describeSnapshot(snapshotA),
    after: describeSnapshot(snapshotB),
    summary: getComparisonSummary(comparison),
    added: comparison.added.slice(0, limit).map(toRef),
    removed: comparison.removed.slice(0, limit).map(toRef),
    modified: comparison.modified.slice(0, limit).map(toModified),
    truncated:
      comparison.added.length > limit || comparison.removed.length > limit || comparison.modified.length > limit,
  };
}
