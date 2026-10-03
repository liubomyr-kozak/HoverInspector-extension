import React, { useEffect, useRef, useState } from "react";
import { useScenarioFolders } from "../hooks/useScenarioFolders";
import { groupScenariosByFolder, sortScenarioIds } from "../utils/folderUtils";
import { EmptyFolderHint, FolderHeader, NewFolderRow, ScenarioListToolbar } from "./ScenarioFolders";
import { ExecutionHistoryEntry, ScenarioMap, ScenarioStep, ExecutionStatus } from "../types.ts";
import { ScenarioList as StyledScenarioList } from "../styles.ts";
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
import { EmptyState as SharedEmptyState } from "@entrypoints/shared/components/EmptyState";
import { IconRobot } from "@tabler/icons-react";

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

  const scenarioKeys = sortScenarioIds(scenarios);
  const { folders, createFolder, renameFolder, toggleFolderCollapsed, deleteFolder } = useScenarioFolders();
  const folderCount = Object.keys(folders).length;
  const hasFolders = folderCount > 0;
  const [creatingFolder, setCreatingFolder] = useState(false);

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

  const renderScenario = (key: string) => (
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
  );

  if (scenarioKeys.length === 0 && !hasFolders) {
    // When recording is active, return an empty list container instead of the "No scenarios found" message
    // This allows new scenarios to appear in the list as they are created during recording
    if (recording) {
      return <StyledScenarioList ref={listContainerRef} />;
    }

    return (
      <SharedEmptyState
        icon={<IconRobot />}
        title="No scenarios yet"
        description="Record your clicks and typing on this page to replay them later."
      />
    );
  }

  return (
    <div className="flex flex-col" data-testid="scenario-list">
      {!recording && (
        <ScenarioListToolbar
          scenarioCount={scenarioKeys.length}
          folderCount={folderCount}
          creating={creatingFolder}
          onNewFolder={() => setCreatingFolder(true)}
        />
      )}
      {creatingFolder && !recording && (
        <NewFolderRow onCreate={createFolder} onDone={() => setCreatingFolder(false)} />
      )}
      <StyledScenarioList ref={listContainerRef}>
        {!hasFolders
          ? scenarioKeys.map(renderScenario)
          : groupScenariosByFolder(scenarios, folders).map((group) => {
              // A folder holding the running scenario stays open so its progress is visible
              const holdsActive = !!activeScenarioId && group.scenarioIds.includes(activeScenarioId);
              const open = group.folderId === null || !group.collapsed || (executing && holdsActive);
              return (
                <li key={group.folderId || "no-folder"} className="list-none" data-folder-group={group.folderId || "none"}>
                  <FolderHeader
                    group={group}
                    open={open}
                    disabled={executing && holdsActive}
                    onToggle={() => group.folderId && toggleFolderCollapsed(group.folderId)}
                    onRename={(title) => renameFolder(group.folderId!, title)}
                    onDelete={() => group.folderId && deleteFolder(group.folderId)}
                  />
                  {open && (
                    // Scenarios in a folder hang off a guide line under the folder's chevron
                    <ul
                      className={`list-none p-0 m-0 ${
                        group.folderId ? "ml-5 border-l border-gray-200 dark:border-gray-700" : ""
                      }`}
                    >
                      {group.scenarioIds.length ? group.scenarioIds.map(renderScenario) : <EmptyFolderHint />}
                    </ul>
                  )}
                </li>
              );
            })}
      </StyledScenarioList>
    </div>
  );
};

export default ScenarioList;
