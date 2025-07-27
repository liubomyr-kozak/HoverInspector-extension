import React from "react";
import { IconBolt, IconChevronDown, IconChevronRight, IconPlayerPlay } from "@tabler/icons-react";
import ExecutionControls from "./ExecutionControls";
import ScenarioMenu from "./ScenarioMenu";
import { Scenario, ExecutionStatus } from "../../types.ts";
import {
  ScenarioActions,
  ScenarioItem as StyledScenarioItem,
  ScenarioTitle,
  PlayButton,
  ActionButton,
  MenuButton,
} from "../../styles.ts";
import { useDispatch, useSelector } from "react-redux";
import {
  automationActions,
  selectRecording,
  selectExecuting,
  selectPaused,
  selectCurrentStepIndex,
  selectExecutionStatus,
  selectExecutionSpeed,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { Popover, Tag } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { useScenarioActions } from "../../hooks/useScenarioActions";
import { saveScenarioWatcher } from "@entrypoints/content/store/automation/automation.saga.action.ts";

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
  const { playScenario } = useScenarioActions();
  const dispatch = useDispatch();

  // Access state directly from Redux
  const recording = useSelector(selectRecording);
  const anyExecuting = useSelector(selectExecuting);
  const paused = useSelector(selectPaused);
  const currentStepIndex = useSelector(selectCurrentStepIndex);
  const executionStatus = useSelector(selectExecutionStatus);

  const handleTitleClick = () => {
    // If not already expanded, expand this scenario
    if (!isExpanded) {
      dispatch(automationActions.toggleScenarioExpanded(id));
    }

    // If this is the currently executing scenario, set keepScenarioExpanded to true
    if (isExecuting) {
      dispatch(automationActions.setKeepScenarioExpanded(true));
    }
  };

  const executionSpeed = useSelector(selectExecutionSpeed);

  const handleSpeedChange = (value: number) => {
    console.log("ExecutionControls: Setting execution speed to", value);
    dispatch(automationActions.setExecutionSpeed(value));

    // Save the execution speed with the scenario
    const updatedScenario = {
      ...scenario,
      executionSpeed: value,
    };
    dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));
  };

  return (
    <div>
      <StyledScenarioItem isActive={isExecuting}>
        <ActionButton
          onClick={toggleExpanded}
          title={isExpanded ? "Collapse" : "Expand"}
          style={{ marginRight: "8px" }}
        >
          {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        </ActionButton>
        <div className="flex items-center cursor-pointer w-full" onClick={handleTitleClick}>
          <ScenarioTitle onClick={toggleExpanded}>
            {scenario.title}
            {isExecuting && recording && <span className="ml-2 text-blue-500 text-xs">(Recording Active)</span>}

            {/* Display execution status */}
            {executionStatus && (
              <span className="ml-2">
                {executionStatus === ExecutionStatus.SUCCESS && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Success
                  </Tag>
                )}
                {executionStatus === ExecutionStatus.ERROR && (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    Error
                  </Tag>
                )}
                {executionStatus === ExecutionStatus.RUNNING && (
                  <Tag color="processing" icon={<LoadingOutlined />}>
                    Running
                  </Tag>
                )}
                {executionStatus === ExecutionStatus.PAUSED && (
                  <Tag color="warning" icon={<PauseCircleOutlined />}>
                    Paused
                  </Tag>
                )}
                {executionStatus === ExecutionStatus.CANCELLED && (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    Cancelled
                  </Tag>
                )}
                {executionStatus === ExecutionStatus.WARNING && (
                  <Tag color="warning" icon={<WarningOutlined />}>
                    Warning
                  </Tag>
                )}
              </span>
            )}
          </ScenarioTitle>
        </div>

        <ScenarioActions>
          {!isExecuting && (
            <Tooltip title="Play Scenario">
              <PlayButton onClick={() => playScenario(id)}>
                <IconPlayerPlay size={18} color={"#1890ff"} />
              </PlayButton>
            </Tooltip>
          )}
          {/* Speed Control Button */}
          <Popover
            content={
              <div className="flex flex-col gap-2">
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeedChange(0.5);
                  }}
                >
                  <span>Slow</span>
                </button>
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeedChange(1);
                  }}
                >
                  <span>Medium (Reply Speed)</span>
                </button>
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeedChange(2.0);
                  }}
                >
                  <span>Fast (Bot Speed)</span>
                </button>
              </div>
            }
            getPopupContainer={() =>
              // @ts-ignore
              (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
            }
            trigger="click"
            placement="topRight"
            title="Running Speed"
          >
            <MenuButton className="flex items-center" title={`Running Speed: ${executionSpeed}x`}>
              <IconBolt size={14} color="#faad14" />
              <span className="ml-1 text-xs">{executionSpeed}x</span>
            </MenuButton>
          </Popover>

          {isExecuting && (
            <ExecutionControls paused={paused} currentStepIndex={currentStepIndex} stepsLength={stepsLength} />
          )}
        </ScenarioActions>

        <ScenarioMenu id={id} anyExecuting={anyExecuting} />
      </StyledScenarioItem>
    </div>
  );
};

export default ScenarioHeader;
