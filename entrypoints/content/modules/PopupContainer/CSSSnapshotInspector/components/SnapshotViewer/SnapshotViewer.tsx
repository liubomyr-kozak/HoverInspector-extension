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
  IconX
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  backdrop-filter: blur(8px);
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .icon {
    color: #6366f1;
  }

  .content {
    .label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

/**
 * Modern SnapshotViewer component with enhanced UX
 */
export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ snapshot, onBack }) => {
  const [isCreatingCurrentSnapshot, setIsCreatingCurrentSnapshot] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(snapshot.title);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TitleInput
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <MetadataItem>
            <IconCalendar size={20} className="icon" />
            <div className="content">
              <div className="label">Captured</div>
              <div className="value">
                {date.toLocaleDateString()} at {date.toLocaleTimeString()}
              </div>
            </div>
          </MetadataItem>

          <MetadataItem>
            <IconStack3 size={20} className="icon" />
            <div className="content">
              <div className="label">Elements</div>
              <div className="value">{snapshot.elementCount} items</div>
            </div>
          </MetadataItem>

          <MetadataItem>
            <IconGlobe size={20} className="icon" />
            <div className="content">
              <div className="label">Domain</div>
              <div className="value" title={domain}>{domain}</div>
            </div>
          </MetadataItem>
        </MetadataGrid>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px 16px', 
          background: 'rgba(249, 250, 251, 0.6)', 
          borderRadius: '12px', 
          border: '1px solid rgba(229, 231, 235, 0.5)' 
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
            Source URL
          </div>
          <div style={{ fontSize: '14px', color: '#374151', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {snapshot.url}
          </div>
        </div>
      </MetadataBar>

      <SnapshotDetails snapshot={snapshot} />
    </ViewerContainer>
  );
};
