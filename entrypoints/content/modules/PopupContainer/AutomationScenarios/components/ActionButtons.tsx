import React from 'react';
import { IconPlus, IconRecordMail, IconPlayerStop } from '@tabler/icons-react';
import { AddButton, ButtonContainer } from '../styles.ts';

interface ActionButtonsProps {
  recording: boolean;
  onAddScenario: () => void;
  onToggleRecording: () => void;
}

/**
 * Component for rendering the action buttons (Add Scenario and Record)
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  recording,
  onAddScenario,
  onToggleRecording
}) => {
  return (
    <ButtonContainer>
      <AddButton onClick={onAddScenario}>
        <IconPlus size={18} />
        New Scenario
      </AddButton>
      
      <AddButton 
        onClick={onToggleRecording}
        style={{ 
          backgroundColor: recording ? '#ff4d4f' : '#f0f0f0',
          color: recording ? 'white' : '#333'
        }}
      >
        {recording ? (
          <>
            <IconPlayerStop size={18} />
            Stop Recording
          </>
        ) : (
          <>
            <IconRecordMail size={18} />
            Record
          </>
        )}
      </AddButton>
    </ButtonContainer>
  );
};

export default ActionButtons;