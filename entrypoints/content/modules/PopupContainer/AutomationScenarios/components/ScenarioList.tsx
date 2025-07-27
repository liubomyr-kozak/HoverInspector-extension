import React from "react";
import { ExecutionHistoryEntry, ScenarioMap, ScenarioStep, ExecutionStatus } from "../types.ts";
import { EmptyState, ScenarioList as StyledScenarioList } from "../styles.ts";
import { ScenarioItem } from "./ScenarioItem";
import { useSelector } from "react-redux";
import {
  selectExecuting,
  selectScenarios,
  selectActiveScenarioId,
  selectRecording,
  selectCurrentStepIndex,
  selectExecutionStatus,
  selectPaused,
} from "@entrypoints/content/store/automation/automation.slice.ts";

interface ScenarioListProps {
  // Additional props for execution steps display
  executionHistory?: Record<string, ExecutionHistoryEntry>;
  getStepDescription?: (step: ScenarioStep) => string;
}

/**
 * Component for rendering the list of scenarios
 */
const ScenarioList: React.FC<ScenarioListProps> = ({
  // Additional props for execution steps display
  executionHistory = {},
}) => {
  // Access state directly from Redux
  const executing = useSelector(selectExecuting);
  const scenarios = useSelector(selectScenarios);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const recording = useSelector(selectRecording);

  const scenarioKeys = Object.keys(scenarios).sort((a, b) => {
    // Handle cases where scenarios might be undefined or missing title property
    const titleA = scenarios[a]?.title || "";
    const titleB = scenarios[b]?.title || "";
    return titleA.localeCompare(titleB);
  });

  if (scenarioKeys.length === 0) {
    // When recording is active, return an empty list container instead of the "No scenarios found" message
    // This allows new scenarios to appear in the list as they are created during recording
    if (recording) {
      return <StyledScenarioList />;
    }

    return <EmptyState>No scenarios found. Create a new one to get started.</EmptyState>;
  }

  console.log("😂😂😂 ::ScenarioList -> executing", executing);
  console.log("👍👍👍 ::ScenarioList -> scenarioKeys", scenarioKeys);
  console.log("😎😎😎 ::ScenarioList -> executing", executing);

  return (
    <StyledScenarioList>
      {scenarioKeys.map((key) => (
        <ScenarioItem
          key={key}
          id={key}
          scenario={scenarios[key]}
          isExecuting={key === activeScenarioId}
          // Additional props for execution steps display
          currentExecutingScenarioId={activeScenarioId}
          scenarios={scenarios}
          executionHistory={executionHistory}
        />
      ))}
    </StyledScenarioList>
  );
};

export default ScenarioList;
