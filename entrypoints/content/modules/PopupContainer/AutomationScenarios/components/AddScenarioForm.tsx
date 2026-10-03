import React, { useState, useEffect, useRef } from "react";
import { Button, Divider, Select } from "antd";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { FormInput, FormTextArea } from "@entrypoints/shared/components/FormInput/FormInput";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { IconPlus } from "@tabler/icons-react";
import { useModalOverlayOptional } from "@entrypoints/shared/components/FloatingModal/ModalOverlayContext";
import { Scenario, ScenarioStep } from "../types.ts";
import { EmptyState } from "../styles.ts";
import {
  EditingStepItem,
  EditingStepHeader,
  EditingStepTitle,
  StepInsertContainer,
} from "./ScenarioItem/ScenarioItem.styled";
import StepEditForm, { validateStep } from "./StepEditForm";
import { ScenarioPortalFooterButtons, PortalId } from "./ScenarioPortalFooterButtons";
import RecordingFooter from "./RecordingFooter";
import {
  automationActions,
  ScenarioStatus,
  selectRecordingPaused,
  selectRecording,
  selectCurrentSteps,
  selectActiveScenarioId,
  selectScenarios,
} from "../../../../store/automation/automation.slice";
import {
  persistEditingStateWatcher,
  clearEditingStateWatcher,
  saveScenarioWatcher,
} from "../../../../store/automation/automation.saga.action";
import { PlusOutlined } from "@ant-design/icons";
import { generateScenarioTitle } from "../utils/recordingUtils";

// Yup validation schema
const validationSchema = yup.object().shape({
  title: yup.string().trim().required("Please enter a title for the scenario"),
  description: yup.string(),
  category: yup.string(),
  tags: yup.array().of(yup.string()),
});

// Predefined categories for scenarios
const categoryOptions = [
  { value: "testing", label: "Testing" },
  { value: "data-entry", label: "Data Entry" },
  { value: "navigation", label: "Navigation" },
  { value: "form-filling", label: "Form Filling" },
  { value: "scraping", label: "Data Scraping" },
  { value: "other", label: "Other" },
];

type ScenarioFormValues = {
  title: string;
  description?: string;
  category?: string;
  tags?: (string | undefined)[];
};

const getFormValues = (scenario?: Scenario): ScenarioFormValues => ({
  title: scenario?.title || generateScenarioTitle(),
  description: scenario?.description || "",
  category: scenario?.category || undefined,
  tags: scenario?.tags || [],
});

// The nearest ancestor that actually scrolls (the panel body)
const findScrollParent = (start: HTMLElement | null | undefined): HTMLElement | null => {
  let element = start?.parentElement ?? null;
  while (element) {
    const { overflowY } = window.getComputedStyle(element);
    if ((overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
};

const AddScenarioForm: React.FC = () => {
  const dispatch = useDispatch();
  // Selectors replacing props
  const recording = useSelector(selectRecording);
  const recordingPaused = useSelector(selectRecordingPaused);
  const currentSteps = useSelector(selectCurrentSteps);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const scenarios = useSelector(selectScenarios);
  const existingScenario = activeScenarioId ? scenarios[activeScenarioId] : undefined;

  // Get modal context for scrolling
  const modalContext = useModalOverlayOptional();

  // State for tracking details section visibility
  const [showDetails, setShowDetails] = useState<boolean>(false);
  // Set once saving was refused because of incomplete steps: their errors are shown from then on
  const [stepsSubmitAttempted, setStepsSubmitAttempted] = useState<boolean>(false);
  const invalidStepIndex = currentSteps.findIndex((step) => Object.keys(validateStep(step)).length > 0);

  // Initialize React Hook Form with the edited scenario's metadata (or a fresh default title)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScenarioFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: getFormValues(existingScenario),
    mode: "onChange",
  });

  // The edited scenario can arrive after mount (e.g. editing state restored after a page reload)
  const loadedScenarioIdRef = useRef<string | null>(existingScenario ? activeScenarioId : null);
  useEffect(() => {
    if (existingScenario && loadedScenarioIdRef.current !== activeScenarioId) {
      loadedScenarioIdRef.current = activeScenarioId;
      reset(getFormValues(existingScenario));
    }
  }, [activeScenarioId, existingScenario, reset]);

  const toggleRecordingPause = () => {
    dispatch(automationActions.setRecordingPaused(!recordingPaused));
  };

  const persistSteps = () => {
    dispatch(persistEditingStateWatcher.getPayload());
  };

  // Saves the scenario. Keeps fields this form does not edit (folder, speed, repeat...) of an existing scenario.
  const saveScenario = handleSubmit(
    (formData) => {
      // A step without a type or without its element / value can't be played: let the user complete it
      if (invalidStepIndex >= 0) {
        setStepsSubmitAttempted(true);
        const stepElement = stepsContainerRef.current?.querySelector<HTMLElement>(
          `[data-step-index="${invalidStepIndex}"]`,
        );
        const scrollParent = findScrollParent(stepElement);
        if (stepElement && scrollParent) {
          // Not scrollIntoView: it would also scroll the panel's clipped outer containers
          const top =
            stepElement.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top + scrollParent.scrollTop;
          scrollParent.scrollTo({ top: Math.max(0, top - 16), behavior: "smooth" });
        }
        return;
      }
      const processedTags = (formData.tags || []).filter((tag): tag is string => !!tag);
      const scenarioToSave: Scenario = {
        repeat: 1,
        ...existingScenario,
        title: formData.title.trim(),
        description: formData.description || "",
        category: formData.category || "",
        tags: processedTags,
        data: currentSteps,
      };

      const payload = activeScenarioId
        ? { id: activeScenarioId, scenario: scenarioToSave }
        : { scenario: scenarioToSave };

      dispatch(saveScenarioWatcher.getPayload(payload));
    },
    () => setShowDetails(true),
  );

  const onAddStep = () => {
    dispatch(automationActions.addStep());
    persistSteps();
  };

  const handleCancel = () => {
    dispatch(automationActions.resetScenarioForm());
    // Clear the editing state from storage when canceling
    dispatch(clearEditingStateWatcher.getPayload());
  };


  // Refs for tracking steps container and previous count for auto-scroll.
  // Starts at the current count so opening an existing scenario does not jump to its last step.
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const previousStepCountRef = useRef<number>(currentSteps.length);

  // Scroll the panel to the newest step when one is added (recorded or "Add Step")
  useEffect(() => {
    const currentStepCount = currentSteps.length;
    const previousCount = previousStepCountRef.current;
    previousStepCountRef.current = currentStepCount;
    if (currentStepCount <= previousCount) return;

    const timer = setTimeout(() => {
      if (modalContext?.getModalContainer()) {
        modalContext.scrollToBottom();
        return;
      }
      const scrollParent = findScrollParent(stepsContainerRef.current);
      scrollParent?.scrollTo({ top: scrollParent.scrollHeight, behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentSteps.length, modalContext]);

  // Step edits are applied live: the inline step forms have no own Save button
  const handleStepChange = (stepIndex: number, updatedStep: ScenarioStep) => {
    dispatch(automationActions.replaceStep({ index: stepIndex, step: updatedStep }));
    persistSteps();
  };

  const handleDeleteStep = (stepIndex: number) => {
    dispatch(automationActions.removeStep(stepIndex));
    persistSteps();
  };

  // Handler for moving a step up
  const handleMoveStepUp = (stepIndex: number) => {
    if (stepIndex > 0) {
      dispatch(automationActions.reorderSteps({ fromIndex: stepIndex, toIndex: stepIndex - 1 }));
      persistSteps();
    }
  };

  // Handler for moving a step down
  const handleMoveStepDown = (stepIndex: number) => {
    if (stepIndex < currentSteps.length - 1) {
      dispatch(automationActions.reorderSteps({ fromIndex: stepIndex, toIndex: stepIndex + 1 }));
      persistSteps();
    }
  };

  // Handler for inserting a new step at a specific position
  const handleInsertStep = (insertIndex: number) => {
    dispatch(automationActions.insertStep(insertIndex));
    persistSteps();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div className="flex items-center" style={{ marginBottom: "8px" }}>
          <label style={{ fontWeight: "500" }}>Scenario Title</label>
          <button
            className="cursor-pointer ml-4 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <FormInput {...field} type="text" placeholder="Enter scenario title" error={!!errors.title} />
          )}
        />
        {errors.title && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.title.message}</div>
        )}
      </div>

      {/* Details fields - shown/hidden based on showDetails state */}
      <div style={{ display: showDetails ? "block" : "none" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <FormTextArea {...field} placeholder="Enter scenario description" rows={3} />}
        />
      </div>

      <div style={{ display: showDetails ? "block" : "none" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Category</label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              placeholder="Select a category"
              options={categoryOptions}
              allowClear
            />
          )}
        />
      </div>

      <div style={{ display: showDetails ? "block" : "none" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Tags</label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              mode="tags"
              placeholder="Add tags"
              style={{ width: "100%" }}
              tokenSeparators={[","]}
            />
          )}
        />
      </div>

      <Divider orientation="left">Steps</Divider>

      {currentSteps.length === 0 ? (
        <EmptyState style={{ padding: "12px" }}>No steps added yet. Add a step to get started.</EmptyState>
      ) : (
        <div
          ref={stepsContainerRef}
          style={{
            padding: "4px",
            marginBottom: "16px",
          }}
        >
          {currentSteps.map((step, index) => {
            return (
              <div key={`editing-${index}`}>
                <StepInsertContainer key={`insert-before-${index}`}>
                  <div
                    className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-pointer shadow-md opacity-0 transform -translate-y-3 hover:opacity-100 hover:bg-blue-400 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-300 active:opacity-100 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsertStep(index);
                    }}
                  >
                    <PlusOutlined />
                  </div>
                </StepInsertContainer>

                <EditingStepItem data-step-index={index}>
                  <EditingStepHeader>
                    <EditingStepTitle>Edit Step {index + 1}</EditingStepTitle>
                  </EditingStepHeader>
                  <StepEditForm
                    step={step}
                    onClose={() => undefined}
                    onSave={(updatedStep) => handleStepChange(index, updatedStep)}
                    onChange={(updatedStep) => handleStepChange(index, updatedStep)}
                    onDelete={() => handleDeleteStep(index)}
                    onMoveUp={handleMoveStepUp}
                    onMoveDown={handleMoveStepDown}
                    stepIndex={index}
                    totalSteps={currentSteps.length}
                    showErrors={stepsSubmitAttempted}
                  />
                </EditingStepItem>
              </div>
            );
          })}
        </div>
      )}

      {stepsSubmitAttempted && invalidStepIndex >= 0 && (
        <div role="alert" style={{ color: "#ff4d4f", fontSize: "14px" }}>
          Step {invalidStepIndex + 1} is incomplete. Complete or delete it to save the scenario.
        </div>
      )}

      <ScenarioPortalFooterButtons portalId={recording ? PortalId.RECORDING : PortalId.SCENARIOS_TAB}>
        <RecordingFooter
          isRecording={recording}
          isPaused={recordingPaused}
          onCancel={handleCancel}
          onPauseToggle={toggleRecordingPause}
          onSave={saveScenario}
        />
      </ScenarioPortalFooterButtons>

      <Button type="dashed" onClick={onAddStep} block icon={<IconPlus size={16} />} style={{ marginTop: "16px" }}>
        Add Step
      </Button>
    </div>
  );
};

export default AddScenarioForm;
