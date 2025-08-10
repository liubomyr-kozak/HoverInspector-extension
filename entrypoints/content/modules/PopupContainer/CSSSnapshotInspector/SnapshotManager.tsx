/**
 * Modern Snapshot Manager component with styled-components
 */
import React, { memo, useState } from "react";
import styled from "styled-components";
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
  IconPhotoPlus,
} from "@tabler/icons-react";
import { CSSSnapshot } from "./types";
import {
  HeaderPortalId,
  PortalModalHeader,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { CSS_SNAPSHOT } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

// Styled Components
const ManagerContainer = styled.div``;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, #f8fafc, rgba(99, 102, 241, 0.03));
  border-radius: 16px;
  margin: 16px;
  padding: 32px;
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
  display: flex;
  gap: 16px;
  flex-direction: column;
`;

const SnapshotCard = styled.div<{ isSelected: boolean; isHovered: boolean }>`
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid ${(props) => (props.isSelected ? "#10b981" : "rgba(229, 231, 235, 0.6)")};
  border-radius: 8px;
  padding: 12px;
  box-shadow: ${(props) => (props.isHovered ? "0 8px 32px rgba(0, 0, 0, 0.12)" : "0 1px 4px rgba(0, 0, 0, 0.06)")};
  backdrop-filter: blur(8px);
  transition: all 300ms ease;
  position: relative;
  cursor: pointer;
  transform: ${(props) => (props.isHovered ? "scale(1.01)" : "scale(1)")};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .icon {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 6px;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
  }

  .text {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }
`;

const OptionsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: rgba(243, 244, 246, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 44px;
  right: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  padding: 6px;
  min-width: 160px;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  color: #374151;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: #f9fafb;
  }
`;

const MetadataGrid = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const MetadataItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;

  .icon {
    color: #6366f1;
  }

  .value {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    line-height: 1;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button<{ variant: "primary" | "secondary" | "danger" | "green" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
  // do not use flex: 1 here, it will break the layout
  //flex: 1;

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          &:hover {
            background: linear-gradient(135deg, #5b5feb, #7c3aed);
            box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
          }
        `;
      case "danger":
        return `
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          &:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            box-shadow: 0 1px 4px rgba(239, 68, 68, 0.3);
          }
        `;
      case "green":
        return `
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          &:hover {
            background: linear-gradient(135deg, #059669, #047857);
            box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
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
  //position: absolute;
  //top: 12px;
  //right: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 3px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
`;

interface SnapshotManagerProps {
  readonly snapshots: readonly CSSSnapshot[];
  readonly compareSnapshots: readonly CSSSnapshot[];
  readonly onView: (snapshot: CSSSnapshot) => void;
  readonly onDelete: (id: string) => void;
  readonly onExport: (snapshot: CSSSnapshot) => void;
  readonly onToggleCompare: (snapshot: CSSSnapshot) => void;
  readonly onStartComparison?: () => void;
}

export const SnapshotManager = memo<SnapshotManagerProps>(
  ({ snapshots, compareSnapshots, onView, onDelete, onExport, onToggleCompare, onStartComparison }) => {
    const [hoveredSnapshot, setHoveredSnapshot] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    if (snapshots.length === 0) {
      return (
        <>
          <ManagerContainer>
            <EmptyStateContainer>
              <EmptyStateIcon>
                <IconPhotoPlus size={72} color="#9ca3af" />
              </EmptyStateIcon>
              <EmptyStateTitle>No Snapshots Yet</EmptyStateTitle>
              <EmptyStateDescription>
                Start by capturing your first CSS snapshot to analyze DOM structure and track visual changes over time.
              </EmptyStateDescription>
            </EmptyStateContainer>
          </ManagerContainer>
        </>
      );
    }

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const isSelected = (snapshot: CSSSnapshot) => {
      return compareSnapshots.some((s) => s.id === snapshot.id);
    };

    return (
      <>
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
                  onClick={(e) => {
                    // Toggle select/unselect on card click
                    e.stopPropagation();
                    onToggleCompare(snapshot);
                  }}
                  onMouseEnter={() => setHoveredSnapshot(snapshot.id)}
                  onMouseLeave={() => {
                    setHoveredSnapshot(null);
                    setMenuOpenId((id) => (id === snapshot.id ? null : id));
                  }}
                  style={{ display: "flex", flexDirection: "column", position: "relative" }}
                >
                  <CardHeader>
                    <CardTitle>
                      {!selected ? (
                        <div className="icon">
                          <IconGlobe size={20} />
                        </div>
                      ) : (
                        <SelectionBadge>
                          <IconCheck size={14} />
                          Selected
                        </SelectionBadge>
                      )}
                      <div className="text">Snapshot #{snapshot.title}</div>
                    </CardTitle>
                    <OptionsButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((id) => (id === snapshot.id ? null : snapshot.id));
                      }}
                      aria-label="More actions"
                    >
                      <IconDotsVertical size={18} color="#6b7280" />
                    </OptionsButton>
                    {menuOpenId === snapshot.id && (
                      <DropdownMenu onClick={(e) => e.stopPropagation()}>
                        <MenuItem
                          onClick={() => {
                            setMenuOpenId(null);
                            onExport(snapshot);
                          }}
                        >
                          <IconDownload size={16} /> Export
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setMenuOpenId(null);
                            // if (confirm("Are you sure you want to delete this snapshot?")) {
                            onDelete(snapshot.id);
                            // }
                          }}
                        >
                          <IconTrash size={16} /> Delete
                        </MenuItem>
                      </DropdownMenu>
                    )}
                    {/* View details button on right */}
                  </CardHeader>

                  <MetadataGrid>
                    <MetadataItem title={`Captured: ${formatDate(snapshot.timestamp)}`}>
                      <IconCalendar size={14} className="icon" />
                      <span className="value">{formatDate(snapshot.timestamp)}</span>
                    </MetadataItem>

                    <MetadataItem title={`Elements: ${snapshot.elementCount || 0}`}>
                      <IconStack3 size={14} className="icon" />
                      <span className="value">{snapshot.elementCount || 0}</span>
                    </MetadataItem>

                    <MetadataItem title={snapshot.url || ""}>
                      <IconGlobe size={14} className="icon" />
                      <span className="value">{snapshot.url ? new URL(snapshot.url).hostname : "Unknown"}</span>
                    </MetadataItem>
                  </MetadataGrid>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <ActionButton
                      variant={selected ? "green" : "primary"}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isSelected = compareSnapshots.some((s) => s.id === snapshot.id);

                        if (!isSelected && compareSnapshots.length === 0) {
                          // No snapshots selected - show view details
                          onView(snapshot);
                        } else if (!isSelected && compareSnapshots.length === 1) {
                          // One snapshot selected - select this one to compare
                          onToggleCompare(snapshot);
                        } else if (isSelected && compareSnapshots.length === 1) {
                          // This is the first selected - just toggle selection
                          onToggleCompare(snapshot);
                        } else if (isSelected && compareSnapshots.length === 2) {
                          // This is the second selected - start comparison
                          if (onStartComparison) {
                            onStartComparison();
                          }
                        }
                      }}
                      style={{ minWidth: 80 }}
                      aria-label={(() => {
                        const isSelected = compareSnapshots.some((s) => s.id === snapshot.id);
                        if (!isSelected && compareSnapshots.length === 0) return "View details";
                        if (!isSelected && compareSnapshots.length === 1) return "Select to compare";
                        if (isSelected && compareSnapshots.length === 1) return "Compare (1/2)";
                        if (isSelected && compareSnapshots.length === 2) return "Compare (2/2)";
                        return "View details";
                      })()}
                    >
                      {(() => {
                        const isSelected = compareSnapshots.some((s) => s.id === snapshot.id);
                        if (!isSelected && compareSnapshots.length === 0) {
                          return (
                            <>
                              <IconEye size={12} />
                              View details
                            </>
                          );
                        }
                        if (!isSelected && compareSnapshots.length === 1) {
                          return (
                            <>
                              <IconGitCompare size={12} />
                              Select to compare
                            </>
                          );
                        }
                        if (isSelected && compareSnapshots.length === 1) {
                          return (
                            <>
                              <IconGitCompare size={12} />
                              Compare (1/2)
                            </>
                          );
                        }
                        if (isSelected && compareSnapshots.length === 2) {
                          return (
                            <>
                              <IconGitCompare size={12} />
                              Compare (2/2)
                            </>
                          );
                        }
                        return (
                          <>
                            <IconEye size={12} />
                            View details
                          </>
                        );
                      })()}
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Compare with current page logic
                        window.postMessage({ type: "COMPARE_SNAPSHOTS", snapshots: [snapshot, "CURRENT_PAGE"] }, "*");
                      }}
                      style={{ minWidth: 120 }}
                      aria-label="Compare with current page"
                    >
                      <IconGitCompare size={14} />
                      Compare with current page
                    </ActionButton>
                  </div>
                </SnapshotCard>
              );
            })}
          </SnapshotGrid>
        </ManagerContainer>
      </>
    );
  },
);
