import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Space, Divider, Tooltip, Dropdown, Menu } from "antd";
import { useSelector } from "react-redux";
import { ScenarioStep, stepTypeOptions } from "../types";
import { selectFunctions, selectStoredValues } from "@entrypoints/content/store/automation/automation.slice.ts";

interface StepEditFormProps {
  step: ScenarioStep;
  visible: boolean;
  onClose: () => void;
  onSave: (updatedStep: ScenarioStep) => void;
}

/**
 * Form a component for editing a step in a scenario
 */
const StepEditForm: React.FC<StepEditFormProps> = ({ step, onClose, onSave }) => {
  const functions = useSelector(selectFunctions);
  const storedValues = useSelector(selectStoredValues);

  // Local state for the form
  const [formValues, setFormValues] = useState<ScenarioStep>({
    type: step.type || "",
    xpath: step.xpath || "",
    value: step.value || "",
  });

  // Update local state when the step prop changes
  useEffect(() => {
    setFormValues({
      type: step.type || "",
      xpath: step.xpath || "",
      value: step.value || "",
    });
  }, [step]);

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
  const handleSubmit = () => {
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
      case "click":
      case "hover":
        return (
          <Form.Item label="Element XPath" required>
            <Input
              value={formValues.xpath}
              onChange={(e) => handleChange("xpath", e.target.value)}
              placeholder="XPath of the element to interact with"
            />
          </Form.Item>
        );

      case "value":
      case "input":
      case "select":
        return (
          <>
            <Form.Item label="Element XPath" required>
              <Input
                value={formValues.xpath}
                onChange={(e) => handleChange("xpath", e.target.value)}
                placeholder="XPath of the element to set value for"
              />
            </Form.Item>
            <Form.Item label="Value" required>
              <Input
                value={formValues.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="Value to set"
                addonAfter={
                  Object.keys(storedValues).length > 0 ? (
                    <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                      <Button size="small">Insert Variable</Button>
                    </Dropdown>
                  ) : null
                }
              />
              {Object.keys(storedValues).length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can use stored values with ${"{variableName}"} syntax
                </div>
              )}
            </Form.Item>
          </>
        );

      case "getText":
        return (
          <>
            <Form.Item label="Element XPath" required>
              <Input
                value={formValues.xpath}
                onChange={(e) => handleChange("xpath", e.target.value)}
                placeholder="XPath of the element to get text from"
              />
            </Form.Item>
            <Form.Item label="Storage Key" required>
              <Input
                value={formValues.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="Key to store the text under (e.g., 'username' or leave empty for random key)"
              />
              <div className="text-xs text-gray-500 mt-1">
                Tip: Leave empty to generate a random key, or provide a descriptive name
              </div>
            </Form.Item>
            {Object.keys(storedValues).length > 0 && (
              <Form.Item label="Stored Values">
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
              </Form.Item>
            )}
          </>
        );

      case "code":
        return (
          <Form.Item label="JavaScript Code" required>
            <Input.TextArea
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="Enter JavaScript code to execute"
              rows={4}
            />
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
          </Form.Item>
        );

      case "function":
        return (
          <Form.Item label="Function" required>
            <Select
              value={formValues.value}
              onChange={(value) => handleChange("value", value)}
              placeholder="Select a function to execute"
              options={getFunctionOptions()}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
            />
          </Form.Item>
        );

      case "redirect":
        return (
          <Form.Item label="URL" required>
            <Input
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="URL to navigate to"
              addonAfter={
                Object.keys(storedValues).length > 0 ? (
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                ) : null
              }
            />
            {Object.keys(storedValues).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Tip: You can use stored values with ${"{variableName}"} syntax
              </div>
            )}
          </Form.Item>
        );

      case "wait":
        return (
          <Form.Item label="Wait Time (ms)" required>
            <Input
              type="number"
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="Time to wait in milliseconds"
              addonAfter={
                Object.keys(storedValues).length > 0 ? (
                  <Dropdown menu={{ items: storedValueMenuItems }} trigger={["click"]}>
                    <Button size="small">Insert Variable</Button>
                  </Dropdown>
                ) : null
              }
            />
            {Object.keys(storedValues).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Tip: You can use stored values with ${"{variableName}"} syntax
              </div>
            )}
          </Form.Item>
        );

      case "confirmation":
        return (
          <Form.Item label="Confirmation Message" required>
            <Input.TextArea
              value={formValues.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="Enter the message to display in the confirmation notification"
              rows={2}
            />
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
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Step Type" required>
        <Select
          value={formValues.type}
          onChange={(value) => handleChange("type", value)}
          placeholder="Select step type"
          options={stepTypeOptions}
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
        />
      </Form.Item>

      {renderTypeSpecificFields()}

      <Divider style={{ margin: "12px 0" }} />

      <Form.Item>
        <Space className="w-full flex justify-end">
          <Button type="primary" onClick={handleSubmit}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default StepEditForm;
