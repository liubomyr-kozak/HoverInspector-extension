/**
 * Оптимізований компонент заголовка для CSS Snapshot Inspector
 */
import React, { memo } from 'react';
import { IconCamera, IconUpload, IconHistory, IconExclamationCircle } from '@tabler/icons-react';
import { MdOutlineCompare } from 'react-icons/md';
import {
  Header as HeaderContainer,
  Title,
  ButtonsContainer,
  Button,
  SecondaryButton,
} from '../CSSSnapshotInspector.styled';
import { ViewMode } from '../constants';

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
 * Мемоізований компонент заголовка
 */
export const Header = memo<HeaderProps>(({
  viewMode,
  isCapturing,
  compareSnapshotsCount,
  onCapture,
  onImport,
  onCompare,
  onBackToList,
  error,
}) => {
  const handleCapture = async () => {
    try {
      await onCapture();
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
    }
  };

  return (
    <HeaderContainer>
      <Title>CSS Snapshot Inspector</Title>
      
      {error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#d93025',
          fontSize: '14px'
        }}>
          <IconExclamationCircle size={16} />
          {error}
        </div>
      )}
      
      <ButtonsContainer>
        {viewMode === ViewMode.LIST && (
          <>
            <Button 
              onClick={handleCapture} 
              disabled={isCapturing}
              aria-label={isCapturing ? 'Capturing snapshot...' : 'Capture new snapshot'}
            >
              <IconCamera size={16} />
              {isCapturing ? 'Capturing...' : 'Capture Snapshot'}
            </Button>
            <SecondaryButton 
              onClick={onImport}
              aria-label="Import snapshot from file"
            >
              <IconUpload size={16} />
              Import
            </SecondaryButton>
            {compareSnapshotsCount === 2 && (
              <Button 
                onClick={onCompare}
                aria-label="Compare selected snapshots"
              >
                <MdOutlineCompare size={16} />
                Compare
              </Button>
            )}
          </>
        )}
        {(viewMode === ViewMode.DETAIL || viewMode === ViewMode.COMPARE) && (
          <SecondaryButton 
            onClick={onBackToList}
            aria-label="Go back to snapshot list"
          >
            <IconHistory size={16} />
            Back to List
          </SecondaryButton>
        )}
      </ButtonsContainer>
    </HeaderContainer>
  );
});