/**
 * SnapshotViewerHeader - Header component for DETAIL view mode (SnapshotViewer)
 */
import React, { memo, useState, useEffect } from "react";
import styled from "styled-components";
import { IconExclamationCircle, IconArrowLeft, IconCheck, IconX, IconEdit } from "@tabler/icons-react";
import { MdOutlineCompare } from "react-icons/md";
import {
  HeaderPortalId,
  PortalModalHeader,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { CSS_SNAPSHOT } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { ScenarioPortalFooterButtons } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { AutomationFooterContainer } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/styles.ts";

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
  width: 100%;
  gap: 12px;
  justify-content: flex-end;
`;

const CompareButton = styled.button<{ disabled?: boolean }>`
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
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 200ms ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);

  ${(props) =>
    props.disabled
      ? `
    background: #f3f4f6 !important;
    color: #9ca3af !important;
    box-shadow: none;
  `
      : `
    &:hover {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }
  `}
`;

const DetailViewContainer = styled.div`
  width: 100%;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DetailContent = styled.div`
  flex: 1;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleEditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TitleInput = styled.input`
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  outline: none;
  transition: border-color 200ms ease;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TitleText = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  padding: 8px 0;
`;

const SubtitleText = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
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
  transition: all 150ms ease;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
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

interface SnapshotViewerHeaderProps {
  readonly selectedSnapshot?: any;
  readonly onBackToList: () => void;
  readonly error?: string | null;
  readonly onCompareWithCurrentPage?: () => Promise<void>;
}

/**
 * SnapshotViewerHeader component for DETAIL view mode
 */
export const SnapshotViewerHeader = memo<SnapshotViewerHeaderProps>(
  ({ selectedSnapshot, onBackToList, error, onCompareWithCurrentPage }) => {
    const [title, setTitle] = useState<string>("");
    const [editingTitle, setEditingTitle] = useState<boolean>(false);
    const [isCreatingCurrentSnapshot, setIsCreatingCurrentSnapshot] = useState<boolean>(false);

    useEffect(() => {
      if (selectedSnapshot) {
        setTitle(selectedSnapshot.title);
        setEditingTitle(false);
      }
    }, [selectedSnapshot]);

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

    return (
      <>
        <PortalModalHeader portalId={HeaderPortalId.CSS_SNAPSHOT_DETAILS}>
          <FeatureTitle>
            <Tooltip title={"Back to list"}>
              <FeatureIcon icon={IconArrowLeft} onClick={onBackToList} />
            </Tooltip>
            {CSS_SNAPSHOT.title} (Page Details)
          </FeatureTitle>
        </PortalModalHeader>

        <HeaderContent>
          <LeftSection>
            <TitleSection>
              {selectedSnapshot && (
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
                      </TitleContainer>
                    </DetailContent>
                  </DetailHeader>
                </DetailViewContainer>
              )}
            </TitleSection>
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

          <ScenarioPortalFooterButtons portalId={HeaderPortalId.CSS_SNAPSHOT}>
            <AutomationFooterContainer>
              <ActionsSection>
                {onCompareWithCurrentPage && (
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
            </AutomationFooterContainer>
          </ScenarioPortalFooterButtons>
        </HeaderContent>
      </>
    );
  },
);
