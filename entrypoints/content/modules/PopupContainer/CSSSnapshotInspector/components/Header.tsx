/**
 * Modern Header component with styled-components
 */
import React, { memo, useState } from "react";
import styled from "styled-components";
import {
  IconCamera,
  IconUpload,
  IconExclamationCircle,
  IconSparkles,
  IconAnalyze,
  IconArrowLeft,
  IconSearch,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconEdit,
  IconGitCompare,
  IconCode,
  IconActivity,
  IconLayoutSidebarRightExpand,
  IconLayoutList,
} from "@tabler/icons-react";
import { MdOutlineCompare } from "react-icons/md";
import { ViewMode } from "../constants";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

// Styled Components
const HeaderContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  padding: 16px;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoIcon = styled.div<{ viewMode?: ViewMode }>`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  position: relative;
  cursor: ${(props) => (props.viewMode !== ViewMode.LIST ? "pointer" : "default")};

  &:hover {
    ${(props) =>
      props.viewMode !== ViewMode.LIST &&
      `
      transform: scale(1.05);
      transition: transform 0.2s ease;
    `}
  }
`;

const LogoBadge = styled.div`
  position: absolute;
  bottom: -6px;
  right: -6px;
  padding: 2px 6px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
  line-height: 1;
`;

const TitleSection = styled.div`
  width: 100%;

  h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #1f2937, #374151);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(254, 242, 242, 0.8);
  border: 1px solid rgba(248, 113, 113, 0.8);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);

  div:first-child {
    font-size: 14px;
    font-weight: 600;
    color: #991b1b;
  }

  div:last-child {
    font-size: 12px;
    color: #dc2626;
  }
`;

const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PrimaryButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 300ms ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  ${(props) =>
    props.disabled
      ? `
    background: #f3f4f6;
    color: #9ca3af;
    box-shadow: none;
  `
      : `
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #5b5feb, #7c3aed);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      transform: scale(1.02);
    }
    
    &:active {
      transform: scale(0.98);
    }
  `}
`;

const CompareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);

  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const MenuContainer = styled.div`
  position: relative;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 42px;
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  min-width: 180px;
  z-index: 30;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: transparent;
  border: none;
  color: #374151;
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: #f9fafb;
  }
`;

const ProgressContainer = styled.div`
  margin-top: 24px;
`;

const ProgressBar = styled.div`
  height: 12px;
  background: rgba(229, 231, 235, 0.6);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

  div {
    height: 100%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 6px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

const ProgressText = styled.p`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin: 8px 0 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-top: 2px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// Detail view styled components
const DetailViewContainer = styled.div`
  margin-top: 8px;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DetailContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const TitleEditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TitleInput = styled.input`
  font-size: 18px;
  font-weight: 700;
  background: transparent;
  border: 2px solid #6366f1;
  border-radius: 8px;
  padding: 4.5px 12px;
  color: #1f2937;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

const TitleText = styled.h1`
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #1f2937, #374151);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const SubtitleText = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  margin: 4px 0 0 0;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Compare header styled components
const CompareHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CompareHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const CompareTitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CompareTitleContent = styled.div`
  h2 {
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #1f2937, #374151);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 4px 0;
  }

  p {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
  }
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ControlButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;

  ${(props) =>
    props.active
      ? `
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  `
      : `
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    color: #374151;
    
    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
  `}
`;

interface HeaderProps {
  readonly viewMode: ViewMode;
  readonly isCapturing: boolean;
  readonly compareSnapshotsCount: number;
  readonly snapshotsCount: number;
  readonly selectedSnapshot?: any;
  readonly compareSnapshots: readonly any[];
  readonly onCapture: () => Promise<void>;
  readonly onImport: () => void;
  readonly onCompare: () => void;
  readonly onBackToList: () => void;
  readonly onToggleSearch?: () => void;
  readonly isSearchVisible?: boolean;
  readonly error?: string | null;
  readonly onCompareWithCurrentPage?: () => Promise<void>;
  readonly activeCompareView?: string;
  readonly onChangeCompareView?: (view: string) => void;
  readonly splitView?: boolean;
  readonly onToggleSplitView?: () => void;
}

/**
 * Modern Header component with styled-components
 */
export const Header = memo<HeaderProps>(
  ({
    viewMode,
    isCapturing,
    snapshotsCount,
    selectedSnapshot,
    compareSnapshots,
    onCapture,
    onImport,
    onCompare,
    onBackToList,
    onToggleSearch,
    isSearchVisible = false,
    error,
    onCompareWithCurrentPage,
    activeCompareView = "diff",
    onChangeCompareView = () => {},
    splitView = true,
    onToggleSplitView = () => {},
  }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [isCreatingCurrentSnapshot, setIsCreatingCurrentSnapshot] = useState<boolean>(false);

    // // Function to create a snapshot of the current page and compare with the displayed snapshot
    const handleCompareWithCurrentPage = async () => {
      if (isCreatingCurrentSnapshot || !onCompareWithCurrentPage) return;

      try {
        setIsCreatingCurrentSnapshot(true);
        await onCompareWithCurrentPage();
      } catch (error) {
        console.error("Failed to create current page snapshot:", error);
        alert("Failed to create current page snapshot. Please try again.");
      } finally {
        setIsCreatingCurrentSnapshot(false);
      }
    };

    const handleCapture = async () => {
      try {
        await onCapture();
      } catch (err) {
        console.error("Failed to capture snapshot:", err);
      }
    };

    const getSubtitle = () => {
      switch (viewMode) {
        case ViewMode.LIST:
          return "✨ Visual regression testing made easy";
        case ViewMode.DETAIL:
          return "🔍 Inspect DOM snapshot details";
        default:
          return "⚡ Compare snapshots side by side";
      }
    };

    // Title editing state and logic for details view
    const [title, setTitle] = React.useState<string>("");
    const [editingTitle, setEditingTitle] = React.useState<boolean>(false);

    React.useEffect(() => {
      if (viewMode === ViewMode.DETAIL && selectedSnapshot) {
        setTitle(selectedSnapshot.title);
        setEditingTitle(false);
      }
    }, [viewMode, selectedSnapshot]);

    const saveSnapshotTitle = async (newTitle: string) => {
      if (!selectedSnapshot) return;
      try {
        const updatedSnapshot = {
          ...selectedSnapshot,
          title: newTitle,
        };
        const allSnapshots = await import("../utils/snapshotStorage").then((m) => m.loadSnapshots());
        const updatedSnapshots = allSnapshots.map((s: any) => (s.id === selectedSnapshot.id ? updatedSnapshot : s));
        await import("../utils/snapshotStorage").then((m) => m.saveSnapshots(updatedSnapshots));
        setEditingTitle(false);
      } catch (error) {
        setTitle(selectedSnapshot.title);
        setEditingTitle(false);
      }
    };

    return (
      <HeaderContainer>
        <HeaderContent>
          <LeftSection>
            <LogoSection>
              <LogoIcon
                viewMode={viewMode}
                onClick={() => {
                  if (viewMode !== ViewMode.LIST) {
                    onBackToList();
                  }
                }}
              >
                {viewMode === ViewMode.LIST ? (
                  <IconAnalyze size={28} color="white" />
                ) : (
                  <IconArrowLeft color="white" size={28} />
                )}

                {viewMode === ViewMode.LIST && snapshotsCount > 1 && (
                  <LogoBadge>
                    <Tooltip content={"Total snapshots captured"}>{snapshotsCount}</Tooltip>
                  </LogoBadge>
                )}
              </LogoIcon>
              <TitleSection>
                {viewMode === ViewMode.LIST && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <h1>CSS Snapshot Inspector</h1>
                    </div>
                    <p>{getSubtitle()}</p>
                  </>
                )}

                {viewMode === ViewMode.COMPARE && (
                  <CompareHeader>
                    <CompareTitleContent>
                      <h2>Snapshot Comparison</h2>
                      <p>Visual diff analysis</p>
                    </CompareTitleContent>
                  </CompareHeader>
                )}
                {viewMode === ViewMode.DETAIL && selectedSnapshot && (
                  <DetailViewContainer>
                    <DetailHeader>
                      <DetailContent>
                        <TitleContainer>
                          {editingTitle ? (
                            <TitleEditContainer>
                              <TitleInput
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSnapshotTitle(title);
                                  } else if (e.key === "Escape") {
                                    setTitle(selectedSnapshot.title);
                                    setEditingTitle(false);
                                  }
                                }}
                              />
                              <ActionButton onClick={() => saveSnapshotTitle(title)}>
                                <IconCheck size={18} color="#10b981" />
                              </ActionButton>
                              <ActionButton
                                onClick={() => {
                                  setTitle(selectedSnapshot.title);
                                  setEditingTitle(false);
                                }}
                              >
                                <IconX size={18} color="#ef4444" />
                              </ActionButton>
                            </TitleEditContainer>
                          ) : (
                            <TitleEditContainer>
                              <TitleText>{title}</TitleText>
                              <ActionButton onClick={() => setEditingTitle(true)}>
                                <IconEdit size={16} color="#6b7280" />
                              </ActionButton>
                            </TitleEditContainer>
                          )}
                          <SubtitleText>Detailed snapshot analysis</SubtitleText>
                        </TitleContainer>
                      </DetailContent>
                    </DetailHeader>
                  </DetailViewContainer>
                )}
              </TitleSection>
            </LogoSection>
          </LeftSection>

          {error && (
            <ErrorContainer>
              <IconExclamationCircle size={22} />
              <div>
                <div>Error occurred</div>
                <div>{error}</div>
              </div>
            </ErrorContainer>
          )}

          <ActionsSection>
            {viewMode === ViewMode.COMPARE && (
              <ViewControls>
                <ControlButton active={activeCompareView === "diff"} onClick={() => onChangeCompareView("diff")}>
                  <IconCode size={16} />
                  Diff
                </ControlButton>

                <ControlButton active={activeCompareView === "stats"} onClick={() => onChangeCompareView("stats")}>
                  <IconActivity size={16} />
                  Stats
                </ControlButton>

                {activeCompareView === "diff" && (
                  <ControlButton onClick={onToggleSplitView}>
                    {splitView ? <IconLayoutSidebarRightExpand size={16} /> : <IconLayoutList size={16} />}
                    {splitView ? "Split" : "Unified"}
                  </ControlButton>
                )}
              </ViewControls>
            )}

            {viewMode === ViewMode.LIST && (
              <>
                <PrimaryButton
                  onClick={handleCapture}
                  disabled={isCapturing}
                  aria-label={isCapturing ? "Capturing snapshot..." : "Capture new snapshot"}
                >
                  {isCapturing ? (
                    <>
                      <LoadingSpinner />
                      <span>Capturing...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles size={16} />
                      <span>Capture Snapshot</span>
                    </>
                  )}
                </PrimaryButton>

                {compareSnapshots && compareSnapshots.length > 0 && (
                  <CompareButton
                    onClick={onCompare}
                    disabled={compareSnapshots.length !== 2}
                    aria-label="Compare selected snapshots"
                    title={
                      compareSnapshots.length !== 2
                        ? "Select exactly 2 snapshots to compare"
                        : "Compare selected snapshots"
                    }
                  >
                    <MdOutlineCompare size={16} />
                    <span>Compare ({compareSnapshots.length}/2)</span>
                  </CompareButton>
                )}

                {/* Overflow menu: Search + Import */}
                <MenuContainer>
                  <MoreButton onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
                    <IconDotsVertical size={18} color="#6b7280" />
                  </MoreButton>
                  {menuOpen && (
                    <DropdownMenu onClick={(e) => e.stopPropagation()}>
                      <MenuItem
                        onClick={() => {
                          setMenuOpen(false);
                          onToggleSearch?.();
                        }}
                        aria-label={isSearchVisible ? "Hide search" : "Show search"}
                      >
                        <IconSearch size={16} />
                        <span>{isSearchVisible ? "Hide search" : "Show search"}</span>
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setMenuOpen(false);
                          onImport();
                        }}
                        aria-label="Import snapshot from file"
                      >
                        <IconUpload size={16} />
                        <span>Import snapshot</span>
                      </MenuItem>
                    </DropdownMenu>
                  )}
                </MenuContainer>
              </>
            )}
            {/*// should work only with ViewMode.DETAIL */}
            {viewMode === ViewMode.DETAIL && onCompareWithCurrentPage && (
              <CompareButton
                onClick={handleCompareWithCurrentPage}
                disabled={isCreatingCurrentSnapshot}
                aria-label="Compare with current page"
              >
                {isCreatingCurrentSnapshot ? (
                  <>
                    <LoadingSpinner />
                    <span>Creating snapshot...</span>
                  </>
                ) : (
                  <>
                    <MdOutlineCompare size={16} />
                    <span>Compare with Current</span>
                  </>
                )}
              </CompareButton>
            )}
          </ActionsSection>
        </HeaderContent>

        {isCapturing && (
          <ProgressContainer>
            <ProgressBar>
              <div />
            </ProgressBar>
            <ProgressText>
              <IconSparkles size={12} />
              <span>Analyzing DOM structure and capturing styles...</span>
            </ProgressText>
          </ProgressContainer>
        )}
      </HeaderContainer>
    );
  },
);
