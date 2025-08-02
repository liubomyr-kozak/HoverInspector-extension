/**
 * Оптимізований компонент навігації по вкладках для CSS Snapshot Inspector
 */
import React, { memo } from 'react';
import { Tabs, Tab } from '../CSSSnapshotInspector.styled';
import { ViewMode } from '../constants';
import { CSSSnapshot } from '../types';

interface TabNavigationProps {
  readonly viewMode: ViewMode;
  readonly selectedSnapshot: CSSSnapshot | null;
  readonly compareSnapshots: readonly CSSSnapshot[];
  readonly onTabChange: (mode: ViewMode) => void;
}

/**
 * Мемоізований компонент навігації по вкладках
 */
export const TabNavigation = memo<TabNavigationProps>(({
  viewMode,
  selectedSnapshot,
  compareSnapshots,
  onTabChange,
}) => {
  return (
    <Tabs>
      <Tab 
        active={viewMode === ViewMode.LIST} 
        onClick={() => onTabChange(ViewMode.LIST)}
        aria-label="View snapshots list"
      >
        Snapshots
      </Tab>
      {selectedSnapshot && (
        <Tab 
          active={viewMode === ViewMode.DETAIL} 
          onClick={() => onTabChange(ViewMode.DETAIL)}
          aria-label="View snapshot details"
        >
          Details
        </Tab>
      )}
      {compareSnapshots.length === 2 && (
        <Tab 
          active={viewMode === ViewMode.COMPARE} 
          onClick={() => onTabChange(ViewMode.COMPARE)}
          aria-label="Compare snapshots"
        >
          Compare ({compareSnapshots.length})
        </Tab>
      )}
    </Tabs>
  );
});