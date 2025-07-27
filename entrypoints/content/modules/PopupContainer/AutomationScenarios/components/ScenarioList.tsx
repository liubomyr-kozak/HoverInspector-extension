import React from 'react';
import { ScenarioMap } from '../types.ts';
import { ScenarioList as StyledScenarioList, EmptyState } from '../styles.ts';
import ScenarioItem from './ScenarioItem.tsx';

interface ScenarioListProps {
  scenarios: ScenarioMap;
  activeScenarioId: string | null;
  recording: boolean;
  executing: boolean;
  executingScenarioId: string | null;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Component for rendering the list of scenarios
 */
const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  activeScenarioId,
  recording,
  executing,
  executingScenarioId,
  onPlay,
  onEdit,
  onDelete
}) => {
  // Sort scenario keys alphabetically by scenario title
  const scenarioKeys = Object.keys(scenarios).sort((a, b) => 
    scenarios[a].title.localeCompare(scenarios[b].title)
  );

  if (scenarioKeys.length === 0) {
    // When recording is active, return an empty list container instead of the "No scenarios found" message
    // This allows new scenarios to appear in the list as they are created during recording
    if (recording) {
      return <StyledScenarioList></StyledScenarioList>;
    }
    
    return (
      <EmptyState>
        No scenarios found. Create a new one to get started.
      </EmptyState>
    );
  }

  return (
    <StyledScenarioList>
      {scenarioKeys.map(key => (
        <ScenarioItem
          key={key}
          id={key}
          scenario={scenarios[key]}
          isActive={key === activeScenarioId}
          recording={recording}
          anyExecuting={executing}
          isExecuting={key === executingScenarioId}
          onPlay={onPlay}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </StyledScenarioList>
  );
};

export default ScenarioList;