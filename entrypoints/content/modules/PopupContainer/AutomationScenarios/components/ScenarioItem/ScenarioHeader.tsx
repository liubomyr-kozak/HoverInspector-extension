import React from "react";
import ExecutionControls from "./ExecutionControls";
import ScenarioMenu from "./ScenarioMenu";
import { Scenario, ExecutionStatus } from "../../types.ts";
import { ScenarioActions, ScenarioItem as StyledScenarioItem, ScenarioTitle } from "../../styles.ts";
import { useDispatch, useSelector } from "react-redux";
import {
  automationActions,
  selectRecording,
  selectExecuting,
  selectCurrentStepIndex,
  selectExecutionStatus,
  selectActiveScenarioId,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { RobotIcon } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioItem/RobotIcon/RobotIcon.tsx";

interface ScenarioHeaderProps {
  id: string;
  scenario: Scenario;
  isExecuting: boolean;
  isExpanded: boolean;
  toggleExpanded: (e: React.MouseEvent) => void;
  // Additional props for steps control
  stepsLength?: number;
}

/**
 * Component for rendering the header of a scenario item
 */
const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({
  id,
  scenario,
  isExecuting,
  isExpanded,
  toggleExpanded,
  stepsLength = 0,
}) => {
  const dispatch = useDispatch();

  // Access state directly from Redux
  const recording = useSelector(selectRecording);
  const anyExecuting = useSelector(selectExecuting);
  const currentStepIndex = useSelector(selectCurrentStepIndex);
  const executionStatus = useSelector(selectExecutionStatus);
  const activeScenarioId = useSelector(selectActiveScenarioId);

  // Only show execution status if this scenario is the currently active one
  const isActiveScenario = activeScenarioId === id;
  const scenarioExecutionStatus = isActiveScenario ? executionStatus : null;

  const handleTitleClick = () => {
    // If not already expanded, expand this scenario
    if (!isExpanded) {
      dispatch(automationActions.toggleScenarioExpanded(id));
    }
  };

  return (
    <div className="sticky top-[-18px] z-[10] bg-white">
      <StyledScenarioItem isActive={isExecuting}>
        <div className="flex items-center cursor-pointer w-full" onClick={handleTitleClick}>
          <span className="flex items-center justify-center mr-2" aria-label="Scenario" title="Scenario">
            <RobotIcon size={20} status={scenarioExecutionStatus} variant={1} />
          </span>
          <ScenarioTitle onClick={toggleExpanded}>
            {scenario.title}
            {isExecuting && recording && <span className="ml-2 text-blue-500 text-xs">(Recording Active)</span>}

            {/* Display execution status */}
            {scenarioExecutionStatus && (
              <span className="ml-2">
                {scenarioExecutionStatus === ExecutionStatus.SUCCESS && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Success
                  </Tag>
                )}
                {scenarioExecutionStatus === ExecutionStatus.ERROR && (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    Error
                  </Tag>
                )}
                {scenarioExecutionStatus === ExecutionStatus.RUNNING && (
                  <Tag color="processing" icon={<LoadingOutlined />}>
                    Running
                  </Tag>
                )}
                {scenarioExecutionStatus === ExecutionStatus.PAUSED && (
                  <Tag color="warning" icon={<PauseCircleOutlined />}>
                    Paused
                  </Tag>
                )}
                {scenarioExecutionStatus === ExecutionStatus.CANCELLED && (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    Cancelled
                  </Tag>
                )}
                {scenarioExecutionStatus === ExecutionStatus.WARNING && (
                  <Tag color="warning" icon={<WarningOutlined />}>
                    Warning
                  </Tag>
                )}
              </span>
            )}
          </ScenarioTitle>
        </div>

        <ScenarioActions>
          <ExecutionControls currentStepIndex={currentStepIndex} stepsLength={stepsLength} scenarioId={id} />
        </ScenarioActions>

        <ScenarioMenu id={id} anyExecuting={anyExecuting} />
      </StyledScenarioItem>
    </div>
  );
};

export default ScenarioHeader;
