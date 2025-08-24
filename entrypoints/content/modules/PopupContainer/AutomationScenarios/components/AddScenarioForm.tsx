import React, { useState, useEffect } from "react";
import { Button, Divider, InputNumber, Select, Space, Checkbox } from "antd";
import { useForm, Controller } from "react-hook-form";
import { FormInput, FormTextArea } from "@entrypoints/shared/components/FormInput/FormInput";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { IconGripVertical, IconPlus, IconTrash, IconRefresh, IconEdit } from "@tabler/icons-react";
import { FunctionMap, ScenarioStep, getFilteredStepTypeOptions } from "../types.ts";
import { useServerSettings } from "../hooks/useServerSettings.ts";
import { EmptyState, StepContainer, StepHeader, StepTitle } from "../styles.ts";
import { EditingStepItem, EditingStepHeader, EditingStepTitle } from "./ScenarioItem/ScenarioItem.styled";
import StepEditForm from "./StepEditForm";

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
  enableNavigation: yup.boolean(),
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

interface AddScenarioFormProps {
  currentSteps: ScenarioStep[];
  functions?: FunctionMap; // Optional map of functions for function steps
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, field: keyof ScenarioStep, value: string) => void;
  onReorderSteps?: (fromIndex: number, toIndex: number) => void; // Optional callback for reordering steps
  onFormChange?: (formData: {
    title?: string;
    description?: string;
    category?: string;
    tags?: (string | undefined)[];
    enableNavigation?: boolean;
  }) => void;
}

const AddScenarioForm: React.FC<AddScenarioFormProps> = ({
  currentSteps,
  functions = {}, // Default to empty object if not provided
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onReorderSteps,
  onFormChange,
}) => {
  // Initialize React Hook Form
  const {
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: generateDefaultScenarioName(),
      description: "",
      category: "",
      tags: [],
      enableNavigation: false,
    },
    mode: "onChange",
  });

  // Watch form changes and notify parent
  const watchedValues = watch();
  useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);
  // State for tracking details section visibility
  const [showDetails, setShowDetails] = useState<boolean>(false);
  // State for step editing
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Function to scroll to the bottom of the steps container
  const scrollToBottom = () => {
    // @ts-ignore
    const container = (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector(
      "html > body .draggable-modal .ant-modal-body",
    );

    if (container?.scrollHeight) {
      // Use smooth scrolling behavior instead of direct scrollTop assignment
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Scroll to bottom when steps change (new step added or recording starts)
  useEffect(() => {
    if (currentSteps.length > 0) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        scrollToBottom();

        // And one more time after a longer delay
        setTimeout(scrollToBottom, 300);
      });
    }
  }, [currentSteps]);

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
        if (updatedStep[key] !== undefined && updatedStep[key] !== currentSteps[editingStepIndex][key]) {
          onUpdateStep(editingStepIndex, key, updatedStep[key] as string);
        }
      });

      // Close the step edit form
      handleCloseStepEditForm();
    }
  };

  // Handler for deleting a step from StepEditForm
  const handleDeleteStep = () => {
    if (editingStepIndex !== null) {
      // Remove the step using the existing onRemoveStep callback
      onRemoveStep(editingStepIndex);

      // Close the step edit form
      handleCloseStepEditForm();
    }
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

      {/* Enable Navigation checkbox */}
      <div style={{ marginBottom: "16px" }}>
        <Controller
          name="enableNavigation"
          control={control}
          render={({ field }) => (
            <Tooltip title="When enabled, scenario will navigate to URLs during playback">
              <Checkbox {...field} checked={field.value} style={{ fontSize: "12px" }}>
                Enable Navigation
              </Checkbox>
            </Tooltip>
          )}
        />
      </div>

      <Divider orientation="left">Steps</Divider>

      {currentSteps.length === 0 ? (
        <EmptyState style={{ padding: "12px" }}>No steps added yet. Add a step to get started.</EmptyState>
      ) : (
        <div
          style={{
            padding: "4px",
            marginBottom: "16px",
          }}
        >
          {currentSteps.map((step, index) => {
            return (
              <EditingStepItem key={`editing-${index}`}>
                <EditingStepHeader>
                  <EditingStepTitle>Edit Step {index + 1}</EditingStepTitle>
                </EditingStepHeader>
                <StepEditForm
                  step={currentSteps[index]}
                  visible={true}
                  onClose={handleCloseStepEditForm}
                  onSave={handleSaveStep}
                  onDelete={handleDeleteStep}
                />
              </EditingStepItem>
            );
          })}
        </div>
      )}

      <Button type="dashed" onClick={onAddStep} block icon={<IconPlus size={16} />} style={{ marginTop: "16px" }}>
        Add Step
      </Button>
    </div>
  );
};

export default AddScenarioForm;
