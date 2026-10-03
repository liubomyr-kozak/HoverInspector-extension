import React, { useState, useEffect, useRef } from "react";
import { Button, Select } from "antd";
import { useForm, Controller, Resolver } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { FormInput, FormTextArea } from "@entrypoints/shared/components/FormInput/FormInput";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { IconChevronDown, IconListDetails, IconPlus } from "@tabler/icons-react";
import { useModalOverlayOptional } from "@entrypoints/shared/components/FloatingModal/ModalOverlayContext";
import { Scenario, ScenarioStep } from "../types.ts";
import { EmptyState } from "@entrypoints/shared/components/EmptyState";
import StepEditForm, { validateStep } from "./StepEditForm";
import { StepCard } from "./StepForm/StepCard";
import { InsertButton, InsertSlot, StepList } from "./StepForm/StepCard.styled";
import {
  Alert,
  CountBadge,
  DetailsPanel,
  ErrorText,
  Field,
  FieldHead,
  Label,
  ScenarioForm,
  SectionHead,
} from "./StepForm/StepForm.styled";
import { shadowBody } from "../utils/popupContainer";
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
  // The one step whose form is open; the others show as compact rows
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  // Set when the user opened a step themselves (add, insert, save with an incomplete step): scroll to that step
  const scrollToExpandedRef = useRef(false);

  // Initialize React Hook Form with the edited scenario's metadata (or a fresh default title)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScenarioFormValues>({
    resolver: yupResolver(validationSchema) as Resolver<ScenarioFormValues>,
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
        openStep(invalidStepIndex);
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

  const openStep = (index: number) => {
    scrollToExpandedRef.current = true;
    setExpandedIndex(index);
  };

  const toggleStep = (index: number) => setExpandedIndex((current) => (current === index ? null : index));

  const onAddStep = () => {
    dispatch(automationActions.addStep());
    persistSteps();
    openStep(currentSteps.length);
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
    if (currentStepCount <= previousCount || scrollToExpandedRef.current) return;

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

  // Bring the step the user opened into view (not scrollIntoView: it would also scroll the panel's clipped outer containers)
  useEffect(() => {
    if (expandedIndex === null || !scrollToExpandedRef.current) return;
    const timer = setTimeout(() => {
      scrollToExpandedRef.current = false;
      const stepElement = stepsContainerRef.current?.querySelector<HTMLElement>(`[data-step-index="${expandedIndex}"]`);
      const scrollParent = findScrollParent(stepElement);
      if (!stepElement || !scrollParent) return;
      const top =
        stepElement.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top + scrollParent.scrollTop;
      scrollParent.scrollTo({ top: Math.max(0, top - 16), behavior: "smooth" });
    }, 60);
    return () => clearTimeout(timer);
  }, [expandedIndex, currentSteps.length]);

  // Step edits are applied live: the inline step forms have no own Save button
  const handleStepChange = (stepIndex: number, updatedStep: ScenarioStep) => {
    dispatch(automationActions.replaceStep({ index: stepIndex, step: updatedStep }));
    persistSteps();
  };

  const handleDeleteStep = (stepIndex: number) => {
    dispatch(automationActions.removeStep(stepIndex));
    persistSteps();
    setExpandedIndex((current) => {
      if (current === null || current < stepIndex) return current;
      return current === stepIndex ? null : current - 1;
    });
  };

  // The open form follows its step when steps swap places
  const followMove = (fromIndex: number, toIndex: number) =>
    setExpandedIndex((current) => (current === fromIndex ? toIndex : current === toIndex ? fromIndex : current));

  // Handler for moving a step up
  const handleMoveStepUp = (stepIndex: number) => {
    if (stepIndex > 0) {
      dispatch(automationActions.reorderSteps({ fromIndex: stepIndex, toIndex: stepIndex - 1 }));
      persistSteps();
      followMove(stepIndex, stepIndex - 1);
    }
  };

  // Handler for moving a step down
  const handleMoveStepDown = (stepIndex: number) => {
    if (stepIndex < currentSteps.length - 1) {
      dispatch(automationActions.reorderSteps({ fromIndex: stepIndex, toIndex: stepIndex + 1 }));
      persistSteps();
      followMove(stepIndex, stepIndex + 1);
    }
  };

  // Handler for inserting a new step at a specific position
  const handleInsertStep = (insertIndex: number) => {
    dispatch(automationActions.insertStep(insertIndex));
    persistSteps();
    openStep(insertIndex);
  };

  return (
    <ScenarioForm>
      <Field>
        <FieldHead>
          <Label htmlFor="scenario-title">Title</Label>
          <Button
            type="text"
            size="small"
            aria-expanded={showDetails}
            onClick={() => setShowDetails(!showDetails)}
            icon={<IconChevronDown size={14} style={{ transform: showDetails ? "rotate(180deg)" : undefined }} />}
            iconPosition="end"
          >
            {showDetails ? "Hide details" : "Details"}
          </Button>
        </FieldHead>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <FormInput {...field} id="scenario-title" type="text" placeholder="Scenario title" error={!!errors.title} />
          )}
        />
        {errors.title && <ErrorText role="alert">{errors.title.message}</ErrorText>}
      </Field>

      {/* Hidden, not unmounted: the fields keep their values */}
      <DetailsPanel style={{ display: showDetails ? undefined : "none" }}>
        <Field>
          <Label htmlFor="scenario-description">Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <FormTextArea {...field} id="scenario-description" placeholder="What the scenario does" rows={2} />
            )}
          />
        </Field>
        <Field>
          <Label htmlFor="scenario-category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="scenario-category"
                getPopupContainer={shadowBody}
                placeholder="Choose a category"
                options={categoryOptions}
                allowClear
              />
            )}
          />
        </Field>
        <Field>
          <Label htmlFor="scenario-tags">Tags</Label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="scenario-tags"
                getPopupContainer={shadowBody}
                mode="tags"
                placeholder="Add tags"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
              />
            )}
          />
        </Field>
      </DetailsPanel>

      <div ref={stepsContainerRef}>
        <SectionHead>
          <h3>Steps</h3>
          {currentSteps.length > 0 && <CountBadge>{currentSteps.length}</CountBadge>}
        </SectionHead>

        {currentSteps.length === 0 ? (
          <EmptyState
            icon={<IconListDetails />}
            title="No steps yet"
            description={recording ? "Use the page: every click and text you type becomes a step." : "Add a step to get started."}
          />
        ) : (
          <StepList aria-label="Steps">
            {currentSteps.map((step, index) => (
              <React.Fragment key={`editing-${index}`}>
                <InsertSlot>
                  <InsertButton type="button" onClick={() => handleInsertStep(index)} aria-label={`Insert a step before step ${index + 1}`}>
                    <IconPlus />
                    Step
                  </InsertButton>
                </InsertSlot>
                <StepCard
                  step={step}
                  index={index}
                  total={currentSteps.length}
                  expanded={expandedIndex === index}
                  invalid={stepsSubmitAttempted && Object.keys(validateStep(step)).length > 0}
                  onToggle={toggleStep}
                  onMoveUp={handleMoveStepUp}
                  onMoveDown={handleMoveStepDown}
                  onDelete={handleDeleteStep}
                >
                  <StepEditForm
                    step={step}
                    onClose={() => setExpandedIndex(null)}
                    onSave={(updatedStep) => handleStepChange(index, updatedStep)}
                    onChange={(updatedStep) => handleStepChange(index, updatedStep)}
                    stepIndex={index}
                    totalSteps={currentSteps.length}
                    showErrors={stepsSubmitAttempted}
                  />
                </StepCard>
              </React.Fragment>
            ))}
          </StepList>
        )}
      </div>

      {stepsSubmitAttempted && invalidStepIndex >= 0 && (
        <Alert role="alert">Step {invalidStepIndex + 1} is incomplete. Complete or delete it to save the scenario.</Alert>
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

      <Button type="dashed" onClick={onAddStep} block icon={<IconPlus size={16} />}>
        Add step
      </Button>
    </ScenarioForm>
  );
};

export default AddScenarioForm;
