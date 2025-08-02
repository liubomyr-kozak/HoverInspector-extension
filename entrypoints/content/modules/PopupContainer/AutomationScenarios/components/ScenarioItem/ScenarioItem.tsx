import React, { useState, useEffect } from "react";
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
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { AnimatedStepIcon, getStepColor } from "../../utils/stepIcons";
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
  SearchOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";

import { Scenario, ScenarioStep, ExecutionStatus, ExecutionHistoryEntry } from "../../types.ts";
import ScenarioHeader from "./ScenarioHeader";
import StepEditForm from "../StepEditForm";
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
  StepStatusContainer,
  StepStatusHeader,
  StepStatusText,
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
  StepInsertButton,
  StepItemWrapper,
} from "./ScenarioItem.styled";

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
  const { playScenario } = useScenarioActions();
  const dispatch = useDispatch();
  const isExpanded = useSelector(selectIsScenarioExpanded(id));
  const currentSteps = useSelector(selectCurrentSteps);
  const stepStatuses = useSelector(selectStepStatuses);

  // Access state directly from Redux
  const currentStepIndex = useSelector(selectCurrentStepIndex);
  const executionStatus = useSelector(selectExecutionStatus);
  const executing = useSelector(selectExecuting);
  const paused = useSelector(selectPaused);
  const searchedStepIndex = useSelector(selectSearchedStepIndex);

  // Helper function to find DOM elements by XPath
  const getElementByXPath = (xpath: string): HTMLElement | null => {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue as HTMLElement;
    } catch (error) {
      console.error("Error evaluating XPath:", error);
      return null;
    }
  };

  // Helper function to flash an element to make it more noticeable
  const flashElement = (element: HTMLElement) => {
    // Add a CSS class for the flash effect
    element.classList.add("xpath-highlight-flash");

    // Remove the flash effect after animation completes
    setTimeout(() => {
      element.classList.remove("xpath-highlight-flash");
    }, 1500);
  };

  // console.log("😂😂😂 ::ScenarioItem -> executionStatus", executionStatus);
  // console.log("🌟🌟🌟 ::ScenarioItem -> stepStatuses", stepStatuses);

  // State for step editing
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

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
    // if (editingStepIndex !== null) {
    //   dispatch(
    //     automationActions.updateStep({
    //       index: editingStepIndex,
    //       field: "type",
    //       value: updatedStep.type,
    //     }),
    //   );
    //
    //   if (updatedStep.xpath !== undefined) {
    //     dispatch(
    //       automationActions.updateStep({
    //         index: editingStepIndex,
    //         field: "xpath",
    //         value: updatedStep.xpath,
    //       }),
    //     );
    //   }
    //
    //   if (updatedStep.value !== undefined) {
    //     dispatch(
    //       automationActions.updateStep({
    //         index: editingStepIndex,
    //         field: "value",
    //         value: updatedStep.value,
    //       }),
    //     );
    //   }
    //
    //   const steps = [...currentSteps]
    //
    //   handleCloseStepEditForm();
    // }

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

  // const handleSaveBetweenStep = (updatedStep: ScenarioStep) => {
  //   if (editingStepIndex !== null) {
  //     // Get the current steps from the Redux store
  //     const steps = [...currentSteps];
  //
  //     // Create a new step with the provided values
  //     const newStep: ScenarioStep = {
  //       type: updatedStep.type,
  //       ...(updatedStep.xpath !== undefined && { xpath: updatedStep.xpath }),
  //       ...(updatedStep.value !== undefined && { value: updatedStep.value }),
  //     };
  //
  //     // Replace the empty step at the editing index with the new step
  //     steps[editingStepIndex] = newStep;
  //
  //     // Update the current steps in the Redux store
  //     dispatch(automationActions.setCurrentSteps(steps));
  //
  //     // Save the updated scenario to localStorage
  //     const updatedScenario = {
  //       ...scenario,
  //       data: steps,
  //     };
  //
  //     // Dispatch the saveScenarioWatcher saga to save the updated scenario
  //     dispatch(saveScenarioWatcher.getPayload({ id, scenario: updatedScenario }));
  //
  //     // Close the step edit form
  //     handleCloseStepEditForm();
  //   }
  // };

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
        <ExpandedContent>
          {isExecuting && (
            <ProgressContainer>
              <ProgressHeader>
                <ProgressText>Progress</ProgressText>
                <ProgressText>
                  {currentStepIndex >= 0 ? currentStepIndex + 1 : 0} / {steps.length} steps
                </ProgressText>
              </ProgressHeader>
              <Progress
                percent={Math.round((Math.max(0, currentStepIndex + 1) / Math.max(1, steps.length)) * 100)}
                size="small"
                status={paused ? "exception" : "active"}
              />
            </ProgressContainer>
          )}

          <StepsHeading>
            <StepsHeadingText>Steps</StepsHeadingText>
            <StepCount>
              {scenario.data.length} {scenario.data.length === 1 ? "step" : "steps"}
            </StepCount>
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
                    />
                  </EditingStepItem>
                );
              }

              // Otherwise, show the normal step view with insert button
              return (
                <React.Fragment key={`step-fragment-${index}`}>
                  <StepInsertContainer key={`insert-before-${index}`}>
                    <StepInsertButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertStep(originalIndex);
                      }}
                    >
                      <PlusOutlined />
                    </StepInsertButton>
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

                          {displayIndex === currentStepIndex && paused && <StatusTag color="orange">Paused</StatusTag>}
                          {status === ExecutionStatus.SUCCESS && <StatusTag color="success">Completed</StatusTag>}
                          {status === ExecutionStatus.ERROR && <StatusTag color="error">Failed</StatusTag>}
                          {status === ExecutionStatus.WARNING && <StatusTag color="warning">Warning</StatusTag>}
                          {status === ExecutionStatus.SKIPPED && <StatusTag color="default">Skipped</StatusTag>}
                        </StepInfo>

                        {/* Step action buttons */}
                        <StepActions>
                          <Tooltip title="Edit this step">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStep(originalIndex);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="Continue from this step">
                            <Button
                              type="text"
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                playScenario(id, originalIndex);
                              }}
                              disabled={executing}
                            />
                          </Tooltip>
                          <Tooltip title="Search for this step">
                            <Button
                              type="text"
                              size="small"
                              icon={<SearchOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Expand the scenario if it's not already expanded
                                if (!isExpanded) {
                                  dispatch(automationActions.toggleScenarioExpanded(id));
                                }

                                // Set the searched step index for UI highlighting
                                dispatch(automationActions.setSearchedStepIndex(displayIndex));

                                // Find and highlight the DOM element if XPath is available
                                if (step.xpath) {
                                  try {
                                    // Remove any existing highlights
                                    const existingHighlights = document.querySelectorAll(".xpath-highlight");
                                    existingHighlights.forEach((el) => {
                                      el.classList.remove("xpath-highlight");
                                    });

                                    // Find the element by XPath
                                    const element = getElementByXPath(step.xpath);

                                    if (element) {
                                      // Add highlight class
                                      element.classList.add("xpath-highlight");

                                      // Scroll to the element
                                      element.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });

                                      // Flash the element to make it more noticeable
                                      flashElement(element);

                                      // Remove highlight class after 2 seconds
                                      setTimeout(() => {
                                        element.classList.remove("xpath-highlight");
                                      }, 2000);
                                    } else {
                                      console.warn(`Element not found with XPath: ${step.xpath}`);
                                    }
                                  } catch (error) {
                                    console.error("Error finding element by XPath:", error);
                                  }
                                }

                                // Scroll to the step element in the UI
                                setTimeout(() => {
                                  const stepElement = document.getElementById(`step-${id}-${displayIndex}`);
                                  if (stepElement) {
                                    stepElement.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                }, 100);
                              }}
                            />
                          </Tooltip>
                        </StepActions>
                      </StepHeader>

                      {/* Status information */}
                      <StepStatusContainer>
                        <StepStatusHeader>
                          <StepStatusText>Статус: {textStatus}</StepStatusText>
                          {displayIndex === currentStepIndex && (
                            <StepStatusText>{Math.round(((displayIndex + 1) / totalSteps) * 100)}%</StepStatusText>
                          )}
                        </StepStatusHeader>
                      </StepStatusContainer>

                      {step.value && (
                        <StepValueContainer>
                          <StepValueLabel>Value:</StepValueLabel>
                          {step.value}
                        </StepValueContainer>
                      )}

                      {step.xpath && (
                        <StepXPathContainer>
                          <StepXPathLabel>XPath:</StepXPathLabel>
                          {step.xpath}
                        </StepXPathContainer>
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
      )}
    </div>
  );
};
