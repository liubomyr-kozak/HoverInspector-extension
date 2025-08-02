/**
 * Оптимізований компонент для управління списком знімків
 */
import React, { memo } from 'react';
import { 
  IconTrash, 
  IconEye, 
  IconDownload, 
  IconCheck
} from '@tabler/icons-react';
import { 
  SnapshotList,
  SnapshotItem,
  SnapshotInfo,
  SnapshotTitle,
  SnapshotMeta,
  SnapshotActions,
  SecondaryButton,
  DangerButton,
  EmptyState
} from './CSSSnapshotInspector.styled';
import { CSSSnapshot } from './types';

interface SnapshotManagerProps {
  readonly snapshots: readonly CSSSnapshot[];
  readonly compareSnapshots: readonly CSSSnapshot[];
  readonly onView: (snapshot: CSSSnapshot) => void;
  readonly onDelete: (id: string) => void;
  readonly onExport: (snapshot: CSSSnapshot) => void;
  readonly onToggleCompare: (snapshot: CSSSnapshot) => void;
}

/**
 * Мемоізований компонент для оптимізації рендерингу
 */
export const SnapshotManager = memo<SnapshotManagerProps>(({
  snapshots,
  compareSnapshots,
  onView,
  onDelete,
  onExport,
  onToggleCompare
}) => {
  if (snapshots.length === 0) {
    return (
      <EmptyState>
        <p>No snapshots available</p>
        <p>Capture a snapshot to get started</p>
      </EmptyState>
    );
  }

  return (
    <SnapshotList>
      {snapshots.map(snapshot => {
        const isSelected = compareSnapshots.some(s => s.id === snapshot.id);
        
        return (
          <SnapshotItem key={snapshot.id}>
            <SnapshotInfo>
              <SnapshotTitle>
                {snapshot.title}
              </SnapshotTitle>
              <SnapshotMeta>
                {new Date(snapshot.timestamp).toLocaleString()} • 
                {snapshot.elementCount} elements • 
                {new URL(snapshot.url).hostname}
              </SnapshotMeta>
            </SnapshotInfo>
            <SnapshotActions>
              <SecondaryButton 
                onClick={() => onToggleCompare(snapshot)}
                style={{ 
                  backgroundColor: isSelected ? '#e6f4ea' : undefined,
                  color: isSelected ? '#137333' : undefined
                }}
                aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
              >
                {isSelected ? <IconCheck size={16} /> : 'Compare'}
              </SecondaryButton>
              <SecondaryButton 
                onClick={() => onView(snapshot)}
                aria-label="View snapshot details"
              >
                <IconEye size={16} />
                View
              </SecondaryButton>
              <SecondaryButton 
                onClick={() => onExport(snapshot)}
                aria-label="Export snapshot"
              >
                <IconDownload size={16} />
                Export
              </SecondaryButton>
              <DangerButton 
                onClick={() => onDelete(snapshot.id)}
                aria-label="Delete snapshot"
              >
                <IconTrash size={16} />
                Delete
              </DangerButton>
            </SnapshotActions>
          </SnapshotItem>
        );
      })}
    </SnapshotList>
  );
});