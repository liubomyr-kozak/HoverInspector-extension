import React from "react";
import { useDispatch } from "react-redux";
import { automationActions } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerTrackNext,
  IconPlayerSkipForward,
  IconPlayerStop,
} from "@tabler/icons-react";
import { PauseResumeButton, NextStepButton, ContinueButton, StopButton } from "../../styles.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

interface ExecutionControlsProps {
  paused: boolean;
  currentStepIndex: number;
  stepsLength: number;
}

/**
 * Component for rendering execution control buttons
 */
const ExecutionControls: React.FC<ExecutionControlsProps> = ({ paused, currentStepIndex, stepsLength }) => {
  const dispatch = useDispatch();

  return (
    <div className="flex flex-wrap gap-1 justify-center w-full max-w-[400px] mx-auto">
      {/* Pause/Resume Button - Primary action */}
      <Tooltip title={paused ? "Resume Execution" : "Pause Execution"}>
        <PauseResumeButton
          paused={paused}
          onClick={() => {
            dispatch(automationActions.setPaused(!paused));
          }}
        >
          {paused ? <IconPlayerPlay size={14} color="white" /> : <IconPlayerPause size={14} color="white" />}
        </PauseResumeButton>
      </Tooltip>

      {/* Next Step Button */}
      <Tooltip title="Go to Next Step">
        <NextStepButton
          onClick={() => {
            dispatch(automationActions.setCurrentStepIndex(currentStepIndex + 1));
            dispatch(automationActions.setPaused(true));
          }}
          disabled={currentStepIndex >= stepsLength - 1}
        >
          <IconPlayerTrackNext size={14} color={currentStepIndex >= stepsLength - 1 ? "#bfbfbf" : "white"} />
        </NextStepButton>
      </Tooltip>

      {/* Continue Execution Button */}
      <Tooltip title="Continue Execution">
        <ContinueButton
          onClick={() => {
            dispatch(automationActions.setPaused(false));
          }}
          disabled={currentStepIndex >= stepsLength - 1}
        >
          <IconPlayerSkipForward size={14} color={currentStepIndex >= stepsLength - 1 ? "#bfbfbf" : "white"} />
        </ContinueButton>
      </Tooltip>

      {/* Stop Button */}
      <Tooltip title="Stop Execution">
        <StopButton
          onClick={() => {
            // Signal to stop execution
            dispatch(automationActions.setShouldStop(true));
            // Then reset the execution state in Redux
            dispatch(automationActions.resetExecutionState());
          }}
        >
          <IconPlayerStop size={14} color="white" />
        </StopButton>
      </Tooltip>
    </div>
  );
};

export default ExecutionControls;
