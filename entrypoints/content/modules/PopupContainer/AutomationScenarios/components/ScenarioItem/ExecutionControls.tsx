import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  automationActions,
  selectExecutionStatus,
  selectActiveScenarioId,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext, IconPlayerStop } from "@tabler/icons-react";
import { PauseResumeButton, NextStepButton, StopButton, PlayButton } from "../../styles.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { ExecutionStatus } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types.ts";
import { useScenarioActions } from "../../hooks/useScenarioActions";
import { clearExecutionSession } from "../../utils/executionSession.ts";

interface ExecutionControlsProps {
  currentStepIndex: number;
  stepsLength: number;
  scenarioId: string;
}

/**
 * Component for rendering execution control buttons
 */
const ExecutionControls: React.FC<ExecutionControlsProps> = ({ currentStepIndex, stepsLength, scenarioId }) => {
  const dispatch = useDispatch();
  const executionStatus = useSelector(selectExecutionStatus);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const { playScenario, runSingleStep } = useScenarioActions();

  // Only show execution controls if this scenario is the currently active one
  const isActiveScenario = activeScenarioId === scenarioId;
  const scenarioExecutionStatus = isActiveScenario ? executionStatus : null;

  // Determine which buttons to show based on execution status
  const showPlayOnly =
    scenarioExecutionStatus === ExecutionStatus.SUCCESS ||
    scenarioExecutionStatus === ExecutionStatus.CANCELLED ||
    scenarioExecutionStatus === null;

  const showPauseAndStop =
    scenarioExecutionStatus === ExecutionStatus.RUNNING || scenarioExecutionStatus === ExecutionStatus.PENDING;

  const showResumeAndStop =
    scenarioExecutionStatus === ExecutionStatus.PAUSED ||
    scenarioExecutionStatus === ExecutionStatus.ERROR ||
    scenarioExecutionStatus === ExecutionStatus.WARNING;

  return (
    <div className="flex flex-wrap gap-1 justify-center w-full max-w-[400px] mx-auto">
      {/* Show play button only for completed/cancelled states */}
      {showPlayOnly && (
        <Tooltip title="Play Scenario">
          <PlayButton
            onClick={() => {
              playScenario(scenarioId);
            }}
          >
            <IconPlayerPlay size={18} color="#1890ff" />
          </PlayButton>
        </Tooltip>
      )}

      {/* Show pause button when running */}
      {showPauseAndStop && (
        <Tooltip title="Pause Execution">
          <PauseResumeButton
            paused={false}
            onClick={() => {
              dispatch(automationActions.setExecutionStatus(ExecutionStatus.PAUSED));
              dispatch(automationActions.setPaused(true));
            }}
          >
            <IconPlayerPause size={14} color="white" />
          </PauseResumeButton>
        </Tooltip>
      )}

      {/* Show resume button when paused/error */}
      {showResumeAndStop && (
        <Tooltip title="Resume Execution">
          <PauseResumeButton
            paused={true}
            onClick={() => {
              dispatch(automationActions.setPaused(false));
              dispatch(automationActions.setExecutionStatus(ExecutionStatus.RUNNING));
            }}
          >
            <IconPlayerPlay size={14} color="white" />
          </PauseResumeButton>
        </Tooltip>
      )}

      {/* Next Step Button - shown when paused/error for debugging */}
      {showResumeAndStop && (
        <Tooltip title="Go to Next Step">
          <NextStepButton
            onClick={() => {
              // Execute the next step using runSingleStep instead of just advancing the index
              runSingleStep(scenarioId, currentStepIndex + 1);
            }}
            disabled={currentStepIndex >= stepsLength - 1}
          >
            <IconPlayerTrackNext size={14} color={currentStepIndex >= stepsLength - 1 ? "#bfbfbf" : "white"} />
          </NextStepButton>
        </Tooltip>
      )}

      {/* Stop Button - shown when running, paused, or error */}
      {(showPauseAndStop || showResumeAndStop) && (
        <Tooltip title="Stop Execution">
          <StopButton
            onClick={() => {
              // Don't continue the scenario on the next page load
              clearExecutionSession();

              // First signal to stop execution, then reset state
              dispatch(automationActions.setShouldStop(true));
              dispatch(automationActions.setExecutionStatus(ExecutionStatus.CANCELLED));
              // Small delay to allow saga to handle the stop signal
              setTimeout(() => {
                dispatch(automationActions.resetExecutionState());
              }, 100);
            }}
          >
            <IconPlayerStop size={14} color="white" />
          </StopButton>
        </Tooltip>
      )}
    </div>
  );
};

export default ExecutionControls;
