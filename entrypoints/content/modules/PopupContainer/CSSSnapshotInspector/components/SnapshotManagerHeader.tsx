/**
 * SnapshotManagerHeader - Header component for LIST view mode (SnapshotManager)
 */
import React, { memo, useState } from "react";
import styled from "styled-components";
import {
  IconUpload,
  IconExclamationCircle,
  IconSparkles,
  IconSearch,
  IconDotsVertical,
  IconAnalyze,
  IconArrowLeft,
  IconCamera,
} from "@tabler/icons-react";
import { MdOutlineCompare } from "react-icons/md";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { CSS_SNAPSHOT } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import {
  PortalId,
  ScenarioPortalFooterButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { AutomationFooterContainer } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/styles.ts";
import { Button } from "antd";

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

// Compact square icon button: the header shares one row with the title and close button in a 350px panel
const PrimaryButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 8px;
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
  flex-shrink: 0;
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
    background: #f3f4f6;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
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

const ProgressContainer = styled.div`
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e5e7eb;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;

  div {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px;
    animation: progress 2s ease-in-out infinite;
  }

  @keyframes progress {
    0% {
      width: 0%;
    }
    50% {
      width: 70%;
    }
    100% {
      width: 100%;
    }
  }
`;

const ProgressText = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
`;

interface SnapshotManagerHeaderProps {
  readonly isCapturing: boolean;
  readonly snapshotsCount: number;
  readonly compareSnapshots: readonly any[];
  readonly onCapture: () => Promise<void>;
  readonly onImport: () => void;
  readonly onCompare: () => void;
  readonly onToggleSearch?: () => void;
  readonly isSearchVisible?: boolean;
  readonly error?: string | null;
  readonly onCaptureFromPickedElement?: () => Promise<void>;
  readonly isSelectingElement?: boolean;
}

/**
 * SnapshotManagerHeader component for LIST view mode
 */
export const SnapshotManagerHeader = memo<SnapshotManagerHeaderProps>(
  ({
    isCapturing,
    snapshotsCount,
    compareSnapshots,
    onCapture,
    onImport,
    onCompare,
    onToggleSearch,
    isSearchVisible = false,
    error,
    onCaptureFromPickedElement,
    isSelectingElement = false,
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isCapturingFromElement, setIsCapturingFromElement] = useState<boolean>(false);

    const handleCapture = async () => {
      try {
        await onCapture();
      } catch (err) {
        console.error("Failed to capture snapshot:", err);
      }
    };

    const handleCaptureFromPickedElement = async () => {
      if (isCapturingFromElement || !onCaptureFromPickedElement) return;

      try {
        setIsCapturingFromElement(true);
        await onCaptureFromPickedElement();
      } catch (error) {
        console.error("Failed to capture element snapshot:", error);
        alert("Failed to capture element snapshot. Please try again.");
      } finally {
        setIsCapturingFromElement(false);
      }
    };

    return (
      <>
        <PortalModalHeader portalId={HeaderPortalId.CSS_SNAPSHOT}>
          <FeatureTitle>
            <FeatureIcon icon={CSS_SNAPSHOT.icon} isBetta />
            {CSS_SNAPSHOT.title}

            <PortalModalHeaderButtons>
              <div className="flex gap-2">
                {/* Tooltip keeps its first title, so remount it when the state changes */}
                <Tooltip key={String(isCapturing)} title={isCapturing ? "Capturing snapshot..." : "Capture snapshot of the page"}>
                  <PrimaryButton
                    onClick={handleCapture}
                    disabled={isCapturing}
                    aria-label={isCapturing ? "Capturing snapshot..." : "Capture new snapshot"}
                  >
                    {isCapturing ? <LoadingSpinner /> : <IconSparkles size={18} />}
                  </PrimaryButton>
                </Tooltip>

                {onCaptureFromPickedElement && (
                  <Tooltip
                    key={`${isCapturingFromElement}-${isSelectingElement}`}
                    title={
                      isCapturingFromElement
                        ? "Creating element snapshot..."
                        : isSelectingElement
                          ? "Stop element selection (or press Esc)"
                          : "Pick an element and snapshot it"
                    }
                  >
                    <PrimaryButton
                      onClick={handleCaptureFromPickedElement}
                      disabled={isCapturingFromElement}
                      style={{
                        background: isSelectingElement ? "linear-gradient(135deg, #ef4444, #dc2626)" : undefined,
                      }}
                      aria-label={
                        isCapturingFromElement
                          ? "Creating element snapshot..."
                          : isSelectingElement
                            ? "Stop element selection"
                            : "Pick element to snapshot"
                      }
                      aria-pressed={isSelectingElement}
                    >
                      {isCapturingFromElement ? <LoadingSpinner /> : <IconCamera size={18} />}
                    </PrimaryButton>
                  </Tooltip>
                )}

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
              </div>
            </PortalModalHeaderButtons>
          </FeatureTitle>
        </PortalModalHeader>

        {compareSnapshots && compareSnapshots.length > 0 && (
          <ScenarioPortalFooterButtons portalId={HeaderPortalId.CSS_SNAPSHOT}>
            <AutomationFooterContainer>
              <div className="flex gap-2 w-full justify-end">
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
              </div>
            </AutomationFooterContainer>
          </ScenarioPortalFooterButtons>
        )}

        <HeaderContent>
          {error && (
            <ErrorContainer>
              <IconExclamationCircle size={22} />
              <div>
                <div>Error occurred</div>
                <div>{error}</div>
              </div>
            </ErrorContainer>
          )}
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
      </>
    );
  },
);
