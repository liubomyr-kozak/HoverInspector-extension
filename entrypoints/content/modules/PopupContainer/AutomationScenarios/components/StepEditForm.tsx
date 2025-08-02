import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Space, Divider, Tooltip, Dropdown, Menu } from "antd";
import { useSelector } from "react-redux";
import { AimOutlined, SelectOutlined } from "@ant-design/icons";
import { ScenarioStep, getFilteredStepTypeOptions } from "../types";
import { useServerSettings } from "../hooks/useServerSettings";
import { selectFunctions, selectStoredValues } from "@entrypoints/content/store/automation/automation.slice.ts";
import { generateXPath, generateXPaths } from "../utils/xpathUtils.ts";

interface StepEditFormProps {
  step: ScenarioStep;
  visible: boolean;
  onClose: () => void;
  onSave: (updatedStep: ScenarioStep) => void;
}

/**
 * Form a component for editing a step in a scenario
 */
// step = {} додав, виникає коли новий ценарій був доданий, і він перемальовується.. тимчасово постійне рішення
const StepEditForm: React.FC<StepEditFormProps> = ({ step = {} as ScenarioStep, onClose, onSave }) => {
  const functions = useSelector(selectFunctions);
  const storedValues = useSelector(selectStoredValues);
  const { syncFunctions } = useServerSettings();
  const stepTypeOptions = getFilteredStepTypeOptions(syncFunctions);

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
      console.log(`Primary XPath failed, trying ${alternativeXpaths.length} alternative XPaths`);
      
      for (const altXPath of alternativeXpaths) {
        try {
          const result = document.evaluate(
            altXPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          
          const element = result.singleNodeValue as HTMLElement;
          if (element) {
            console.log(`Found element using alternative XPath: ${altXPath}`);
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

  // Helper function to flash an element to make it more noticeable
  const flashElement = (element: HTMLElement) => {
    // Add a CSS class for the flash effect
    element.classList.add("xpath-highlight-flash");

    // Remove the flash effect after animation completes
    setTimeout(() => {
      element.classList.remove("xpath-highlight-flash");
    }, 1500);
  };

  // Function to find and highlight an element by XPath
  const findElementByXPath = (xpath: string) => {
    try {
      // Remove any existing highlights
      const existingHighlights = document.querySelectorAll(".xpath-highlight");
      existingHighlights.forEach((el) => {
        el.classList.remove("xpath-highlight");
      });

      // Find the element by XPath, using alternative XPaths if available
      const element = getElementByXPath(xpath, formValues.alternativeXpaths);

      if (element) {
        // Add highlight class
        element.classList.add("xpath-highlight");

        // Scroll to the element
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Flash the element to make it more noticeable
        flashElement(element);

        // Remove highlight class after 2 seconds
        setTimeout(() => {
          element.classList.remove("xpath-highlight");
        }, 2000);
      } else {
        console.warn(`Element not found with XPath: ${xpath}`);
      }
    } catch (error) {
      console.error("Error finding element by XPath:", error);
    }
  };
  
  // State for element selection mode
  const [selectingElement, setSelectingElement] = useState(false);
  
  // Function to enter element selection mode
  const startElementSelection = () => {
    // Show feedback to the user
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = 'Click on an element to select it';
    feedbackElement.style.position = 'fixed';
    feedbackElement.style.top = '20px';
    feedbackElement.style.left = '50%';
    feedbackElement.style.transform = 'translateX(-50%)';
    feedbackElement.style.backgroundColor = '#1890ff';
    feedbackElement.style.color = 'white';
    feedbackElement.style.padding = '8px 16px';
    feedbackElement.style.borderRadius = '4px';
    feedbackElement.style.zIndex = '9999';
    document.body.appendChild(feedbackElement);
    
    // Set selecting element mode
    setSelectingElement(true);
    
    // Create a style element for hover highlighting
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .xpath-hover-highlight {
        outline: 2px dashed #52c41a !important;
        outline-offset: 2px !important;
        background-color: rgba(82, 196, 26, 0.1) !important;
        transition: all 0.2s ease-in-out !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Add mouseover and mouseout event listeners for hover effect
    const mouseoverHandler = (e: MouseEvent) => {
      const hoveredElement = e.target as Element;
      
      // Skip if the element is part of the extension UI
      if (hoveredElement.tagName === 'HOVER-INSPECTOR' || 
          (hoveredElement as HTMLElement).className?.includes?.('zTool')) {
        return;
      }
      
      // Add hover highlight class
      hoveredElement.classList.add('xpath-hover-highlight');
    };
    
    const mouseoutHandler = (e: MouseEvent) => {
      const hoveredElement = e.target as Element;
      
      // Remove hover highlight class
      hoveredElement.classList.remove('xpath-hover-highlight');
    };
    
    // Add the hover event listeners
    document.addEventListener('mouseover', mouseoverHandler, true);
    document.addEventListener('mouseout', mouseoutHandler, true);
    
    // Add click event listener to document
    const clickHandler = (e: MouseEvent) => {
      // Prevent default behavior
      e.preventDefault();
      e.stopPropagation();
      
      // Get the clicked element
      const clickedElement = e.target as Element;
      
      // Generate XPaths for the clicked element
      const { primaryXPath, alternativeXpaths } = generateXPaths(clickedElement);
      
      // Update the form values with the new XPath
      if (primaryXPath) {
        // Update the primary XPath
        handleChange("xpath", primaryXPath);
        
        // Store alternative XPaths in the step
        setFormValues(prev => ({
          ...prev,
          alternativeXpaths: alternativeXpaths
        }));
        
        // Highlight the selected element
        clickedElement.classList.add("xpath-highlight");
        flashElement(clickedElement as HTMLElement);
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          clickedElement.classList.remove("xpath-highlight");
        }, 2000);
      }
      
      // Exit selection mode
      setSelectingElement(false);
      
      // Remove the feedback element
      if (document.body.contains(feedbackElement)) {
        document.body.removeChild(feedbackElement);
      }
      
      // Remove the style element
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
      
      // Remove all event listeners
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('mouseover', mouseoverHandler, true);
      document.removeEventListener('mouseout', mouseoutHandler, true);
      
      // Remove any remaining hover highlights
      document.querySelectorAll('.xpath-hover-highlight').forEach(el => {
        el.classList.remove('xpath-hover-highlight');
      });
    };
    
    // Add the click event listener
    document.addEventListener('click', clickHandler, true);
    
    // Set a timeout to exit selection mode if no element is selected
    setTimeout(() => {
      if (selectingElement) {
        setSelectingElement(false);
        
        // Remove the feedback element
        if (document.body.contains(feedbackElement)) {
          document.body.removeChild(feedbackElement);
        }
        
        // Remove the style element
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
        
        // Remove all event listeners
        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('mouseover', mouseoverHandler, true);
        document.removeEventListener('mouseout', mouseoutHandler, true);
        
        // Remove any remaining hover highlights
        document.querySelectorAll('.xpath-hover-highlight').forEach(el => {
          el.classList.remove('xpath-hover-highlight');
        });
      }
    }, 10000); // 10 seconds timeout
  };

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
              addonAfter={
                <Space>
                  <Tooltip title="Find element in page">
                    <Button
                      type="text"
                      size="small"
                      icon={<AimOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => formValues.xpath && findElementByXPath(formValues.xpath)}
                      disabled={!formValues.xpath}
                    />
                  </Tooltip>
                  <Tooltip title="Select element from page">
                    <Button
                      type="text"
                      size="small"
                      icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                      onClick={startElementSelection}
                      disabled={selectingElement}
                    />
                  </Tooltip>
                </Space>
              }
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
                addonAfter={
                  <Space>
                    <Tooltip title="Find element in page">
                      <Button
                        type="text"
                        size="small"
                        icon={<AimOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => formValues.xpath && findElementByXPath(formValues.xpath)}
                        disabled={!formValues.xpath}
                      />
                    </Tooltip>
                    <Tooltip title="Select element from page">
                      <Button
                        type="text"
                        size="small"
                        icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                        onClick={startElementSelection}
                        disabled={selectingElement}
                      />
                    </Tooltip>
                  </Space>
                }
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
                addonAfter={
                  <Space>
                    <Tooltip title="Find element in page">
                      <Button
                        type="text"
                        size="small"
                        icon={<AimOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => formValues.xpath && findElementByXPath(formValues.xpath)}
                        disabled={!formValues.xpath}
                      />
                    </Tooltip>
                    <Tooltip title="Select element from page">
                      <Button
                        type="text"
                        size="small"
                        icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                        onClick={startElementSelection}
                        disabled={selectingElement}
                      />
                    </Tooltip>
                  </Space>
                }
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
        return syncFunctions ? (
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
        ) : null;

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
