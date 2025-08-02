/**
 * Usage Examples for the new separated DOM Tree system
 * 
 * This file shows how to use the new separated components:
 * 1. DOM Tree Builder - for pure tree structure
 * 2. DOM Tree Comparison - for comparing two trees  
 * 3. DOM Tree Renderer - for displaying trees in React
 * 4. Hooks - for managing tree state in components
 */

import React from 'react';
import { 
  buildDOMTree, 
  ElementStyleData,
  findElementInTree,
  flattenTree 
} from '../utils/domTreeBuilder';

import { 
  compareDOMTrees,
  getComparisonSummary,
  filterComparison 
} from '../utils/domTreeComparison';

import { useDOMTree } from '../hooks/useDOMTree';
import { useTreeComparison } from '../hooks/useTreeComparison';
import { DOMTreeRenderer } from '../components/DOMTreeRenderer';

// ===== 1. SINGLE SNAPSHOT VIEW (for Snapshot Details) =====

interface SnapshotDetailsViewProps {
  snapshotData: Record<string, ElementStyleData>;
}

export const SnapshotDetailsView: React.FC<SnapshotDetailsViewProps> = ({ snapshotData }) => {
  // Use the simple hook for single tree
  const { tree, allElements, statistics } = useDOMTree({ 
    stylesData: snapshotData 
  });

  const [selectedElement, setSelectedElement] = React.useState<string | null>(null);

  const handleElementSelect = (path: string, element: any) => {
    setSelectedElement(path);
    console.log('Selected element:', element);
  };

  const handleShowDetails = (path: string, element: any) => {
    // Show element details modal/panel
    console.log('Show details for:', element);
  };

  return (
    <div>
      <h3>Snapshot DOM Structure</h3>
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
        {statistics.totalElements} elements, {statistics.totalLevels} levels deep
      </div>
      
      <DOMTreeRenderer
        tree={tree}
        selectedElement={selectedElement}
        onElementSelect={handleElementSelect}
        onShowDetails={handleShowDetails}
        showStatistics={true}
      />
    </div>
  );
};

// ===== 2. COMPARISON VIEW (for TreeDiffView replacement) =====

interface ComparisonViewProps {
  snapshotA: Record<string, ElementStyleData>;
  snapshotB: Record<string, ElementStyleData>;
  positionA?: Record<string, any>;
  positionB?: Record<string, any>;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ 
  snapshotA, 
  snapshotB, 
  positionA, 
  positionB 
}) => {
  // Use comparison hook
  const { comparison, summary, filterResults } = useTreeComparison({
    stylesA: snapshotA,
    stylesB: snapshotB,
    positionA,
    positionB,
    options: {
      comparePositions: true,
      compareAttributes: true,
      positionThreshold: 1, // 1px threshold
    }
  });

  const [selectedElement, setSelectedElement] = React.useState<string | null>(null);
  const [showFilter, setShowFilter] = React.useState({
    showAdded: true,
    showRemoved: true, 
    showModified: true,
    showUnchanged: false,
  });

  // Build combined tree for rendering (you could also render separate trees)
  const combinedTree = React.useMemo(() => {
    return buildDOMTree(snapshotB, positionB); // Show snapshot B as base
  }, [snapshotB, positionB]);

  // Custom change indicator for diff display
  const renderChangeIndicator = (element: any) => {
    // Check if element has changes
    const addedElement = comparison.added.find(e => e.path === element.path);
    const removedElement = comparison.removed.find(e => e.path === element.path);
    const modifiedElement = comparison.modified.find(e => e.path === element.path);

    if (addedElement) {
      return <span style={{ color: '#22863a', marginLeft: '8px' }}>[+]</span>;
    }
    if (removedElement) {
      return <span style={{ color: '#d73a49', marginLeft: '8px' }}>[-]</span>;
    }
    if (modifiedElement) {
      const { styleChanges, positionChanges } = modifiedElement;
      return (
        <span style={{ marginLeft: '8px', fontSize: '11px' }}>
          {styleChanges.length > 0 && (
            <span style={{ color: '#f9c513' }}>[~{styleChanges.length}]</span>
          )}
          {positionChanges.length > 0 && (
            <span style={{ color: '#6f42c1' }}>[↔{positionChanges.length}]</span>
          )}
        </span>
      );
    }
    return null;
  };

  // Custom styling for changed elements
  const getElementStyle = (element: any) => {
    const addedElement = comparison.added.find(e => e.path === element.path);
    const removedElement = comparison.removed.find(e => e.path === element.path);
    const modifiedElement = comparison.modified.find(e => e.path === element.path);

    if (addedElement) {
      return { 
        backgroundColor: '#e6ffec',
        borderLeft: '3px solid #22863a' 
      };
    }
    if (removedElement) {
      return { 
        backgroundColor: '#ffebe9',
        borderLeft: '3px solid #d73a49',
        opacity: 0.6 
      };
    }
    if (modifiedElement) {
      return { 
        backgroundColor: '#fff8c5',
        borderLeft: '3px solid #f9c513' 
      };
    }
    return {};
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3>Snapshot Comparison</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {summary.addedCount} added, {summary.removedCount} removed, {summary.modifiedCount} modified
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', fontSize: '14px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={showFilter.showAdded}
            onChange={(e) => setShowFilter(prev => ({ ...prev, showAdded: e.target.checked }))}
          />
          Added ({summary.addedCount})
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={showFilter.showRemoved}
            onChange={(e) => setShowFilter(prev => ({ ...prev, showRemoved: e.target.checked }))}
          />
          Removed ({summary.removedCount})
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={showFilter.showModified}
            onChange={(e) => setShowFilter(prev => ({ ...prev, showModified: e.target.checked }))}
          />
          Modified ({summary.modifiedCount})
        </label>
      </div>

      <DOMTreeRenderer
        tree={combinedTree}
        selectedElement={selectedElement}
        onElementSelect={(path, element) => setSelectedElement(path)}
        renderChangeIndicator={renderChangeIndicator}
        getElementStyle={getElementStyle}
      />
    </div>
  );
};

// ===== 3. PURE UTILITY USAGE (no React components) =====

export function pureUtilityExample() {
  // Sample data
  const stylesA: Record<string, ElementStyleData> = {
    'body': {
      tagName: 'body',
      styles: { margin: '0', padding: '0' },
    },
    'body>div#header': {
      tagName: 'div',
      id: 'header',
      styles: { height: '60px', background: '#fff' },
    },
  };

  const stylesB: Record<string, ElementStyleData> = {
    'body': {
      tagName: 'body',
      styles: { margin: '0', padding: '0' },
    },
    'body>div#header': {
      tagName: 'div',
      id: 'header',
      styles: { height: '80px', background: '#f5f5f5' }, // Changed
    },
    'body>div#header>nav': { // Added
      tagName: 'nav',
      styles: { display: 'flex' },
    },
  };

  // Build trees
  const treeA = buildDOMTree(stylesA);
  const treeB = buildDOMTree(stylesB);

  // Compare trees
  const comparison = compareDOMTrees(treeA, treeB);
  const summary = getComparisonSummary(comparison);

  console.log('Comparison Summary:', summary);
  console.log('Added elements:', comparison.added.length);
  console.log('Modified elements:', comparison.modified.length);

  // Find specific element
  const headerElement = findElementInTree(treeB, 'body>div#header');
  console.log('Header element:', headerElement);

  // Get flat list of all elements
  const allElements = flattenTree(treeB);
  console.log('Total elements:', allElements.length);

  return { comparison, summary, treeA, treeB };
}

// ===== 4. REPLACING THE OLD useTreeDiffLogic =====

/**
 * Instead of the old overcomplicated useTreeDiffLogic, now you can:
 */

// OLD WAY (complicated):
// const { treeData, elementsWithoutViewChanges } = useTreeDiffLogic({
//   filteredElements,
//   stylesA,
//   stylesB,
// });

// NEW WAY (clean and separated):
export function NewDiffApproach({ filteredElements, stylesA, stylesB }: any) {
  // 1. Build trees separately
  const treeA = useDOMTree({ stylesData: stylesA });
  const treeB = useDOMTree({ stylesData: stylesB });
  
  // 2. Compare them
  const comparison = useTreeComparison({
    stylesA,
    stylesB,
    options: { comparePositions: true }
  });

  // 3. Render with clean component
  return (
    <div>
      <DOMTreeRenderer
        tree={treeB.tree}
        renderChangeIndicator={(element) => {
          // Your change indicators here
          return null;
        }}
      />
    </div>
  );
}
