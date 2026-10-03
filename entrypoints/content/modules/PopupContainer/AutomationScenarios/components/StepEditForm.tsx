import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Subscription } from "rxjs";
import { filter as rxFilter } from "rxjs/operators";
import { Button, Checkbox, Divider, Dropdown, Input, Select, Space } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSelector } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { AimOutlined, DeleteOutlined, SelectOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import { getFilteredStepTypeOptions, ScenarioStep, StepType } from "../types";
import { useServerSettings } from "../hooks/useServerSettings";
import { selectFunctions, selectStoredValues } from "@entrypoints/content/store/automation/automation.slice";
import { generateXPaths } from "../utils/xpathUtils";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";

// Steps that act on an element of the page
const ELEMENT_STEP_TYPES = [
  StepType.CLICK,
  StepType.HOVER,
  StepType.VALUE,
  StepType.INPUT,
  StepType.SELECT,
  StepType.GET_TEXT,
  StepType.WAIT_ELEMENT_VISIBLE,
];

// Yup validation schema matching ScenarioStep interface
const validationSchema = yup.object().shape({
  type: yup.string().required("Please select a step type"),
  xpath: yup.string().when("type", {
    is: (type: string) => ELEMENT_STEP_TYPES.includes(type as StepType),
    then: (schema) => schema.trim().required("Please enter the XPath of the element"),
    otherwise: (schema) => schema.notRequired(),
  }),
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
        StepType.GET_TEXT,
        StepType.CONFIRMATION,
        StepType.NOTIFICATION,
      ].includes(type as StepType),
    then: (schema) => schema.required("Please enter a value"),
    otherwise: (schema) => schema.notRequired(),
  }),
  xpathAutoUpdated: yup.boolean().notRequired(),
});

interface StepEditFormProps {
  step: ScenarioStep;
  onClose: () => void;
  onSave: (updatedStep: ScenarioStep) => void;
  onChange?: (updatedStep: ScenarioStep) => void;
  onDelete?: () => void;
  onMoveUp?: (stepIndex: number) => void;
  onMoveDown?: (stepIndex: number) => void;
  stepIndex?: number;
  totalSteps?: number;
  isSingleItem?: boolean;
}

type StepFormErrors = Partial<Record<keyof ScenarioStep, { message: string }>>;

// Validates the step; returns the error of each invalid field
const validateStep = (values: ScenarioStep): StepFormErrors => {
  try {
    validationSchema.validateSync(values, { abortEarly: false });
    return {};
  } catch (error) {
    const errors: StepFormErrors = {};
    ((error as yup.ValidationError).inner || []).forEach((inner) => {
      const field = inner.path as keyof ScenarioStep;
      if (field && !errors[field]) {
        errors[field] = { message: inner.message };
      }
    });
    return errors;
  }
};

// Used when no step is given (e.g. while a new scenario renders): one shared object, so effects
// depending on the step don't run on every render
const EMPTY_STEP = {} as ScenarioStep;

/**
 * Form a component for editing a step in a scenario
 */
const StepEditForm: React.FC<StepEditFormProps> = ({
  step = EMPTY_STEP,
  onClose,
  onSave,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  stepIndex = 0,
  totalSteps = 1,
  isSingleItem,
}) => {
  const functions = useSelector(selectFunctions);
  const storedValues = useSelector(selectStoredValues);
  const { syncFunctions } = useServerSettings();
  const stepTypeOptions = getFilteredStepTypeOptions(syncFunctions);
  const highlightManager = useHighlightOverlay();

  // Initialize React Hook Form
  const { control } = useForm<ScenarioStep>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: step?.type || StepType.CLICK,
      xpath: step?.xpath || "",
      value: step?.value || "",
      alternativeXpaths: step?.alternativeXpaths || [],
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
            highlightManager.stopMouseMoveHighlight();
          },
        });

      // Cleanup function to unsubscribe
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectingElement, highlightManager, handleElementSelected]);

  // Local state for the form
  // Keeps every field of the step (enableNavigation, delay, xpathAutoUpdated...), not only the edited ones
  const toFormValues = (source: ScenarioStep): ScenarioStep => ({
    ...source,
    type: source?.type || StepType.NOT_SET,
    xpath: source?.xpath || "",
    value: source?.value || "",
    alternativeXpaths: source?.alternativeXpaths || [],
  });

  const [formValues, setFormValues] = useState<ScenarioStep>(() => toFormValues(step));

  // Update local state when the step changes (compared by content: parents may pass a new object each render)
  const stepKey = JSON.stringify(step);
  useEffect(() => {
    setFormValues(toFormValues(step));
  }, [stepKey]);

  // Errors are shown for the fields the user changed, and for all fields once they tried to save
  const [touchedFields, setTouchedFields] = useState<Set<keyof ScenarioStep>>(() => new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const validationErrors = useMemo(() => validateStep(formValues), [formValues]);
  const errors: StepFormErrors = useMemo(() => {
    if (submitAttempted) return validationErrors;
    const visible: StepFormErrors = {};
    (Object.keys(validationErrors) as (keyof ScenarioStep)[]).forEach((field) => {
      if (touchedFields.has(field)) visible[field] = validationErrors[field];
    });
    return visible;
  }, [validationErrors, touchedFields, submitAttempted]);

  // Live mode: report every user edit to the parent (used where the form has no own Save button)
  useEffect(() => {
    if (!onChange) return;
    if (JSON.stringify(formValues) !== JSON.stringify(toFormValues(step))) {
      onChange(formValues);
    }
  }, [formValues]);

  // Cleanup element selection on component unmount
  useEffect(() => {
    return () => {
      if (selectingElement) {
        highlightManager.stopSelectionMode();
      }
    };
  }, [selectingElement, highlightManager]);

  // Handle form field changes
  const handleChange = (field: keyof ScenarioStep, value: string | boolean) => {
    setTouchedFields((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
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
    setSubmitAttempted(true);
    if (Object.keys(validationErrors).length > 0) return;
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

      case StepType.WAIT_ELEMENT_VISIBLE:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Element XPath *</label>
              <Input
                value={formValues.xpath}
                onChange={(e) => handleChange("xpath", e.target.value)}
                placeholder="XPath of the element to wait for"
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
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Timeout (ms)</label>
              <Input
                type="number"
                value={formValues.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="10000"
                min={1000}
                max={60000}
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
              <div className="text-xs text-gray-500 mt-1">
                Maximum time to wait for element to become visible (1000-60000ms, default: 10000ms)
              </div>
              {Object.keys(storedValues).length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can use stored values with ${"{variableName}"} syntax
                </div>
              )}
            </div>
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

      <div className="w-full flex justify-end">
        <Space>
          {onMoveUp && (
            <Tooltip title="Move step up">
              <Button
                type="text"
                size="small"
                className="step-action-btn !p-0.5 !h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 transition-colors !bg-slate-50 dark:!bg-slate-800"
                icon={<UpOutlined />}
                disabled={stepIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(stepIndex);
                }}
              />
            </Tooltip>
          )}
          {onMoveDown && (
            <Tooltip title="Move step down">
              <Button
                type="text"
                size="small"
                className="step-action-btn !p-0.5 !h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 transition-colors !bg-slate-50 dark:!bg-slate-800"
                icon={<DownOutlined />}
                disabled={stepIndex === totalSteps - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(stepIndex);
                }}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Button type="default" danger icon={<DeleteOutlined />} onClick={onDelete}>
              Delete
            </Button>
          )}

          {isSingleItem && (
            <>
              <Button type="primary" onClick={handleFormSubmit}>
                Save
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </>
          )}
        </Space>
      </div>
    </div>
  );
};

export default StepEditForm;
