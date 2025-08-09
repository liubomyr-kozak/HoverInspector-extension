/**
 * Modern Header component with styled-components
 */
import React, { memo } from "react";
import styled from "styled-components";
import { 
  IconCamera, 
  IconUpload, 
  IconHistory, 
  IconExclamationCircle,
  IconSparkles,
  IconAnalyze,
  IconEye
} from "@tabler/icons-react";
import { MdOutlineCompare } from "react-icons/md";
import { ViewMode } from "../constants";

// Styled Components
const HeaderContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

const LogoIcon = styled.div`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
`;

const TitleSection = styled.div`
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
  gap: 12px;
  padding: 16px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 300ms ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  ${props => props.disabled ? `
    background: #f3f4f6;
    color: #9ca3af;
    box-shadow: none;
  ` : `
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #5b5feb, #7c3aed);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
      transform: scale(1.05);
    }
    
    &:active {
      transform: scale(0.95);
    }
  `}
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const CompareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const SelectionIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  color: #3730a3;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);

  div:first-child {
    font-size: 14px;
    font-weight: 600;
  }

  div:last-child {
    font-size: 12px;
    color: #4f46e5;
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface HeaderProps {
  readonly viewMode: ViewMode;
  readonly isCapturing: boolean;
  readonly compareSnapshotsCount: number;
  readonly onCapture: () => Promise<void>;
  readonly onImport: () => void;
  readonly onCompare: () => void;
  readonly onBackToList: () => void;
  readonly error?: string | null;
}

/**
 * Modern Header component with styled-components
 */
export const Header = memo<HeaderProps>(
  ({ viewMode, isCapturing, compareSnapshotsCount, onCapture, onImport, onCompare, onBackToList, error }) => {
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
          return '✨ Visual regression testing made easy';
        case ViewMode.DETAIL:
          return '🔍 Inspect DOM snapshot details';
        default:
          return '⚡ Compare snapshots side by side';
      }
    };

    return (
      <HeaderContainer>
        <HeaderContent>
          <LeftSection>
            <LogoSection>
              <LogoIcon>
                <IconAnalyze size={28} color="white" />
              </LogoIcon>
              <TitleSection>
                <h1>CSS Snapshot Inspector</h1>
                <p>{getSubtitle()}</p>
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
                      <IconCamera size={20} />
                      <span>Capture Snapshot</span>
                      <IconSparkles size={16} />
                    </>
                  )}
                </PrimaryButton>

                <SecondaryButton
                  onClick={onImport}
                  aria-label="Import snapshot from file"
                >
                  <IconUpload size={20} />
                  <span>Import</span>
                </SecondaryButton>

                {compareSnapshotsCount === 2 && (
                  <CompareButton
                    onClick={onCompare}
                    aria-label="Compare selected snapshots"
                  >
                    <MdOutlineCompare size={20} />
                    <span>Compare ({compareSnapshotsCount})</span>
                  </CompareButton>
                )}
                
                {compareSnapshotsCount === 1 && (
                  <SelectionIndicator>
                    <IconEye size={18} />
                    <div>
                      <div>1 selected</div>
                      <div>Select one more to compare</div>
                    </div>
                  </SelectionIndicator>
                )}
              </>
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
