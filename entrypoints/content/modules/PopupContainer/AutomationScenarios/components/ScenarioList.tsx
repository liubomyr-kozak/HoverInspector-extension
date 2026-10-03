import React, { useEffect, useRef } from "react";
import { ExecutionHistoryEntry, ScenarioMap, ScenarioStep, ExecutionStatus } from "../types.ts";
import { EmptyState, ScenarioList as StyledScenarioList } from "../styles.ts";
import { ScenarioItem } from "./ScenarioItem";
import { useSelector } from "react-redux";
import { useModalOverlayOptional } from "@entrypoints/shared/components/FloatingModal/ModalOverlayContext";
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

  // Get modal context for scrolling
  const modalContext = useModalOverlayOptional();

  // Ref to track the scenario list container for scrolling
  const listContainerRef = useRef<HTMLUListElement>(null);
  const previousScenarioCountRef = useRef<number>(0);

  const scenarioKeys = Object.keys(scenarios).sort((a, b) => {
    // Handle cases where scenarios might be undefined or missing title property
    const titleA = scenarios[a]?.title || "";
    const titleB = scenarios[b]?.title || "";
    // Natural order: "Scenario 2" before "Scenario 10"
    return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: "base" });
  });

  // Effect to scroll to bottom when new scenarios are added
  useEffect(() => {
    const currentScenarioCount = scenarioKeys.length;
    const previousCount = previousScenarioCountRef.current;

    // If we have more scenarios than before, scroll to bottom
    if (currentScenarioCount > previousCount && currentScenarioCount > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (modalContext) {
          // Use the context's scroll method
          modalContext.scrollToBottom();
        } else if (listContainerRef.current) {
          // Fallback to finding scrollable parent container
          let scrollContainer = listContainerRef.current.closest(
            '.ant-modal-body, .ant-tabs-content, [class*="modal"], [style*="overflow"]',
          );

          // If no specific scrollable container found, try to find any scrollable parent
          if (!scrollContainer) {
            let element = listContainerRef.current.parentElement;
            while (element && element !== document.body) {
              const style = window.getComputedStyle(element);
              if (
                style.overflow === "auto" ||
                style.overflow === "scroll" ||
                style.overflowY === "auto" ||
                style.overflowY === "scroll"
              ) {
                scrollContainer = element;
                break;
              }
              element = element.parentElement;
            }
          }

          // Scroll to bottom with smooth behavior
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }, 100); // Small delay to ensure DOM has rendered
    }

    // Update the previous count
    previousScenarioCountRef.current = currentScenarioCount;
  }, [scenarioKeys.length, modalContext]);

  if (scenarioKeys.length === 0) {
    // When recording is active, return an empty list container instead of the "No scenarios found" message
    // This allows new scenarios to appear in the list as they are created during recording
    if (recording) {
      return <StyledScenarioList ref={listContainerRef} />;
    }

    return <EmptyState>No scenarios found. Create a new one to get started.</EmptyState>;
  }

  return (
    <StyledScenarioList ref={listContainerRef}>
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
