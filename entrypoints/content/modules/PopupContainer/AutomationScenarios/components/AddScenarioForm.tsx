import React, { useState, useEffect } from "react";
import { Button, Divider, Form, Input, InputNumber, Select, Space } from "antd";
import { useSelector } from "react-redux";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { IconGripVertical, IconPlus, IconTrash, IconRefresh } from "@tabler/icons-react";
import { FunctionMap, ScenarioStep, getFilteredStepTypeOptions } from "../types.ts";
import { useServerSettings } from "../hooks/useServerSettings.ts";
import { EmptyState, StepContainer, StepHeader, StepTitle } from "../styles.ts";

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
  form: any; // Form instance from antd
  currentSteps: ScenarioStep[];
  functions?: FunctionMap; // Optional map of functions for function steps
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, field: keyof ScenarioStep, value: string) => void;
  onReorderSteps?: (fromIndex: number, toIndex: number) => void; // Optional callback for reordering steps
}

const AddScenarioForm: React.FC<AddScenarioFormProps> = ({
  form,
  currentSteps,
  functions = {}, // Default to empty object if not provided
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onReorderSteps,
}) => {
  // State for tracking drag operation
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { syncFunctions } = useServerSettings();
  const stepTypeOptions = getFilteredStepTypeOptions(syncFunctions);

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

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set a ghost image (optional)
    try {
      const draggedElement = e.currentTarget;
      e.dataTransfer.setDragImage(draggedElement, 20, 20);
    } catch (err) {
      console.error("Error setting drag image:", err);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex && onReorderSteps) {
      onReorderSteps(draggedIndex, dropIndex);
      setDraggedIndex(null);
    }
    return false;
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ title: "", repeat: 0 }}>
      <Form.Item
        name="title"
        label="Scenario Title"
        rules={[{ required: true, message: "Please enter a title for the scenario" }]}
      >
        <Input placeholder="Enter scenario title" />
      </Form.Item>

      <Form.Item name="description" label="Description" tooltip="A detailed description of what this scenario does">
        <Input.TextArea placeholder="Enter scenario description" rows={3} />
      </Form.Item>

      <Form.Item name="category" label="Category" tooltip="Select a category for this scenario">
        <Select
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
          placeholder="Select a category"
          options={categoryOptions}
          allowClear
        />
      </Form.Item>

      <Form.Item name="tags" label="Tags" tooltip="Add tags to help organize and find your scenarios">
        <Select
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
          mode="tags"
          placeholder="Add tags"
          style={{ width: "100%" }}
          tokenSeparators={[","]}
        />
      </Form.Item>

      <Form.Item name="repeat" label="Repeat Count" tooltip="Number of times to repeat the scenario (0 = no repeat)">
        <InputNumber min={0} defaultValue={0} style={{ width: "100%" }} />
      </Form.Item>

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
          {currentSteps.map((step, index) => (
            <StepContainer
              key={index}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                cursor: "move",
                opacity: draggedIndex === index ? 0.5 : 1,
              }}
            >
              <StepHeader>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <IconGripVertical size={16} style={{ marginRight: "8px", cursor: "grab" }} />
                  <StepTitle>Step {index + 1}</StepTitle>
                </div>
                <Button
                  danger
                  type="text"
                  icon={<IconTrash size={16} />}
                  onClick={() => onRemoveStep(index)}
                  style={{ marginLeft: "auto" }}
                >
                  Remove
                </Button>
              </StepHeader>
              <Form.Item label="Type" required style={{ marginBottom: "8px" }}>
                <Select
                  value={step.type}
                  onChange={(value) => onUpdateStep(index, "type", value)}
                  style={{ width: "100%" }}
                  options={stepTypeOptions}
                  getPopupContainer={() =>
                    // @ts-ignore
                    (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector(
                      "html > body",
                    )!
                  }
                />
              </Form.Item>
              {/*{(step.type === "click" || step.type === "value") && (*/}
              <Form.Item label="XPath" required style={{ marginBottom: "8px" }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    value={step.xpath || ""}
                    onChange={(e) => onUpdateStep(index, "xpath", e.target.value)}
                    placeholder="Enter XPath selector"
                  />
                  <Tooltip title="Set alternative XPath when recording">
                    <Button
                      icon={<IconRefresh size={16} />}
                      onClick={() => {
                        // When recording is active, this will allow setting an alternative XPath
                        // by clicking on another element
                        const message = {
                          type: "SET_ALTERNATIVE_XPATH",
                          stepIndex: index,
                        };
                        window.postMessage(message, "*");
                      }}
                    />
                  </Tooltip>
                </Space.Compact>
                {step.alternativeXpaths && step.alternativeXpaths.length > 0 && (
                  <div style={{ marginTop: "4px" }}>
                    <small style={{ color: "#888" }}>Alternative XPaths: {step.alternativeXpaths.length}</small>
                  </div>
                )}
              </Form.Item>
              {/*)}*/}
              {syncFunctions && step.type === "function" && (
                <Form.Item label="Function" required style={{ marginBottom: "8px" }}>
                  <Select
                    value={step.value || ""}
                    onChange={(value) => onUpdateStep(index, "value", value)}
                    style={{ width: "100%" }}
                    placeholder="Select a function"
                    options={Object.keys(functions).map((key) => ({
                      value: functions[key].title,
                      label: functions[key].title,
                    }))}
                    getPopupContainer={() =>
                      // @ts-ignore
                      (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector(
                        "html > body",
                      )!
                    }
                  />
                </Form.Item>
              )}
              {/*{step.type}*/}
              {(step.type === "input" ||
                step.type === "value" ||
                step.type === "code" ||
                step.type === "redirect" ||
                step.type === "wait") && (
                <Form.Item label="Value" required style={{ marginBottom: "8px" }}>
                  {step.type === "code" ? (
                    <Input.TextArea
                      value={step.value || ""}
                      onChange={(e) => onUpdateStep(index, "value", e.target.value)}
                      placeholder="Enter code"
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={step.value || ""}
                      onChange={(e) => onUpdateStep(index, "value", e.target.value)}
                      placeholder={
                        step.type === "value"
                          ? "Enter value"
                          : step.type === "redirect"
                            ? "Enter URL"
                            : step.type === "wait"
                              ? "Enter wait time in ms"
                              : ""
                      }
                    />
                  )}
                </Form.Item>
              )}
            </StepContainer>
          ))}
        </div>
      )}

      <Button type="dashed" onClick={onAddStep} block icon={<IconPlus size={16} />} style={{ marginTop: "16px" }}>
        Add Step
      </Button>
    </Form>
  );
};

export default AddScenarioForm;
