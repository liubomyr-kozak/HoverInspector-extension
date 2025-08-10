import React, { useEffect, useState, useCallback } from "react";
import { Subscription } from "rxjs";
import { filter as rxFilter } from "rxjs/operators";
import { Button, Checkbox, Divider, Dropdown, Input, Select, Space } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSelector } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { AimOutlined, DeleteOutlined, SelectOutlined } from "@ant-design/icons";
import { getFilteredStepTypeOptions, ScenarioStep, StepType } from "../types";
import { useServerSettings } from "../hooks/useServerSettings";
import { selectFunctions, selectStoredValues } from "@entrypoints/content/store/automation/automation.slice";
import { generateXPaths } from "../utils/xpathUtils";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";

// Yup validation schema matching ScenarioStep interface
const validationSchema = yup.object().shape({
  type: yup.string().required("Please select a step type"),
  xpath: yup.string().notRequired(),
  alternativeXpaths: yup.array().of(yup.string()).notRequired(),
  value: yup.string().when("type", {
    is: (type: string) =>
      [
        StepType.INPUT,
        StepType.VALUE,
        StepType.CODE,
        StepType.REDIRECT,
        StepType.WAIT,
        StepType.WAIT_ELEMENT_VISIBLE,
        StepType.FUNCTION,
        StepType.NAVIGATE,
      ].includes(type as StepType),
    then: (schema) => schema.required("Please enter a value"),
    otherwise: (schema) => schema.notRequired(),
  }),
  xpathAutoUpdated: yup.boolean().notRequired(),
});

interface StepEditFormProps {
  step: ScenarioStep;
  visible: boolean;
  onClose: () => void;
  onSave: (updatedStep: ScenarioStep) => void;
  onDelete?: () => void;
}

/**
 * Form a component for editing a step in a scenario
 */
// step = {} додав, виникає коли новий ценарій був доданий, і він перемальовується.. тимчасово постійне рішення
const StepEditForm: React.FC<StepEditFormProps> = ({ step = {} as ScenarioStep, onClose, onSave, onDelete }) => {
  const functions = useSelector(selectFunctions);
  const storedValues = useSelector(selectStoredValues);
  const { syncFunctions } = useServerSettings();
  const stepTypeOptions = getFilteredStepTypeOptions(syncFunctions);
  const highlightManager = useHighlightOverlay();

  // Initialize React Hook Form
  const {
    control,
    formState: { errors },
  } = useForm<ScenarioStep>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: step.type || StepType.CLICK,
      xpath: step.xpath || "",
      value: step.value || "",
      alternativeXpaths: step.alternativeXpaths || [],
      ...step,
    },
    mode: "onChange",
  });

  // Helper function to find DOM elements by XPath
  const getElementByXPath = (xpath: string, alternativeXpaths?: string[]): HTMLElement | null => {
    // First try the primary XPath
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const element = result.singleNodeValue as HTMLElement;
      if (element) {
        return element;
      }
    } catch (error) {
      console.error("Error evaluating primary XPath:", error);
    }

    // If primary XPath failed and we have alternatives, try them
    if (alternativeXpaths && alternativeXpaths.length > 0) {
      for (const altXPath of alternativeXpaths) {
        try {
          const result = document.evaluate(altXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

          const element = result.singleNodeValue as HTMLElement;
          if (element) {
            return element;
          }
        } catch (error) {
          console.error(`Error evaluating alternative XPath: ${altXPath}`, error);
          // Continue to the next alternative
        }
      }
    }

    // If we get here, all XPaths failed
    console.warn(`Element not found with XPath: ${xpath}`);
    return null;
  };

  // Centralized highlight via useHighlightOverlay hook
  const highlightElement = (primary: string) => {
    if (!primary) return;
    // Attempt primary then alternatives to verify existence before scroll (optional)
    const candidates = [primary, ...(formValues.alternativeXpaths || [])];
    let chosen = primary;
    for (const xp of candidates) {
      try {
        const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (r.singleNodeValue) {
          chosen = xp;
          (r.singleNodeValue as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      } catch {}
    }
    highlightManager.startHighlight(chosen);
  };

  // Element selection state
  const [selectingElement, setSelectingElement] = useState(false);

  // Handle element selection with proper event management
  const handleElementSelected = useCallback((xpath: string, element: Element) => {
    // Generate alternative XPaths for the selected element
    let alternativeXpaths: string[] = [];
    if (element) {
      const xpathResult = generateXPaths(element);
      alternativeXpaths = xpathResult.alternativeXpaths;
    }

    // Update the primary XPath
    handleChange("xpath", xpath);

    // Store alternative XPaths in the step
    setFormValues((prev) => ({
      ...prev,
      alternativeXpaths: alternativeXpaths,
    }));

    // Reset selection state
    setSelectingElement(false);
  }, []);

  // Start element selection function using RxJS streams
  const startElementSelectionMode = useCallback(() => {
    setSelectingElement(true);
  }, []);

  // Set up RxJS stream subscription for element selection
  useEffect(() => {
    if (selectingElement) {
      // Subscribe to the stream-based selection mode
      const subscription: Subscription = highlightManager
        .streamSelectionMode()
        .pipe(
          // Filter for element selected events
          rxFilter((event) => event.type === "selected"),
        )
        .subscribe({
          next: (event) => {
            if (event.xpath && event.element) {
              handleElementSelected(event.xpath, event.element);
            }
          },
          error: (error) => {
            console.error("Element selection stream error:", error);
            setSelectingElement(false);
          },
          complete: () => {
            setSelectingElement(false);
          },
        });

      // Cleanup function to unsubscribe
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectingElement, highlightManager, handleElementSelected]);

  // Local state for the form
  const [formValues, setFormValues] = useState<ScenarioStep>({
    type: step.type || "",
    xpath: step.xpath || "",
    value: step.value || "",
    alternativeXpaths: step.alternativeXpaths || [],
  });

  // Update local state when the step prop changes
  useEffect(() => {
    setFormValues({
      type: step.type || "",
      xpath: step.xpath || "",
      value: step.value || "",
      alternativeXpaths: step.alternativeXpaths || [],
    });
  }, [step]);

  // Cleanup element selection on component unmount
  useEffect(() => {
    return () => {
      if (selectingElement) {
        highlightManager.stopSelectionMode();
      }
    };
  }, [selectingElement, highlightManager]);

  // Handle form field changes
  const handleChange = (field: keyof ScenarioStep, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Insert a stored value reference into the current value field
  const insertStoredValue = (key: string) => {
    const variableReference = `\${${key}}`;
    const currentValue = formValues.value || "";
    const newValue = currentValue + variableReference;
    handleChange("value", newValue);
  };

  // Handle form submission
  const handleFormSubmit = () => {
    onSave(formValues);
  };

  // Create menu items for stored values
  const storedValueMenuItems = Object.keys(storedValues).map((key) => ({
    key,
    label: `${key}: ${storedValues[key]}`,
    onClick: () => insertStoredValue(key),
  }));

  // Get function options for the function type step
  const getFunctionOptions = () => {
    return Object.entries(functions).map(([id, func]) => ({
      value: id,
      label: func.title,
    }));
  };

  // Render different form fields based on step type
  const renderTypeSpecificFields = () => {
    switch (formValues.type) {
      case StepType.CLICK:
      case StepType.HOVER:
        return (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Element XPath *</label>
            <Input
              value={formValues.xpath}
              onChange={(e) => handleChange("xpath", e.target.value)}
              placeholder="XPath of the element to interact with"
              status={errors.xpath ? "error" : undefined}
              addonAfter={
                <Space>
                  <Tooltip title="Find element in page">
                    <Button
                      type="text"
                      size="small"
                      icon={<AimOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => formValues.xpath && highlightElement(formValues.xpath)}
                      disabled={!formValues.xpath}
                    />
                  </Tooltip>
                  <Tooltip title="Select element from page">
                    <Button
                      type="text"
                      size="small"
                      icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                      onClick={startElementSelectionMode}
                      disabled={selectingElement}
                    />
                  </Tooltip>
                </Space>
              }
            />
            {errors.xpath && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.xpath.message}</div>
            )}
          </div>
        );

      case StepType.VALUE:
      case StepType.INPUT:
      case StepType.SELECT:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Element XPath *</label>
              <Input
                value={formValues.xpath}
                onChange={(e) => handleChange("xpath", e.target.value)}
                placeholder="XPath of the element to set value for"
                status={errors.xpath ? "error" : undefined}
                addonAfter={
                  <Space>
                    <Tooltip title="Find element in page">
                      <Button
                        type="text"
                        size="small"
                        icon={<AimOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => formValues.xpath && highlightElement(formValues.xpath)}
                        disabled={!formValues.xpath}
                      />
                    </Tooltip>
                    <Tooltip title="Select element from page">
                      <Button
                        type="text"
                        size="small"
                        icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                        onClick={startElementSelectionMode}
                        disabled={selectingElement}
                      />
                    </Tooltip>
                  </Space>
                }
              />
              {errors.xpath && (
                <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.xpath.message}</div>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Value *</label>
              <Input
                value={formValues.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="Value to set"
                status={errors.value ? "error" : undefined}
                addonAfter={
                  Object.keys(storedValues).length > 0 ? (
                    <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                      <Button size="small">Insert Variable</Button>
                    </Dropdown>
                  ) : null
                }
              />
              {errors.value && (
                <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
              )}
              {Object.keys(storedValues).length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can use stored values with ${"{variableName}"} syntax
                </div>
              )}
            </div>
          </div>
        );

      case StepType.GET_TEXT:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Element XPath *</label>
              <Input
                value={formValues.xpath}
                onChange={(e) => handleChange("xpath", e.target.value)}
                placeholder="XPath of the element to get text from"
                status={errors.xpath ? "error" : undefined}
                addonAfter={
                  <Space>
                    <Tooltip title="Find element in page">
                      <Button
                        type="text"
                        size="small"
                        icon={<AimOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => formValues.xpath && highlightElement(formValues.xpath)}
                        disabled={!formValues.xpath}
                      />
                    </Tooltip>
                    <Tooltip title="Select element from page">
                      <Button
                        type="text"
                        size="small"
                        icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                        onClick={startElementSelectionMode}
                        disabled={selectingElement}
                      />
                    </Tooltip>
                  </Space>
                }
              />
              {errors.xpath && (
                <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.xpath.message}</div>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Storage Key *</label>
              <Input
                value={formValues.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="Key to store the text under (e.g., 'username' or leave empty for random key)"
                status={errors.value ? "error" : undefined}
              />
              {errors.value && (
                <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Tip: Leave empty to generate a random key, or provide a descriptive name
              </div>
            </div>
            {Object.keys(storedValues).length > 0 && (
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Stored Values</label>
                <div className="text-xs text-gray-500 mb-2">
                  Currently stored values that can be used in other steps:
                </div>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                  {Object.entries(storedValues).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <strong>{key}:</strong> {value.length > 50 ? `${value.substring(0, 50)}...` : value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case StepType.CODE:
        return (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>JavaScript Code *</label>
            <Input.TextArea
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="Enter JavaScript code to execute"
              rows={4}
              status={errors.value ? "error" : undefined}
            />
            {errors.value && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
            )}
            {Object.keys(storedValues).length > 0 && (
              <>
                <div className="mt-2">
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can use stored values with ${"{variableName}"} syntax
                </div>
              </>
            )}
          </div>
        );

      case StepType.FUNCTION:
        return syncFunctions ? (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Function *</label>
            <Select
              value={formValues.value}
              onChange={(value) => handleChange("value", value)}
              placeholder="Select a function to execute"
              options={getFunctionOptions()}
              status={errors.value ? "error" : undefined}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
            />
            {errors.value && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
            )}
          </div>
        ) : null;

      case StepType.REDIRECT:
        return (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>URL *</label>
            <Input
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="URL to navigate to"
              status={errors.value ? "error" : undefined}
              addonAfter={
                Object.keys(storedValues).length > 0 ? (
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                ) : null
              }
            />
            {errors.value && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
            )}
            {Object.keys(storedValues).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Tip: You can use stored values with ${"{variableName}"} syntax
              </div>
            )}
          </div>
        );

      case StepType.NAVIGATE:
        return (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Navigation URL *</label>
            <Input
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="URL to navigate to"
              status={errors.value ? "error" : undefined}
              addonAfter={
                Object.keys(storedValues).length > 0 ? (
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                ) : null
              }
            />
            {errors.value && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
            )}
            {Object.keys(storedValues).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Tip: You can use stored values with ${"{variableName}"} syntax
              </div>
            )}
            
            {/* Enable Navigation checkbox for navigate step type */}
            <div style={{ marginTop: "16px" }}>
              <Tooltip title="When enabled, this navigation step will be executed during playback">
                <Checkbox 
                  checked={formValues.enableNavigation || false}
                  onChange={(e) => handleChange("enableNavigation", e.target.checked)}
                  style={{ fontSize: "12px" }}
                >
                  Enable Navigation
                </Checkbox>
              </Tooltip>
            </div>
          </div>
        );

      case StepType.WAIT:
        return (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Wait Time (ms) *</label>
            <Input
              type="number"
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="Time to wait in milliseconds"
              status={errors.value ? "error" : undefined}
              addonAfter={
                Object.keys(storedValues).length > 0 ? (
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                ) : null
              }
            />
            {errors.value && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
            )}
            {Object.keys(storedValues).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Tip: You can use stored values with ${"{variableName}"} syntax
              </div>
            )}
          </div>
        );

      case StepType.CONFIRMATION:
        return (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Confirmation Message *</label>
            <Input.TextArea
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="Enter the message to display in the confirmation notification"
              rows={2}
              status={errors.value ? "error" : undefined}
            />
            {errors.value && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
            )}
            {Object.keys(storedValues).length > 0 && (
              <>
                <div className="mt-2">
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can use stored values with ${"{variableName}"} syntax
                </div>
              </>
            )}
          </div>
        );

      case StepType.NOTIFICATION:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Notification Message *</label>
              <Input.TextArea
                value={formValues.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="Enter the message to display in the notification"
                rows={2}
                status={errors.value ? "error" : undefined}
              />
              {errors.value && (
                <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.value.message}</div>
              )}
              {Object.keys(storedValues).length > 0 && (
                <>
                  <div className="mt-2">
                    <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                      <Button size="small">Insert Variable</Button>
                    </Dropdown>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Tip: You can use stored values with ${"{variableName}"} syntax
                  </div>
                </>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Auto Close Time (ms)</label>
              <Input
                type="number"
                value={(formValues as any).delay}
                onChange={(e) => handleChange("delay", e.target.value)}
                placeholder="3000"
                min={1000}
                max={10000}
              />
              <div className="text-xs text-gray-500 mt-1">
                Time in milliseconds before the notification automatically closes (1000-10000ms, default: 3000ms)
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Step Type *</label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              className="w-[50%]"
              value={formValues.type}
              onChange={(value) => {
                field.onChange(value);
                handleChange("type", value);
              }}
              placeholder="Select step type"
              options={stepTypeOptions}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              status={errors.type ? "error" : undefined}
            />
          )}
        />
        {errors.type && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.type.message}</div>
        )}
      </div>

      {renderTypeSpecificFields()}

      <Divider style={{ margin: "12px 0" }} />

      <div className="w-full flex justify-between">
        {onDelete && (
          <Button type="default" danger icon={<DeleteOutlined />} onClick={onDelete}>
            Delete
          </Button>
        )}
        <Space className={onDelete ? "" : "w-full flex justify-end"}>
          <Button type="primary" onClick={handleFormSubmit}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </Space>
      </div>
    </div>
  );
};

export default StepEditForm;
