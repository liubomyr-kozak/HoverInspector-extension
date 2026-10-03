/**
 * SnapshotCompareHeader - Header component for COMPARE view mode (SnapshotCompare)
 */
import React, { memo } from "react";
import styled from "styled-components";
import {
  IconExclamationCircle,
  IconArrowLeft,
  IconCode,
  IconActivity,
  IconLayoutSidebarRightExpand,
  IconLayoutList,
} from "@tabler/icons-react";
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { CONVERT_TOOLS, CSS_SNAPSHOT } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import { Tooltip } from "@/entrypoints/shared/components/Tooltip";

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

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
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

// Icon-only so the controls fit next to the title and close button in the narrow panel
const ControlButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  padding: 0;
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

interface SnapshotCompareHeaderProps {
  readonly onBackToList: () => void;
  readonly error?: string | null;
  readonly activeCompareView?: string;
  readonly onChangeCompareView?: (view: string) => void;
  readonly splitView?: boolean;
  readonly onToggleSplitView?: () => void;
}

/**
 * SnapshotCompareHeader component for COMPARE view mode
 */
export const SnapshotCompareHeader = memo<SnapshotCompareHeaderProps>(
  ({
    onBackToList,
    error,
    activeCompareView = "diff",
    onChangeCompareView = () => {},
    splitView = true,
    onToggleSplitView = () => {},
  }) => {
    return (
      <>
        <PortalModalHeader portalId={HeaderPortalId.CSS_SNAPSHOT_COMPARE}>
          <FeatureTitle>
            <Tooltip title={"Back to list"}>
              <FeatureIcon icon={IconArrowLeft} onClick={onBackToList} />
            </Tooltip>
            <FeatureTitleText title={`${CSS_SNAPSHOT.title} (A/B Compare)`}>{CSS_SNAPSHOT.title} (A/B Compare)</FeatureTitleText>
            <PortalModalHeaderButtons>
              <ViewControls>
                <Tooltip title="Diff view">
                  <ControlButton
                    active={activeCompareView === "diff"}
                    onClick={() => onChangeCompareView("diff")}
                    aria-label="Diff view"
                  >
                    <IconCode size={16} />
                  </ControlButton>
                </Tooltip>

                <Tooltip title="Statistics">
                  <ControlButton
                    active={activeCompareView === "stats"}
                    onClick={() => onChangeCompareView("stats")}
                    aria-label="Statistics"
                  >
                    <IconActivity size={16} />
                  </ControlButton>
                </Tooltip>

                {activeCompareView === "diff" && (
                  // Tooltip keeps its first title, so remount it when the mode flips
                  <Tooltip key={String(splitView)} title={splitView ? "Split view (click for unified)" : "Unified view (click for split)"}>
                    <ControlButton onClick={onToggleSplitView} aria-label={splitView ? "Switch to unified view" : "Switch to split view"}>
                      {splitView ? <IconLayoutSidebarRightExpand size={16} /> : <IconLayoutList size={16} />}
                    </ControlButton>
                  </Tooltip>
                )}
              </ViewControls>
            </PortalModalHeaderButtons>
          </FeatureTitle>
        </PortalModalHeader>

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
      </>
    );
  },
);
