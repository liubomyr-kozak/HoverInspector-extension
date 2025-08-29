import React, { useEffect, useState } from "react";
import { Button, Checkbox, Divider, Input, Radio, Select, Switch, Tooltip } from "antd";
import { IconWorldWww, IconRegex, IconCheck } from "@tabler/icons-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ScenarioMap, TriggerConfig, TriggerType } from "../types.ts";
import { validateDomainPattern } from "../utils/validationUtils.ts";

const { TextArea } = Input;

// Yup validation schema
const createValidationSchema = () => {
  return yup.object().shape({
    title: yup.string().required("Please enter a title for the trigger"),
    description: yup.string(),
    scenarioId: yup.string().required("Please select a scenario to run"),
    enabled: yup.boolean(),
    type: yup.string().required("Please select a trigger type"),
    condition: yup.object().shape({
      domainPattern: yup.string().when("$triggerType", {
        is: TriggerType.DOMAIN,
        then: (schema) => schema.required("Please enter a domain pattern"),
        otherwise: (schema) => schema.notRequired(),
      }),
      exactMatch: yup.boolean(),
      useRegex: yup.boolean(),
      elementXPath: yup.string().when("$triggerType", {
        is: TriggerType.ELEMENT_PRESENT,
        then: (schema) => schema.required("Please enter an XPath for the element"),
        otherwise: (schema) => schema.notRequired(),
      }),
      eventName: yup.string().when("$triggerType", {
        is: TriggerType.CUSTOM_EVENT,
        then: (schema) => schema.required("Please enter an event name"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
  });
};

interface TriggerFormProps {
  onFormChange?: (formData: TriggerConfig) => void;
  onSubmit?: (formData: TriggerConfig) => void;
  currentTrigger: TriggerConfig | null;
  scenarios: ScenarioMap;
}

/**
 * Component for adding or editing a trigger
 */
const TriggerForm: React.FC<TriggerFormProps> = ({ onFormChange, onSubmit, currentTrigger, scenarios }) => {
  // State for trigger type selection to show/hide relevant fields
  const [triggerType, setTriggerType] = useState<TriggerType>(currentTrigger?.type || TriggerType.DOMAIN);

  // State for regex mode and domain validation
  const [useRegex, setUseRegex] = useState<boolean>(currentTrigger?.condition?.useRegex || false);
  const [domainValidationError, setDomainValidationError] = useState<string | null>(null);

  // Initialize form values
  const initialValues = currentTrigger
    ? {
        ...currentTrigger,
      }
    : {
        enabled: true,
        type: TriggerType.DOMAIN,
        condition: {
          exactMatch: false,
          useRegex: false,
        },
      };

  // Initialize React Hook Form
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<TriggerConfig>({
    resolver: yupResolver(createValidationSchema()),
    defaultValues: initialValues,
    context: { triggerType },
  });

  const watchedType = watch("type");

  // Update trigger type when form type changes or currentTrigger changes
  useEffect(() => {
    if (watchedType) {
      setTriggerType(watchedType as TriggerType);
    }
  }, [watchedType]);

  useEffect(() => {
    if (currentTrigger) {
      setTriggerType(currentTrigger.type);
      setUseRegex(currentTrigger.condition?.useRegex || false);
    }
  }, [currentTrigger]);

  // Handle trigger type change
  const handleTriggerTypeChange = (value: TriggerType) => {
    setTriggerType(value);
    setValue("type", value);

    // Reset condition fields that are not relevant to the new trigger type
    const currentCondition = getValues("condition") || {};
    const resetCondition = {
      domainPattern: undefined,
      exactMatch: false,
      useRegex: false,
      elementXPath: undefined,
      eventName: undefined,
    };

    // Keep only the relevant fields based on the trigger type
    if (value === TriggerType.DOMAIN) {
      resetCondition.domainPattern = currentCondition.domainPattern;
      resetCondition.exactMatch = currentCondition.exactMatch || false;
      resetCondition.useRegex = currentCondition.useRegex || false;
      setUseRegex(currentCondition.useRegex || false);
    } else if (value === TriggerType.ELEMENT_PRESENT) {
      resetCondition.elementXPath = currentCondition.elementXPath;
    } else if (value === TriggerType.CUSTOM_EVENT) {
      resetCondition.eventName = currentCondition.eventName;
    }

    // Update the form
    setValue("condition", resetCondition);
  };

  // Get scenario options for the select dropdown
  const scenarioOptions = Object.keys(scenarios).map((key) => ({
    value: key,
    label: scenarios[key].title,
  }));

  // Handler for regex toggle
  const handleRegexToggle = (checked: boolean) => {
    setUseRegex(checked);
    const currentCondition = getValues("condition") || {};
    setValue("condition", {
      ...currentCondition,
      useRegex: checked,
    });

    // Validate current pattern with new regex setting
    const pattern = currentCondition.domainPattern;
    if (pattern) {
      const exactMatch = currentCondition.exactMatch || false;
      const error = validateDomainPattern(pattern, checked, exactMatch);
      setDomainValidationError(error);
    }
  };

  // Handler for exact match toggle
  const handleExactMatchToggle = (checked: boolean) => {
    const currentCondition = getValues("condition") || {};
    setValue("condition", {
      ...currentCondition,
      exactMatch: checked,
    });

    // Validate current pattern with new exact match setting
    const pattern = currentCondition.domainPattern;
    if (pattern) {
      const error = validateDomainPattern(pattern, useRegex, checked);
      setDomainValidationError(error);
    }
  };

  // Handler for domain pattern change
  const handleDomainPatternChange = (value: string) => {
    const currentCondition = getValues("condition") || {};
    const exactMatch = currentCondition.exactMatch || false;

    const error = validateDomainPattern(value, useRegex, exactMatch);

    setDomainValidationError(error);
  };

  // Handler for adding current URL to domain pattern
  const handleAddCurrentUrl = () => {
    try {
      const currentUrl = new URL(window.location.href);
      const domain = currentUrl.hostname;

      const currentCondition = getValues("condition") || {};
      setValue("condition", {
        ...currentCondition,
        domainPattern: domain,
      });

      // Validate the new pattern
      const exactMatch = currentCondition.exactMatch || false;
      const error = validateDomainPattern(domain, useRegex, exactMatch);
      setDomainValidationError(error);
    } catch (error) {
      console.error("Failed to get current URL:", error);
    }
  };

  // Handle form submission
  const onFormSubmit = (data: TriggerConfig) => {
    onSubmit?.(data);
  };

  // Handle form changes
  useEffect(() => {
    const subscription = watch((data) => {
      onFormChange?.(data as TriggerConfig);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFormChange]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Trigger Title</label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Enter trigger title" />}
        />
        {errors.title && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.title.message}</div>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <TextArea {...field} placeholder="Enter trigger description" rows={2} />}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Scenario to Run</label>
        <Controller
          name="scenarioId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              // @ts-ignore
              getPopupContainer={() =>
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")
              }
              placeholder="Select a scenario"
              options={scenarioOptions}
              showSearch
              optionFilterProp="label"
            />
          )}
        />
        {errors.scenarioId && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.scenarioId.message}</div>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Enabled</label>
        <Controller
          name="enabled"
          control={control}
          render={({ field: { value, onChange } }) => <Switch checked={value} onChange={onChange} />}
        />
      </div>

      <Divider orientation="left">Trigger Settings</Divider>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Trigger Type</label>
        <Controller
          name="type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Radio.Group
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                handleTriggerTypeChange(e.target.value);
              }}
            >
              <Radio.Button value={TriggerType.DOMAIN}>Domain</Radio.Button>
              <Radio.Button value={TriggerType.PAGE_LOAD}>Page Load</Radio.Button>
              <Radio.Button value={TriggerType.ELEMENT_PRESENT}>Element Present</Radio.Button>
              <Radio.Button value={TriggerType.CUSTOM_EVENT}>Custom Event</Radio.Button>
            </Radio.Group>
          )}
        />
        {errors.type && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>{errors.type.message}</div>
        )}
      </div>

      {triggerType === TriggerType.DOMAIN && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Domain Pattern</label>
            <Controller
              name="condition.domainPattern"
              control={control}
              render={({ field }) => (
                <>
                  <Input.Group compact>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleDomainPatternChange(e.target.value);
                      }}
                      placeholder={
                        useRegex
                          ? "Enter regex pattern (e.g., .*\\.example\\.com)"
                          : "Enter domain pattern (e.g., example.com)"
                      }
                      style={{ width: "calc(100% - 200px)" }}
                    />
                    <Tooltip title={useRegex ? "Toggle to simple pattern" : "Toggle to regex pattern"}>
                      <Button
                        type={useRegex ? "primary" : "default"}
                        icon={<IconRegex size={16} />}
                        onClick={() => handleRegexToggle(!useRegex)}
                        style={{ width: "60px" }}
                      >
                        {useRegex ? ".*" : "abc"}
                      </Button>
                    </Tooltip>
                    <Button
                      type="default"
                      icon={<IconWorldWww size={16} />}
                      onClick={handleAddCurrentUrl}
                      style={{ width: "140px" }}
                      title="Add current URL domain"
                    >
                      Add Current URL
                    </Button>
                  </Input.Group>
                </>
              )}
            />
            <details style={{ marginTop: "8px" }}>
              <summary style={{ cursor: "pointer", fontSize: "12px", color: "#8c8c8c", userSelect: "none" }}>
                💡 Domain Pattern Examples
              </summary>
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong>Simple Patterns:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                    <li>
                      <code>example.com</code> - matches example.com and all subdomains
                    </li>
                    <li>
                      <code>localhost:3000</code> - matches localhost on port 3000
                    </li>
                    <li>
                      <code>*.github.com</code> - matches any subdomain of github.com
                    </li>
                  </ul>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Regex Patterns:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                    <li>
                      <code>.*\.example\.com.*</code> - matches any subdomain of example.com
                    </li>
                    <li>
                      <code>http://localhost:\d+/.*</code> - matches localhost with any port and path
                    </li>
                    <li>
                      <code>.*#(app|dashboard|admin).*</code> - matches hash routes for app, dashboard, or admin
                    </li>
                    <li>
                      <code>.*/(users|projects)/\d+.*</code> - matches URLs with users or projects followed by numbers
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>Exact Match:</strong> Use the checkbox below to match the complete URL exactly, including path
                  and query parameters.
                </div>
              </div>
            </details>
            {errors.condition?.domainPattern && (
              <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
                {errors.condition.domainPattern.message}
              </div>
            )}
            {domainValidationError && (
              <div style={{ color: "#fa8c16", fontSize: "14px", marginTop: "4px" }}>⚠️ {domainValidationError}</div>
            )}
            {!domainValidationError && getValues("condition.domainPattern") && (
              <div
                style={{
                  color: "#52c41a",
                  fontSize: "14px",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <IconCheck size={16} /> Domain pattern is valid
              </div>
            )}
            {useRegex && (
              <div style={{ marginLeft: "8px", fontSize: "12px", color: "#8c8c8c" }}>
                `new RegExp("${getValues("condition.domainPattern")}").test(window.location.href);`
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Controller
              name="condition.exactMatch"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  checked={value}
                  onChange={(e) => {
                    onChange(e);
                    handleExactMatchToggle(e.target.checked);
                  }}
                  disabled={useRegex}
                >
                  Exact match {useRegex && "(disabled in regex mode)"}
                </Checkbox>
              )}
            />
          </div>
        </>
      )}

      {triggerType === TriggerType.ELEMENT_PRESENT && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Element XPath</label>
          <Controller
            name="condition.elementXPath"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Enter XPath (e.g., //button[@id='submit'])" />}
          />
          {errors.condition?.elementXPath && (
            <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
              {errors.condition.elementXPath.message}
            </div>
          )}
        </div>
      )}

      {triggerType === TriggerType.CUSTOM_EVENT && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Event Name</label>
          <Controller
            name="condition.eventName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Enter event name (e.g., myCustomEvent)" />}
          />
          <details style={{ marginTop: "8px" }}>
            <summary style={{ cursor: "pointer", fontSize: "12px", color: "#8c8c8c", userSelect: "none" }}>
              💡 Custom Event Examples
            </summary>
            <div
              style={{
                marginTop: "8px",
                padding: "8px",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <strong>Common Custom Events:</strong>
                <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                  <li>
                    <code>userLoggedIn</code> - fires when user authentication completes
                  </li>
                  <li>
                    <code>dataLoaded</code> - fires when async data loading finishes
                  </li>
                  <li>
                    <code>formSubmitted</code> - fires after form submission
                  </li>
                  <li>
                    <code>modalOpened</code> - fires when modal dialog appears
                  </li>
                </ul>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Analytics Events:</strong>
                <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                  <li>
                    <code>pageViewComplete</code> - fires when page view tracking is done
                  </li>
                  <li>
                    <code>conversionTracked</code> - fires when conversion is recorded
                  </li>
                  <li>
                    <code>experimentActivated</code> - fires when A/B test is activated
                  </li>
                </ul>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>E-commerce Events:</strong>
                <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                  <li>
                    <code>addToCart</code> - fires when item is added to cart
                  </li>
                  <li>
                    <code>checkoutStarted</code> - fires when checkout process begins
                  </li>
                  <li>
                    <code>purchaseCompleted</code> - fires when purchase is finalized
                  </li>
                </ul>
              </div>
              <div>
                <strong>How to trigger:</strong> Use <code>window.dispatchEvent(new CustomEvent('eventName'))</code> or
                popular analytics libraries like Google Analytics, Mixpanel, etc.
              </div>
            </div>
          </details>
          {errors.condition?.eventName && (
            <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
              {errors.condition.eventName.message}
            </div>
          )}
        </div>
      )}
    </form>
  );
};

export default TriggerForm;
