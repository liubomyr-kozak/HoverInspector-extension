import React from 'react';
import { IconPlayerPlay, IconEdit, IconTrash } from '@tabler/icons-react';
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
  onPlay,
  onEdit,
  onDelete
}) => {
  return (
    <StyledScenarioItem isActive={isActive}>
      <ScenarioTitle>
        {scenario.title}
        {isActive && recording && (
          <span style={{ marginLeft: '8px', color: '#1890ff', fontSize: '12px' }}>
            (Recording Active)
          </span>
        )}
      </ScenarioTitle>
      <ScenarioActions>
        <ActionButton 
          onClick={() => onPlay(id)} 
          title={isActive ? "Active Scenario" : "Set as Active Scenario"}
        >
          <IconPlayerPlay size={18} color={isActive ? "#1890ff" : undefined} />
        </ActionButton>
        <ActionButton onClick={() => onEdit(id)} title="Edit">
          <IconEdit size={18} />
        </ActionButton>
        <ActionButton onClick={() => onDelete(id)} title="Delete">
          <IconTrash size={18} />
        </ActionButton>
      </ScenarioActions>
    </StyledScenarioItem>
  );
};

export default ScenarioItem;