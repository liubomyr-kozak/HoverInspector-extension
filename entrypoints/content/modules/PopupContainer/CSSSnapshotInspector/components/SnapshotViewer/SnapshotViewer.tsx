import React, { useState } from "react";
import styled from "styled-components";
import {
  IconHistory,
  IconEdit,
  IconCheck,
  IconGitCompare,
  IconArrowLeft,
  IconSparkles,
  IconCalendar,
  IconGlobe,
  IconStack3,
  IconX,
  IconCopy,
  IconExternalLink,
} from "@tabler/icons-react";
import { SnapshotViewerProps } from "./types";
import { CSSSnapshot } from "../../types";
import { saveSnapshots, loadSnapshots } from "../../utils/snapshotStorage";
import { SnapshotDetails } from "./components/SnapshotDetails";
import { createCSSSnapshot } from "../../utils/snapshotBuilder";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

// Styled Components
const ViewerContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 32px;
  margin: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.6);
`;

const ViewerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(229, 231, 235, 0.4);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  font-size: 14px;
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

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TitleIcon = styled.div`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
`;

const TitleContent = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #1f2937, #374151);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 16px;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
  }
`;

const TitleInput = styled.input`
  font-size: 28px;
  font-weight: 700;
  background: transparent;
  border: 2px solid #6366f1;
  border-radius: 8px;
  padding: 8px 12px;
  color: #1f2937;
  outline: none;

  &:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EditButton = styled.button`
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
  }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const MetadataBar = styled.div`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.04));
  border: 1px solid rgba(99, 102, 241, 0.18);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
  backdrop-filter: blur(6px);
`;

const MetadataGrid = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const MetadataItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;

  .icon {
    color: #6366f1;
  }

  .value {
    font-size: 12px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1;
  }
`;

const UrlRow = styled.div`
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0; /* enable flex ellipsis */
  .url-text {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: #2563eb;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .muted {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

/**
 * Modern SnapshotViewer component with enhanced UX
 */
export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ snapshot, onBack }) => {
  const [isCreatingCurrentSnapshot, setIsCreatingCurrentSnapshot] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(snapshot.title);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Function to create a snapshot of the current page and compare with the displayed snapshot
  const handleCompareWithCurrentPage = async () => {
    try {
      setIsCreatingCurrentSnapshot(true);

      // Create a snapshot of the current page
      const currentPageSnapshot = await createCSSSnapshot("Current Page");

      // Open the comparison view with the current snapshot and the displayed snapshot
      // We need to use window.postMessage to communicate with the parent component
      window.postMessage(
        {
          type: "COMPARE_SNAPSHOTS",
          snapshots: [snapshot, currentPageSnapshot],
        },
        "*",
      );

      setIsCreatingCurrentSnapshot(false);
    } catch (error) {
      console.error("Failed to create current page snapshot:", error);
      setIsCreatingCurrentSnapshot(false);
      alert("Failed to create current page snapshot. Please try again.");
    }
  };

  // Function to save updated snapshot title
  const saveSnapshotTitle = async (newTitle: string) => {
    try {
      // Create updated snapshot with new title
      const updatedSnapshot = {
        ...snapshot,
        title: newTitle,
      };

      // Get all snapshots and update the specific one
      const allSnapshots = await loadSnapshots();
      const updatedSnapshots = allSnapshots.map((s) => (s.id === snapshot.id ? updatedSnapshot : s));

      // Save updated snapshots
      await saveSnapshots(updatedSnapshots);

      // Exit editing mode
      setEditingTitle(false);
    } catch (error) {
      console.error("Failed to update snapshot title:", error);
      // Revert to original title on error
      setTitle(snapshot.title);
      setEditingTitle(false);
    }
  };

  const date = new Date(snapshot.timestamp);
  const domain = new URL(snapshot.url).hostname;
  const compactDate = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const hasUrl = Boolean(snapshot.url);

  const handleCopyUrl = async () => {
    if (!hasUrl) return;
    try {
      await navigator.clipboard.writeText(snapshot.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = snapshot.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const handleOpenUrl = () => {
    if (!hasUrl) return;
    window.open(snapshot.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <ViewerContainer>
      <ViewerHeader>
        <HeaderLeft>
          <BackButton onClick={onBack}>
            <IconArrowLeft size={18} />
            <span>Back to Snapshots</span>
          </BackButton>

          <TitleSection>
            <TitleIcon>
              <IconHistory size={32} color="white" />
            </TitleIcon>
            <TitleContent>
              {editingTitle ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <TitleInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                  <EditButton onClick={() => saveSnapshotTitle(title)}>
                    <IconCheck size={18} color="#10b981" />
                  </EditButton>
                  <EditButton
                    onClick={() => {
                      setTitle(snapshot.title);
                      setEditingTitle(false);
                    }}
                  >
                    <IconX size={18} color="#ef4444" />
                  </EditButton>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1>{title}</h1>
                  <EditButton onClick={() => setEditingTitle(true)}>
                    <IconEdit size={16} color="#6b7280" />
                  </EditButton>
                </div>
              )}
              <p>Detailed snapshot analysis</p>
            </TitleContent>
          </TitleSection>
        </HeaderLeft>

        <ActionButtons>
          <PrimaryButton
            onClick={handleCompareWithCurrentPage}
            disabled={isCreatingCurrentSnapshot}
          >
            {isCreatingCurrentSnapshot ? (
              <>
                <LoadingSpinner />
                Creating...
              </>
            ) : (
              <>
                <IconGitCompare size={18} />
                Compare with Current
                <IconSparkles size={14} />
              </>
            )}
          </PrimaryButton>
        </ActionButtons>
      </ViewerHeader>

      <MetadataBar>
        <MetadataGrid>
          <MetadataItem title={`Captured: ${compactDate}`}>
            <IconCalendar size={14} className="icon" />
            <span className="value">{compactDate}</span>
          </MetadataItem>

          <MetadataItem title={`Elements: ${snapshot.elementCount}`}>
            <IconStack3 size={14} className="icon" />
            <span className="value">{snapshot.elementCount}</span>
          </MetadataItem>

          <MetadataItem title={domain}>
            <IconGlobe size={14} className="icon" />
            <span className="value">{domain}</span>
          </MetadataItem>
        </MetadataGrid>
        <UrlRow title={snapshot.url || ''}>
          <IconGlobe size={14} className="icon" />
          {hasUrl ? (
            <a href={snapshot.url} target="_blank" rel="noopener noreferrer" className="url-text">
              {snapshot.url}
            </a>
          ) : (
            <span className="muted">No source URL</span>
          )}
          <div className="actions">
            <IconButton onClick={handleCopyUrl} disabled={!hasUrl} aria-label={copied ? 'Copied' : 'Copy URL'} title={copied ? 'Copied' : 'Copy URL'}>
              {copied ? <IconCheck size={14} color="#10b981" /> : <IconCopy size={14} color="#6b7280" />}
            </IconButton>
            <IconButton onClick={handleOpenUrl} disabled={!hasUrl} aria-label="Open URL" title="Open URL">
              <IconExternalLink size={14} color="#6b7280" />
            </IconButton>
          </div>
        </UrlRow>
      </MetadataBar>

      <SnapshotDetails snapshot={snapshot} />
    </ViewerContainer>
  );
};
