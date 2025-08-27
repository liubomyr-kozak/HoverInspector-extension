import React, { useState, useEffect, useMemo, useRef } from "react";
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
import StepEditForm from "./StepEditForm";
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
  selectIsEditingScenario,
} from "../../../../store/automation/automation.slice";
import {
  persistEditingStateWatcher,
  clearEditingStateWatcher,
  saveScenarioWatcher,
} from "../../../../store/automation/automation.saga.action";
import { PlusOutlined } from "@ant-design/icons";

// Function to generate a default scenario name
const generateDefaultScenarioName = (): string => {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  return `New Scenario ${dateString} ${timeString}`;
};

// Yup validation schema
const validationSchema = yup.object().shape({
  title: yup.string().required("Please enter a title for the scenario"),
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

const AddScenarioForm: React.FC = () => {
  const dispatch = useDispatch();
  // Selectors replacing props
  const recording = useSelector(selectRecording);
  const recordingPaused = useSelector(selectRecordingPaused);
  const currentSteps = useSelector(selectCurrentSteps);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const isEditingScenario = useSelector(selectIsEditingScenario);

  // Get modal context for scrolling
  const modalContext = useModalOverlayOptional();

  // Local form data state to avoid drilling
  const [scenarioFormData, setScenarioFormData] = useState<{
    title?: string;
    description?: string;
    category?: string;
    tags?: (string | undefined)[];
  }>({});

  // Recording logic functions moved from ScenariosListTab
  const toggleRecordingPause = () => {
    dispatch(automationActions.setRecordingPaused(!recordingPaused));
  };

  const saveRecording = () => {
    // Switch to editing mode and persist state
    dispatch(automationActions.setStatus(ScenarioStatus.EDITING));
    dispatch(persistEditingStateWatcher.getPayload());

    // Validate required fields
    if (!scenarioFormData.title || scenarioFormData.title.trim() === "") {
      console.error("[SAVE SCENARIO] Validation failed - empty title");
      return;
    }

    const processedTags = (scenarioFormData.tags?.filter((tag) => tag !== undefined) as string[]) || [];
    const scenarioToSave: Scenario = {
      title: scenarioFormData.title,
      description: scenarioFormData.description || "",
      category: scenarioFormData.category || "",
      tags: processedTags,
      repeat: 1,
      data: currentSteps,
    };

    const payload = activeScenarioId
      ? { id: activeScenarioId, scenario: scenarioToSave }
      : { scenario: scenarioToSave };

    dispatch(saveScenarioWatcher.getPayload(payload));
  };

  const onAddStep = () => {
    dispatch(automationActions.addStep());
    // Persist the updated steps to storage
    dispatch(persistEditingStateWatcher.getPayload());
  };

  // Local handler to update persisted form data
  // Note: keep inline to avoid effect dependency churn
  const handleFormDataChange = (formData: {
    title?: string;
    description?: string;
    category?: string;
    tags?: (string | undefined)[];
  }) => {
    setScenarioFormData(formData);
  };

  const handleCancel = () => {
    dispatch(automationActions.resetScenarioForm());
    // Clear the editing state from storage when canceling
    dispatch(clearEditingStateWatcher.getPayload());
  };

  // Generate default scenario name once to avoid timestamp inconsistencies
  const defaultScenarioName = useMemo(() => generateDefaultScenarioName(), []);

  // Initialize React Hook Form
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: defaultScenarioName,
      description: "",
      category: "",
      tags: [],
    },
    mode: "onChange",
  });

  // Form submission handler
  const onSubmit = (data: any) => {
    if (recording) {
      saveRecording();
    }
  };

  // Watch form changes and persist in local component state
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      handleFormDataChange(value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Initialize local form data on mount
  useEffect(() => {
    const initialValues = {
      title: defaultScenarioName,
      description: "",
      category: "",
      tags: [],
    };
    setScenarioFormData(initialValues);
  }, [defaultScenarioName]);

  // State for tracking details section visibility
  const [showDetails, setShowDetails] = useState<boolean>(false);
  // State for step editing
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Refs for tracking steps container and previous count for auto-scroll
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const previousStepCountRef = useRef<number>(0);

  // Effect to scroll to bottom when new steps are added
  useEffect(() => {
    const currentStepCount = currentSteps.length;
    const previousCount = previousStepCountRef.current;
    
    // If we have more steps than before, scroll to bottom
    if (currentStepCount > previousCount && currentStepCount > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (modalContext) {
          // Use the context's scroll method
          modalContext.scrollToBottom();
        } else if (stepsContainerRef.current) {
          // Fallback to finding scrollable parent container
          let scrollContainer = stepsContainerRef.current.closest(
            '.ant-modal-body, .ant-tabs-content, [class*="modal"], [style*="overflow"]',
          );

          // If no specific scrollable container found, try to find any scrollable parent
          if (!scrollContainer) {
            let element = stepsContainerRef.current.parentElement;
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

          // If still no scrollable container found, try shadow DOM approach as fallback
          if (!scrollContainer) {
            const hoverInspector = document.querySelector("hover-inspector") as HTMLElement & {
              shadowRoot: ShadowRoot | null;
            };
            scrollContainer = hoverInspector?.shadowRoot?.querySelector(
              "html > body .draggable-modal .ant-modal-body",
            ) as HTMLElement;
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
    previousStepCountRef.current = currentStepCount;
  }, [currentSteps.length, modalContext]);

  // Handler for closing the step edit form
  const handleCloseStepEditForm = () => {
    setEditingStepIndex(null);
  };

  // Handler for saving a step from StepEditForm
  const handleSaveStep = (updatedStep: ScenarioStep) => {
    if (editingStepIndex !== null) {
      // Update the step using the existing onUpdateStep callback
      const stepKeys = Object.keys(updatedStep) as (keyof ScenarioStep)[];
      stepKeys.forEach((key) => {
        const value = updatedStep[key];
        if (value !== undefined && value !== currentSteps[editingStepIndex][key]) {
          // Convert value to string as expected by onUpdateStep
          const stringValue = typeof value === "boolean" ? String(value) : (value as string);
          dispatch(automationActions.updateStep({ index: editingStepIndex, field: key, value: stringValue }));
          dispatch(persistEditingStateWatcher.getPayload());
        }
      });

      // Close the step edit form
      handleCloseStepEditForm();
    }
  };

  // Handler for deleting a step from StepEditForm
  const handleDeleteStep = () => {
    if (editingStepIndex !== null) {
      dispatch(automationActions.removeStep(editingStepIndex));
      dispatch(persistEditingStateWatcher.getPayload());

      // Close the step edit form
      handleCloseStepEditForm();
    }
  };

  // Handler for moving a step up
  const handleMoveStepUp = (stepIndex: number) => {
    if (stepIndex > 0) {
      dispatch(automationActions.reorderSteps({ fromIndex: stepIndex, toIndex: stepIndex - 1 }));
      dispatch(persistEditingStateWatcher.getPayload());
    }
  };

  // Handler for moving a step down
  const handleMoveStepDown = (stepIndex: number) => {
    if (stepIndex < currentSteps.length - 1) {
      dispatch(automationActions.reorderSteps({ fromIndex: stepIndex, toIndex: stepIndex + 1 }));
      dispatch(persistEditingStateWatcher.getPayload());
    }
  };

  // Handler for inserting a new step at a specific position
  const handleInsertStep = (insertIndex: number) => {
    dispatch(automationActions.insertStep(insertIndex));
    dispatch(persistEditingStateWatcher.getPayload());
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
          <form onSubmit={handleSubmit(onSubmit)}>
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

                  <EditingStepItem>
                    <EditingStepHeader>
                      <EditingStepTitle>Edit Step {index + 1}</EditingStepTitle>
                    </EditingStepHeader>
                    <StepEditForm
                      step={currentSteps[index]}
                      onClose={handleCloseStepEditForm}
                      onSave={handleSaveStep}
                      onDelete={handleDeleteStep}
                      onMoveUp={handleMoveStepUp}
                      onMoveDown={handleMoveStepDown}
                      stepIndex={index}
                      totalSteps={currentSteps.length}
                    />
                  </EditingStepItem>
                </div>
              );
            })}

            <ScenarioPortalFooterButtons portalId={recording ? PortalId.RECORDING : PortalId.SCENARIOS_TAB}>
              <RecordingFooter
                isPaused={recordingPaused}
                onCancel={handleCancel}
                onPauseToggle={toggleRecordingPause}
                onSave={saveRecording}
              />
            </ScenarioPortalFooterButtons>
          </form>
        </div>
      )}

      <Button type="dashed" onClick={onAddStep} block icon={<IconPlus size={16} />} style={{ marginTop: "16px" }}>
        Add Step
      </Button>
    </div>
  );
};

export default AddScenarioForm;
