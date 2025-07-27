import React from 'react';
import { IconPlayerPlay, IconEdit, IconTrash, IconPlayerPause } from '@tabler/icons-react';
import { Scenario } from '../types.ts';
import { 
  ScenarioItem as StyledScenarioItem, 
  ScenarioTitle, 
  ScenarioActions, 
  ActionButton 
} from '../styles.ts';

interface ScenarioItemProps {
  id: string;
  scenario: Scenario;
  isActive: boolean;
  recording: boolean;
  anyExecuting: boolean;
  isExecuting: boolean;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Component for rendering an individual scenario item in the list
 */
const ScenarioItem: React.FC<ScenarioItemProps> = ({
  id,
  scenario,
  isActive,
  recording,
  anyExecuting,
  isExecuting,
  onPlay,
  onEdit,
  onDelete
}) => {
  return (
    <StyledScenarioItem isActive={isActive || isExecuting}>
      <ScenarioTitle>
        {scenario.title}
        {isActive && recording && (
          <span style={{ marginLeft: '8px', color: '#1890ff', fontSize: '12px' }}>
            (Recording Active)
          </span>
        )}
        {isExecuting && (
          <span style={{ marginLeft: '8px', color: '#52c41a', fontSize: '12px' }}>
            (Executing)
          </span>
        )}
      </ScenarioTitle>
      <ScenarioActions>
        <ActionButton 
          onClick={() => onPlay(id)} 
          title={isExecuting ? "Executing..." : isActive ? "Active Scenario" : "Execute Scenario"}
          disabled={anyExecuting && !isExecuting}
          style={{ opacity: anyExecuting && !isExecuting ? 0.5 : 1 }}
        >
          {isExecuting ? (
            <IconPlayerPause size={18} color="#52c41a" />
          ) : (
            <IconPlayerPlay size={18} color={isActive ? "#1890ff" : undefined} />
          )}
        </ActionButton>
        <ActionButton 
          onClick={() => onEdit(id)} 
          title="Edit"
          disabled={anyExecuting}
          style={{ opacity: anyExecuting ? 0.5 : 1 }}
        >
          <IconEdit size={18} />
        </ActionButton>
        <ActionButton 
          onClick={() => onDelete(id)} 
          title="Delete"
          disabled={anyExecuting}
          style={{ opacity: anyExecuting ? 0.5 : 1 }}
        >
          <IconTrash size={18} />
        </ActionButton>
      </ScenarioActions>
    </StyledScenarioItem>
  );
};

export default ScenarioItem;