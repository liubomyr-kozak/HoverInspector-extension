import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconPlayerRecord, IconPlayerStop, IconRobot, IconX } from "@tabler/icons-react";
import { Popover, Button, Divider } from "antd";
import {
  startNewRecordingWatcher,
  stopRecordingWatcher,
  saveScenarioWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action.ts";
import {
  selectRecording,
  selectActiveScenarioId,
  selectCurrentSteps,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { generateScenarioTitle } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/recordingUtils.ts";
import { useScenarioActions } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/hooks/useScenarioActions.ts";
import { FeatureContainer, MainButton, QuickAction, RecordingIndicator } from "../MinimizedLauncher.styled.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { onToggleFeatureMinimized } from "@/entrypoints/content/store/app/saga-action/app.saga.action.ts";

interface AutomationMinimizedProps {
  featureId: string;
}

export const AutomationMinimized: React.FC<AutomationMinimizedProps> = ({ featureId }) => {
  const dispatch = useDispatch();
  const isRecording = useSelector(selectRecording);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const currentSteps = useSelector(selectCurrentSteps);
  const scenarios = useSelector((state: any) => state.automation?.scenarios || {});
  const { playScenario } = useScenarioActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const startRecording = () => dispatch(startNewRecordingWatcher.getPayload());

  const saveAndStopRecording = () => {
    // Only the initial "navigate" step means nothing was recorded
    if (currentSteps.length <= 1) {
      dispatch(stopRecordingWatcher.getPayload());
      return;
    }

    const existing = activeScenarioId ? scenarios[activeScenarioId] : undefined;
    const scenarioToSave = {
      repeat: 1,
      description: "",
      tags: [],
      category: "",
      ...existing,
      title: existing?.title || generateScenarioTitle(),
      data: currentSteps,
    };

    // saveScenarioWatcher persists the scenario, resets the recording state and clears the stored session
    dispatch(
      saveScenarioWatcher.getPayload(
        activeScenarioId ? { id: activeScenarioId, scenario: scenarioToSave } : { scenario: scenarioToSave },
      ),
    );
  };

  const scenariosList = Object.keys(scenarios);

  const popoverContent = (
    <div style={{ minWidth: "200px", maxWidth: "300px" }}>
      {/* Scenarios List */}
      {scenariosList.length > 0 ? (
        <>
          <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#666" }}>Scenarios</div>
          {scenariosList.map((id) => (
            <Button
              key={`run-${id}`}
              type="text"
              size="small"
              onClick={() => {
                playScenario(id);
                setMenuOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                marginBottom: "4px",
                padding: "8px 12px",
                height: "auto",

                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {scenarios[id].title || `Scenario ${id.slice(-4)}`}
            </Button>
          ))}
          <Divider style={{ margin: "8px 0" }} />
        </>
      ) : (
        <>
          <div style={{ color: "#999", fontStyle: "italic", marginBottom: "8px" }}>No scenarios available</div>
          <Divider style={{ margin: "8px 0" }} />
        </>
      )}

      {/* Action Buttons */}
      <Button
        type="text"
        size="small"
        icon={isRecording ? <IconPlayerStop size={14} /> : <IconPlayerRecord size={14} />}
        onClick={() => {
          isRecording ? saveAndStopRecording() : startRecording();
          setMenuOpen(false);
        }}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          marginBottom: "4px",
          padding: "8px 12px",
          height: "auto",
        }}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
    </div>
  );

  const status = isRecording ? "recording" : activeScenarioId ? "active" : "idle";

  return (
    <FeatureContainer>
      <Popover
        content={popoverContent}
        trigger="click"
        placement="top"
        open={menuOpen}
        onOpenChange={setMenuOpen}
        getPopupContainer={() =>
          // @ts-ignore
          (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
        }
      >
        <MainButton active={menuOpen}>
          <div className="drag-handle flex items-center gap-2">
            <IconRobot size={16} />
            Automation
          </div>

          <RecordingIndicator status={status} />

          <Tooltip title="Close">
            <QuickAction
              onClick={(e) => {
                e.stopPropagation();
                dispatch(
                  onToggleFeatureMinimized.getPayload({
                    featureKey: featureId,
                  }),
                );
              }}
            >
              <IconX size={14} />
            </QuickAction>
          </Tooltip>
          {isRecording && (
            <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
              <QuickAction onClick={isRecording ? saveAndStopRecording : startRecording}>
                {isRecording ? <IconPlayerStop size={14} /> : <IconPlayerRecord size={14} />}
              </QuickAction>
            </Tooltip>
          )}
        </MainButton>
      </Popover>
    </FeatureContainer>
  );
};
