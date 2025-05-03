import React from 'react';
import { Button } from 'antd';
import { IconPlayerStop, IconPlus } from '@tabler/icons-react';
import { RecordingNotificationContainer, RecordingText } from '../styles.ts';

interface RecordingNotificationProps {
  activeScenarioId: string | null;
  scenarioTitle?: string;
  onStopRecording: () => void;
  onAddNewScenario: () => void;
}

/**
 * Component for displaying the recording status notification
 */
const RecordingNotification: React.FC<RecordingNotificationProps> = ({
  activeScenarioId,
  scenarioTitle,
  onStopRecording,
  onAddNewScenario
}) => {
  return (
    <RecordingNotificationContainer>
      <div>
        <RecordingText>Recording Active</RecordingText>
        {activeScenarioId ? (
          <span> - Adding steps to "{scenarioTitle}"</span>
        ) : (
          <span> - No active scenario selected. Steps will be saved to a new scenario.</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          type="primary"
          size="small" 
          onClick={onAddNewScenario}
          icon={<IconPlus size={16} />}
        >
          New Scenario
        </Button>
        <Button 
          danger 
          size="small" 
          onClick={onStopRecording}
          icon={<IconPlayerStop size={16} />}
        >
          Stop Recording
        </Button>
      </div>
    </RecordingNotificationContainer>
  );
};

export default RecordingNotification;