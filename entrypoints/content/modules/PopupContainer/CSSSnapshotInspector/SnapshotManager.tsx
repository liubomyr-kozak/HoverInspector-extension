/**
 * Modern Snapshot Manager component with styled-components
 */
import React, { memo, useState } from 'react';
import styled from 'styled-components';
import { 
  IconTrash, 
  IconEye, 
  IconDownload, 
  IconCheck,
  IconGlobe,
  IconCalendar,
  IconStack3,
  IconGitCompare,
  IconDotsVertical,
  IconPhotoPlus
} from '@tabler/icons-react';
import { CSSSnapshot } from './types';

// Styled Components
const ManagerContainer = styled.div`
  padding: 24px;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: linear-gradient(135deg, #f8fafc, rgba(99, 102, 241, 0.03));
  border-radius: 16px;
  margin: 24px;
  padding: 48px;
`;

const EmptyStateIcon = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  border: 1px solid rgba(229, 231, 235, 0.5);
`;

const EmptyStateTitle = styled.h3`
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #1f2937, #6b7280);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
`;

const EmptyStateDescription = styled.p`
  color: #6b7280;
  text-align: center;
  margin-bottom: 32px;
  max-width: 500px;
  line-height: 1.6;
  font-size: 18px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 600px;
  margin-bottom: 32px;
`;

const FeatureCard = styled.div`
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(229, 231, 235, 0.5);

  .emoji {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .text {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
`;

const SnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const SnapshotCard = styled.div<{ isSelected: boolean; isHovered: boolean }>`
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid ${props => props.isSelected ? '#6366f1' : 'rgba(229, 231, 235, 0.6)'};
  border-radius: 16px;
  padding: 24px;
  box-shadow: ${props => props.isHovered ? '0 20px 60px rgba(0, 0, 0, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.08)'};
  backdrop-filter: blur(8px);
  transition: all 300ms ease;
  position: relative;
  cursor: pointer;
  transform: ${props => props.isHovered ? 'scale(1.02)' : 'scale(1)'};

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.isSelected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent'};
    border-radius: 16px 16px 0 0;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .icon {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .text {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
`;

const OptionsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(243, 244, 246, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.6);

  .icon {
    color: #6366f1;
  }

  .content {
    .label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
    }
    .value {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
  flex: 1;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          &:hover {
            background: linear-gradient(135deg, #5b5feb, #7c3aed);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          &:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e5e7eb;
          color: #374151;
          &:hover {
            background: #f9fafb;
            border-color: #d1d5db;
          }
        `;
    }
  }}
`;

const SelectionBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
`;

interface SnapshotManagerProps {
  readonly snapshots: readonly CSSSnapshot[];
  readonly compareSnapshots: readonly CSSSnapshot[];
  readonly onView: (snapshot: CSSSnapshot) => void;
  readonly onDelete: (id: string) => void;
  readonly onExport: (snapshot: CSSSnapshot) => void;
  readonly onToggleCompare: (snapshot: CSSSnapshot) => void;
}

export const SnapshotManager = memo<SnapshotManagerProps>(({
  snapshots,
  compareSnapshots,
  onView,
  onDelete,
  onExport,
  onToggleCompare
}) => {
  const [hoveredSnapshot, setHoveredSnapshot] = useState<string | null>(null);

  if (snapshots.length === 0) {
    return (
      <ManagerContainer>
        <EmptyStateContainer>
          <EmptyStateIcon>
            <IconPhotoPlus size={72} color="#9ca3af" />
          </EmptyStateIcon>
          <EmptyStateTitle>
            No Snapshots Yet
          </EmptyStateTitle>
          <EmptyStateDescription>
            Start by capturing your first CSS snapshot to analyze DOM structure and track visual changes over time.
          </EmptyStateDescription>
          <FeatureGrid>
            <FeatureCard>
              <div className="emoji">📊</div>
              <div className="text">Track Changes</div>
            </FeatureCard>
            <FeatureCard>
              <div className="emoji">🔍</div>
              <div className="text">Find Issues</div>
            </FeatureCard>
            <FeatureCard>
              <div className="emoji">⚡</div>
              <div className="text">Compare Fast</div>
            </FeatureCard>
          </FeatureGrid>
        </EmptyStateContainer>
      </ManagerContainer>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSelected = (snapshot: CSSSnapshot) => {
    return compareSnapshots.some(s => s.id === snapshot.id);
  };

  return (
    <ManagerContainer>
      <SnapshotGrid>
        {snapshots.map((snapshot) => {
          const selected = isSelected(snapshot);
          const hovered = hoveredSnapshot === snapshot.id;

          return (
            <SnapshotCard
              key={snapshot.id}
              isSelected={selected}
              isHovered={hovered}
              onClick={() => onView(snapshot)}
              onMouseEnter={() => setHoveredSnapshot(snapshot.id)}
              onMouseLeave={() => setHoveredSnapshot(null)}
            >
              {selected && (
                <SelectionBadge>
                  <IconCheck size={14} />
                  Selected
                </SelectionBadge>
              )}

              <CardHeader>
                <CardTitle>
                  <div className="icon">
                    <IconGlobe size={20} />
                  </div>
                  <div className="text">
                    Snapshot #{snapshot.id.slice(0, 8)}
                  </div>
                </CardTitle>
                <OptionsButton>
                  <IconDotsVertical size={18} color="#6b7280" />
                </OptionsButton>
              </CardHeader>

              <MetadataGrid>
                <MetadataItem>
                  <IconCalendar size={16} className="icon" />
                  <div className="content">
                    <div className="label">Captured</div>
                    <div className="value">{formatDate(snapshot.timestamp)}</div>
                  </div>
                </MetadataItem>

                <MetadataItem>
                  <IconStack3 size={16} className="icon" />
                  <div className="content">
                    <div className="label">Elements</div>
                    <div className="value">{snapshot.elementCount || 0} items</div>
                  </div>
                </MetadataItem>

                <MetadataItem>
                  <IconGlobe size={16} className="icon" />
                  <div className="content">
                    <div className="label">Page URL</div>
                    <div className="value" title={snapshot.url}>
                      {snapshot.url ? new URL(snapshot.url).hostname : 'Unknown'}
                    </div>
                  </div>
                </MetadataItem>

                <MetadataItem>
                  <IconGitCompare size={16} className="icon" />
                  <div className="content">
                    <div className="label">Status</div>
                    <div className="value">Ready to compare</div>
                  </div>
                </MetadataItem>
              </MetadataGrid>

              <ActionButtons>
                <ActionButton
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(snapshot);
                  }}
                >
                  <IconEye size={14} />
                  View
                </ActionButton>

                <ActionButton
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(snapshot);
                  }}
                >
                  <IconGitCompare size={14} />
                  {selected ? 'Deselect' : 'Select'}
                </ActionButton>

                <ActionButton
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(snapshot);
                  }}
                >
                  <IconDownload size={14} />
                  Export
                </ActionButton>

                <ActionButton
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this snapshot?')) {
                      onDelete(snapshot.id);
                    }
                  }}
                >
                  <IconTrash size={14} />
                  Delete
                </ActionButton>
              </ActionButtons>
            </SnapshotCard>
          );
        })}
      </SnapshotGrid>
    </ManagerContainer>
  );
});