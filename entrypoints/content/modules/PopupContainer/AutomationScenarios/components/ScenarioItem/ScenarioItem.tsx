import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./highlight.css";
import {
  automationActions,
  selectIsScenarioExpanded,
  selectCurrentSteps,
  selectStepStatuses,
  selectExecuting,
  selectCurrentStepIndex,
  selectExecutionStatus,
  selectPaused,
  selectSearchedStepIndex,
  selectExecutionSpeed,
  selectIsEditingScenario,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { AnimatedStepIcon, getStepColor } from "../../utils/stepIcons";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { getStepDescription } from "../../utils/stepExecutor.saga";
import { Progress, Button } from "antd";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  StopOutlined,
  EditOutlined,
  PlayCircleOutlined,
  StepForwardOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  AimOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";

import { Scenario, ScenarioStep, ExecutionStatus, ExecutionHistoryEntry, StepType } from "../../types.ts";
import ScenarioHeader from "./ScenarioHeader";
import StepEditForm from "../StepEditForm";
import SpeedControlButton from "./SpeedControlButton";
import { useScenarioActions } from "../../hooks/useScenarioActions";
import { saveScenarioWatcher } from "@entrypoints/content/store/automation/automation.saga.action.ts";
import {
  ExpandedContent,
  ProgressContainer,
  ProgressHeader,
  ProgressText,
  StepsHeading,
  StepsHeadingText,
  StepCount,
  StepsList,
  StepItem,
  StepHeader,
  StepInfo,
  StepNumber,
  StepIconWrapper,
  StepDescription,
  StepActions,
  StepValueContainer,
  StepValueLabel,
  StepXPathContainer,
  StepXPathLabel,
  StepDetails,
  StepErrorContainer,
  StepWarning,
  EditingStepItem,
  EditingStepHeader,
  EditingStepTitle,
  StatusTag,
  EmptyStatusIcon,
  StepInsertContainer,
  StepItemWrapper,
  StepInsertButton,
} from "./ScenarioItem.styled";
import { PiPlayDuotone } from "react-icons/pi";

interface ScenarioItemProps {
  id: string;
  scenario: Scenario;
  isExecuting: boolean;
  // Additional props for execution steps display
  currentExecutingScenarioId?: string | null;
  scenarios?: Record<string, Scenario>;
  executionHistory?: Record<string, ExecutionHistoryEntry>;
}

/**
 * Component for rendering an individual scenario item in the list
 */
export const ScenarioItem: React.FC<ScenarioItemProps> = ({
  id,
  scenario,
  isExecuting,
  // New props for execution steps display
  currentExecutingScenarioId,
  scenarios = {},
  executionHistory = {},
}) => {
  const { playScenario, runSingleStep } = useScenarioActions();
  const dispatch = useDispatch();
  const highlightManager = useHighlightOverlay();
  const isExpanded = useSelector(selectIsScenarioExpanded(id));
  const currentSteps = useSelector(selectCurrentSteps);
  const stepStatuses = useSelector(selectStepStatuses);

  // Access state directly from Redux
  const currentStepIndex = useSelector(selectCurrentStepIndex);
  const executing = useSelector(selectExecuting);
  const paused = useSelector(selectPaused);
  const searchedStepIndex = useSelector(selectSearchedStepIndex);
  const executionSpeed = useSelector(selectExecutionSpeed);
  const isEditingScenario = useSelector(selectIsEditingScenario);

  // State for step editing
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Speed control handler
  const handleSpeedChange = (value: number) => {
    dispatch(automationActions.setExecutionSpeed(value));

    // Save the execution speed with the scenario
    const updatedScenario = {
      ...scenario,
      executionSpeed: value,
    };
    dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));
  };

  // Handler for opening the step edit form
  const handleEditStep = (index: number) => {
    // Set the active scenario and load its steps if not already active
    if (!isExecuting) {
      dispatch(automationActions.setActiveScenarioId(id));
      dispatch(automationActions.setCurrentSteps(scenario.data));
    }

    setEditingStepIndex(index);
  };

  // Handler for closing the step edit form
  const handleCloseStepEditForm = () => {
    // Use setTimeout to ensure the DOM has time to update before changing state
    // This helps with CSS hover effects being properly applied after cancellation
    setTimeout(() => {
      setEditingStepIndex(null);
    }, 0);
  };

  const handleSaveStep = (updatedStep: ScenarioStep) => {
    if (editingStepIndex !== null) {
      // Get the current steps from the Redux store
      const steps = [...currentSteps];

      // Create a new step with the provided values
      const newStep: ScenarioStep = {
        type: updatedStep.type,
        ...(updatedStep.xpath !== undefined && { xpath: updatedStep.xpath }),
        ...(updatedStep.value !== undefined && { value: updatedStep.value }),
      };

      // Replace the empty step at the editing index with the new step
      steps[editingStepIndex] = newStep;

      // Update the current steps in the Redux store
      dispatch(automationActions.setCurrentSteps(steps));

      // Save the updated scenario to localStorage
      const updatedScenario = {
        ...scenario,
        data: steps,
      };

      // Dispatch the saveScenarioWatcher saga to save the updated scenario
      dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));

      // Close the step edit form
      handleCloseStepEditForm();
    }
  };

  // Handler for deleting a step
  const handleDeleteStep = () => {
    if (editingStepIndex !== null) {
      // Get the current steps from the Redux store
      const steps = [...currentSteps];

      // Remove the step at the editing index
      steps.splice(editingStepIndex, 1);

      // Update the current steps in the Redux store
      dispatch(automationActions.setCurrentSteps(steps));

      // Save the updated scenario to localStorage
      const updatedScenario = {
        ...scenario,
        data: steps,
      };

      // Dispatch the saveScenarioWatcher saga to save the updated scenario
      dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));

      // Close the step edit form
      handleCloseStepEditForm();
    }
  };

  // Handler for moving a step up
  const handleMoveStepUp = (stepIndex: number) => {
    if (stepIndex > 0) {
      // Get the current steps from the Redux store
      const steps = [...currentSteps];
      
      // Swap the step with the previous one
      [steps[stepIndex - 1], steps[stepIndex]] = [steps[stepIndex], steps[stepIndex - 1]];

      // Update the current steps in the Redux store
      dispatch(automationActions.setCurrentSteps(steps));

      // Save the updated scenario to localStorage
      const updatedScenario = {
        ...scenario,
        data: steps,
      };

      // Dispatch the saveScenarioWatcher saga to save the updated scenario
      dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));
    }
  };

  // Handler for moving a step down
  const handleMoveStepDown = (stepIndex: number) => {
    if (stepIndex < currentSteps.length - 1) {
      // Get the current steps from the Redux store
      const steps = [...currentSteps];
      
      // Swap the step with the next one
      [steps[stepIndex], steps[stepIndex + 1]] = [steps[stepIndex + 1], steps[stepIndex]];

      // Update the current steps in the Redux store
      dispatch(automationActions.setCurrentSteps(steps));

      // Save the updated scenario to localStorage
      const updatedScenario = {
        ...scenario,
        data: steps,
      };

      // Dispatch the saveScenarioWatcher saga to save the updated scenario
      dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));
    }
  };
  // Handler for inserting a new step at a specific index
  const handleInsertStep = (index: number) => {
    // Set the active scenario and load its steps if not already active
    if (!isExecuting) {
      dispatch(automationActions.setActiveScenarioId(id));
      dispatch(automationActions.setCurrentSteps(scenario.data));
    }

    // Insert a new step at the specified index
    dispatch(automationActions.insertStep(index));

    // Start editing the newly inserted step
    setEditingStepIndex(index);
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(automationActions.toggleScenarioExpanded(id));
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case ExecutionStatus.ERROR:
        return <CloseCircleOutlined style={{ color: "#f5222d" }} />;
      case ExecutionStatus.WARNING:
        return <WarningOutlined style={{ color: "#faad14" }} />;
      case ExecutionStatus.RUNNING:
        return <LoadingOutlined style={{ color: "#1890ff" }} />;
      case ExecutionStatus.PAUSED:
        return <PauseCircleOutlined style={{ color: "#722ed1" }} />;
      case ExecutionStatus.CANCELLED:
        return <StopOutlined style={{ color: "#fa8c16" }} />;
      case ExecutionStatus.SKIPPED:
        return <MinusCircleOutlined style={{ color: "#8c8c8c" }} />;
      default:
        return <EmptyStatusIcon />;
    }
  };

  // Define steps with metadata for display
  const steps =
    currentExecutingScenarioId && scenarios[currentExecutingScenarioId] && isExecuting
      ? scenarios[currentExecutingScenarioId].repeat > 1
        ? Array(scenarios[currentExecutingScenarioId].repeat)
            .fill(null)
            .flatMap((_, repeatIndex) =>
              scenarios[currentExecutingScenarioId].data.map((step, stepIndex) => ({
                ...step,
                _repeatIndex: repeatIndex,
                _originalIndex: stepIndex,
                _displayIndex: repeatIndex * scenarios[currentExecutingScenarioId].data.length + stepIndex,
              })),
            )
        : scenarios[currentExecutingScenarioId].data.map((step, index) => ({
            ...step,
            _repeatIndex: 0,
            _originalIndex: index,
            _displayIndex: index,
          }))
      : scenario.data.map((step, index) => ({
          ...step,
          _repeatIndex: 0,
          _originalIndex: index,
          _displayIndex: index,
        }));

  return (
    <div>
      <ScenarioHeader
        id={id}
        scenario={scenario}
        isExecuting={isExecuting}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
        stepsLength={steps.length}
      />

      {/* Expanded content - show steps */}
      {isExpanded && (
        <>
          {isExecuting && (
            <Progress
              percent={Math.round((Math.max(0, currentStepIndex + 1) / Math.max(1, steps.length)) * 100)}
              size="small"
              className="flex"
              status={paused ? "exception" : "active"}
              showInfo={false}
              style={{
                height: "9px",
              }}
            />
          )}
          <ExpandedContent>
            <StepsHeading>
              <StepsHeadingText>Steps</StepsHeadingText>
              <StepCount>
                {currentStepIndex >= 0 ? currentStepIndex + 1 : 0} / {steps.length} steps
                {scenario.data.length === 1 ? "step" : "steps"}
              </StepCount>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SpeedControlButton initialSpeed={executionSpeed} onSpeedChange={handleSpeedChange} />
              </div>
            </StepsHeading>
            {/* Steps list */}
            <StepsList>
              {steps.map((step: any, index: number) => {
                const displayIndex = step._displayIndex;
                const originalIndex = step._originalIndex;
                const totalSteps =
                  currentExecutingScenarioId && scenarios[currentExecutingScenarioId]
                    ? scenarios[currentExecutingScenarioId].data.length *
                      Math.max(1, scenarios[currentExecutingScenarioId].repeat)
                    : scenario.data.length;

                // Get step status from Redux
                let status = ExecutionStatus.PENDING;
                let statusIcon = <EmptyStatusIcon />;
                let stepDetails = "";
                let executionError = "";
                let logEntry: any = null;

                // Get status from Redux stepStatuses
                if (stepStatuses && stepStatuses[displayIndex] !== undefined) {
                  status = stepStatuses[displayIndex];
                  statusIcon = getStatusIcon(status);
                }

                // Check execution history for additional details
                const currentExecution = currentExecutingScenarioId
                  ? Object.values(executionHistory || {}).find(
                      (entry) =>
                        entry.scenarioId === currentExecutingScenarioId &&
                        (entry.status === ExecutionStatus.RUNNING || entry.status === ExecutionStatus.PAUSED),
                    )
                  : null;

                logEntry = currentExecution?.log?.entries?.find((entry) => entry.stepIndex === displayIndex);

                if (logEntry) {
                  stepDetails = logEntry.details || "";
                  executionError = logEntry.error || "";
                }

                // Get step description
                const stepDescription = getStepDescription(step);

                // Get step color from the new utility
                const stepColor = getStepColor(step.type);

                // Check if this is the current executing step
                const isCurrentStep = displayIndex === currentStepIndex;
                const isRunningStep = status === ExecutionStatus.RUNNING;

                // Determine text status
                let textStatus = "";
                if (status === ExecutionStatus.SUCCESS) {
                  textStatus = "успішно";
                } else if (status === ExecutionStatus.ERROR) {
                  textStatus = "помилка";
                } else if (status === ExecutionStatus.RUNNING) {
                  textStatus = "виконується";
                } else if (status === ExecutionStatus.PAUSED) {
                  textStatus = "пауза";
                } else if (status === ExecutionStatus.SKIPPED) {
                  textStatus = "пропущено";
                }

                // Check if this step is being edited
                const isEditing = editingStepIndex === originalIndex;

                // If the step is being edited, show the edit form instead of the step view
                if (isEditing) {
                  return (
                    <EditingStepItem key={`editing-${index}`}>
                      <EditingStepHeader>
                        <EditingStepTitle>Edit Step {displayIndex + 1}</EditingStepTitle>
                      </EditingStepHeader>
                      <StepEditForm
                        step={currentSteps[originalIndex]}
                        visible={true}
                        onClose={handleCloseStepEditForm}
                        onSave={handleSaveStep}
                        onDelete={handleDeleteStep}
                        onMoveUp={isEditingScenario ? handleMoveStepUp : undefined}
                        onMoveDown={isEditingScenario ? handleMoveStepDown : undefined}
                        stepIndex={originalIndex}
                        totalSteps={scenario.data.length}
                      />
                    </EditingStepItem>
                  );
                }


                // Otherwise, show the normal step view with insert button
                return (
                  <React.Fragment key={`step-fragment-${index}`}>
                    <StepInsertContainer key={`insert-before-${index}`}>
                      <div
                        className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-pointer shadow-md opacity-0 transform -translate-y-3 hover:opacity-100 hover:bg-blue-400 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-300 active:opacity-100 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertStep(originalIndex);
                        }}
                      >
                        <PlusOutlined />
                      </div>
                    </StepInsertContainer>
                    <StepItemWrapper key={`step-wrapper-${index}`}>
                      <StepItem
                        id={`step-${id}-${displayIndex}`}
                        isActive={displayIndex === currentStepIndex}
                        isSearched={displayIndex === searchedStepIndex}
                        borderColor={stepColor}
                      >
                        <StepHeader>
                          <StepInfo>
                            <StepNumber>{displayIndex + 1}</StepNumber>
                            <StepIconWrapper>
                              <AnimatedStepIcon
                                step={step}
                                size={16}
                                isActive={isCurrentStep}
                                isPulsing={isRunningStep}
                              />
                            </StepIconWrapper>
                            <StepDescription color={stepColor}>{stepDescription}</StepDescription>
                            <span>{statusIcon}</span>
                            {displayIndex === currentStepIndex && paused && (
                              <StatusTag color="orange">Paused</StatusTag>
                            )}
                            {status === ExecutionStatus.SUCCESS && <StatusTag color="success">Completed</StatusTag>}
                            {status === ExecutionStatus.ERROR && <StatusTag color="error">Failed</StatusTag>}
                            {status === ExecutionStatus.WARNING && <StatusTag color="warning">Warning</StatusTag>}
                            {status === ExecutionStatus.SKIPPED && <StatusTag color="default">Skipped</StatusTag>}
                          </StepInfo>

                          {/* Step action buttons */}
                          <StepActions className="flex items-center gap-1">
                            {/*<StepActions className="flex items-center gap-1 rounded-md bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm px-1 py-0.5 shadow-sm">*/}
                            <Tooltip title="Continue from this step">
                              <Button
                                type="text"
                                size="small"
                                className="step-action-btn !p-0.5 !h-6 w-6 flex items-center justify-center rounded-md
                                text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300
                                dark:hover:text-white dark:hover:bg-slate-700 focus-visible:outline-none
                                focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 transition-colors
                                !bg-slate-50 dark:!bg-slate-800"
                                icon={<PiPlayDuotone size="13px" />}
                                onClick={(e) => {

                                  e.stopPropagation();

                                  // Check if scenario is currently paused and executing
                                  if (executing && paused && currentExecutingScenarioId === id) {
                                    // Resume execution from current step instead of stopping
                                    dispatch(automationActions.setPaused(false));
                                    dispatch(automationActions.setExecutionStatus(ExecutionStatus.RUNNING));
                                    // Continue from the selected step
                                    dispatch(automationActions.setCurrentStepIndex(originalIndex - 1));
                                  } else {
                                    // Normal scenario start from specific step
                                    playScenario(id, originalIndex);
                                  }
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Run only this step">
                              <Button
                                type="text"
                                size="small"
                                className="step-action-btn !p-0.5 !h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 transition-colors !bg-slate-50 dark:!bg-slate-800"
                                icon={<StepForwardOutlined />}
                                onClick={(e) => {

                                  e.stopPropagation();
                                  runSingleStep(id, originalIndex);
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Edit this step">
                              <Button
                                type="text"
                                size="small"
                                className="step-action-btn !p-0.5 !h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 transition-colors !bg-slate-50 dark:!bg-slate-800"
                                icon={<EditOutlined />}
                                onClick={(e) => {

                                  e.stopPropagation();
                                  handleEditStep(originalIndex);
                                }}
                              />
                            </Tooltip>
                          </StepActions>
                        </StepHeader>

                        {step.xpath && (
                          <StepXPathContainer>
                            <StepXPathLabel>XPath:</StepXPathLabel>
                            {step.xpath}

                            {step.xpath && (
                              <div className="ml-auto border-l-[1px]" style={{ borderLeftColor: "rgb(219 219 219)" }}>
                                <Tooltip title="Find element in page">
                                  <Button
                                    type="text"
                                    size="small"
                                    style={{ color: "#1890ff", marginLeft: "3px" }}
                                    icon={<AimOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      highlightManager.startHighlight(step.xpath);
                                      // Scroll into view for convenience
                                      try {
                                        const r = document.evaluate(
                                          step.xpath,
                                          document,
                                          null,
                                          XPathResult.FIRST_ORDERED_NODE_TYPE,
                                          null,
                                        );
                                        (r.singleNodeValue as HTMLElement | null)?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "center",
                                        });
                                      } catch {}
                                    }}
                                  />
                                </Tooltip>
                              </div>
                            )}
                          </StepXPathContainer>
                        )}

                        {![StepType.NAVIGATE, StepType.REDIRECT].includes(step.type) && step.value && (
                          <StepValueContainer>
                            <StepValueLabel>Value:</StepValueLabel>
                            {step.value}
                          </StepValueContainer>
                        )}

                        {stepDetails && <StepDetails>{stepDetails}</StepDetails>}

                        {/* Display execution error if available */}
                        {executionError && (
                          <StepErrorContainer>
                            <strong>Помилка:</strong> {executionError}
                          </StepErrorContainer>
                        )}

                        {logEntry?.warning && <StepWarning>Warning: {logEntry.warning}</StepWarning>}
                      </StepItem>
                    </StepItemWrapper>
                  </React.Fragment>
                );
              })}
              {/* Insert button after the last step */}
              {steps.length > 0 && (
                <StepInsertContainer key="insert-last">
                  <StepInsertButton
                    onClick={(e) => {
                      e.stopPropagation();
                      const lastStep = steps[steps.length - 1];
                      handleInsertStep(lastStep._originalIndex + 1);
                    }}
                  >
                    <PlusOutlined />
                  </StepInsertButton>
                </StepInsertContainer>
              )}
            </StepsList>
          </ExpandedContent>
        </>
      )}
    </div>
  );
};
