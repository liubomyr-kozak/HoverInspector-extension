import React, { useEffect, useId, useMemo, useState } from "react";
import { AutoComplete, Button, Dropdown, Input, InputNumber, Select, Switch } from "antd";
import { useSelector } from "react-redux";
import { IconArrowDown, IconArrowUp, IconTrash, IconVariable } from "@tabler/icons-react";
import { getFilteredStepTypeOptions, ScenarioStep, StepType, stepTypeHints } from "../types";
import { useServerSettings } from "../hooks/useServerSettings";
import { selectFunctions, selectStoredValues } from "@entrypoints/content/store/automation/automation.slice";
import { KEY_PRESS_OPTIONS } from "../utils/keyboardUtils";
import { parseSelectValues } from "../utils/recordingUtils";
import { getStepIcon } from "../utils/stepIcons";
import { shadowBody } from "../utils/popupContainer";
import { findElementByXPaths } from "@entrypoints/content/modules/PopupContainer/LiveWatch/utils/dom";
import { ElementField } from "./StepForm/ElementField";
import { StepFormErrors, validateStep } from "./StepForm/stepValidation";
import {
  ErrorText,
  Field,
  FieldHead,
  Form,
  FormFooter,
  Hint,
  Label,
  MonoArea,
  Optional,
  SmallIconButton,
  StoredValueChip,
  StoredValues,
  SwitchRow,
  TypeOption,
} from "./StepForm/StepForm.styled";

export { validateStep };

// Steps whose value may use stored values (${key}); the executor replaces them for these types only
const VARIABLE_STEP_TYPES = [
  StepType.INPUT,
  StepType.VALUE,
  StepType.SELECT,
  StepType.NAVIGATE,
  StepType.REDIRECT,
  StepType.CONFIRMATION,
  StepType.NOTIFICATION,
];

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
  // Show the errors of every field, not only of the edited ones (the parent tried to save)
  showErrors?: boolean;
}

// Used when no step is given (e.g. while a new scenario renders): one shared object, so effects
// depending on the step don't run on every render
const EMPTY_STEP = {} as ScenarioStep;

// Keeps every field of the step (enableNavigation, delay, xpathAutoUpdated...), not only the edited ones
const toFormValues = (source: ScenarioStep): ScenarioStep => ({
  ...source,
  type: source?.type || StepType.NOT_SET,
  xpath: source?.xpath || "",
  value: source?.value || "",
  alternativeXpaths: source?.alternativeXpaths || [],
});

const toNumberString = (value: number | string | null) => (value === null || value === "" ? "" : String(value));

// What the value of a step type is; steps of one kind can switch type and keep the value
const VALUE_KINDS: Partial<Record<StepType, string>> = {
  [StepType.INPUT]: "text",
  [StepType.VALUE]: "text",
  [StepType.SELECT]: "text",
  [StepType.WAIT]: "time",
  [StepType.WAIT_ELEMENT_VISIBLE]: "time",
  [StepType.NAVIGATE]: "address",
  [StepType.REDIRECT]: "address",
  [StepType.CONFIRMATION]: "message",
  [StepType.NOTIFICATION]: "message",
};
const valueKind = (type: StepType) => VALUE_KINDS[type] ?? null;

// Milliseconds kept as text in the step; anything else (an old "${key}") shows as empty
const toNumber = (value: number | string | undefined): number | null =>
  /^\d+$/.test(String(value ?? "").trim()) ? Number(value) : null;

/**
 * Form for one step of a scenario: its type, its element and the value it uses
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
  showErrors = false,
}) => {
  const functions = useSelector(selectFunctions);
  const storedValues = useSelector(selectStoredValues);
  const { syncFunctions } = useServerSettings();
  const typeId = useId();
  const valueId = useId();
  const extraId = useId();

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
    if (submitAttempted || showErrors) return validationErrors;
    const visible: StepFormErrors = {};
    (Object.keys(validationErrors) as (keyof ScenarioStep)[]).forEach((field) => {
      if (touchedFields.has(field)) visible[field] = validationErrors[field];
    });
    return visible;
  }, [validationErrors, touchedFields, submitAttempted, showErrors]);

  // Live mode: report every user edit to the parent (used where the form has no own Save button)
  useEffect(() => {
    if (!onChange) return;
    if (JSON.stringify(formValues) !== JSON.stringify(toFormValues(step))) {
      onChange(formValues);
    }
  }, [formValues]);

  const handleChange = (field: keyof ScenarioStep, value: string | boolean) => {
    setTouchedFields((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  // A new type keeps the element, and the value only where it means the same (a text, a time, an address...)
  const handleTypeChange = (nextType: StepType) => {
    setTouchedFields((prev) => (prev.has("type") ? prev : new Set(prev).add("type")));
    setFormValues((prev) => ({
      ...prev,
      type: nextType,
      value: valueKind(prev.type) !== null && valueKind(prev.type) === valueKind(nextType) ? prev.value : "",
    }));
  };

  // A picked element replaces the step's element and its fallbacks
  const handleElementChange = (xpath: string, alternativeXpaths: string[]) => {
    setTouchedFields((prev) => (prev.has("xpath") ? prev : new Set(prev).add("xpath")));
    setFormValues((prev) => ({ ...prev, xpath, alternativeXpaths, xpathAutoUpdated: false }));
  };

  // A hand-edited XPath no longer matches the fallbacks generated for the picked element
  const handleXPathChange = (xpath: string) => {
    setTouchedFields((prev) => (prev.has("xpath") ? prev : new Set(prev).add("xpath")));
    setFormValues((prev) => ({ ...prev, xpath }));
  };

  const handleFormSubmit = () => {
    setSubmitAttempted(true);
    if (Object.keys(validationErrors).length > 0) return;
    onSave(formValues);
  };

  const type = formValues.type;
  const value = formValues.value || "";
  const storedKeys = Object.keys(storedValues);

  // The <select> of a select step, to offer its options
  const selectElement = useMemo(() => {
    if (type !== StepType.SELECT || !formValues.xpath) return null;
    const element = findElementByXPaths(formValues.xpath, formValues.alternativeXpaths || []);
    return element instanceof HTMLSelectElement ? element : null;
  }, [type, formValues.xpath, formValues.alternativeXpaths]);

  const typeOptions = useMemo(
    () =>
      getFilteredStepTypeOptions(syncFunctions || type === StepType.FUNCTION).map((option) => ({
        value: option.value,
        label: (
          <TypeOption>
            {getStepIcon(option.value || "", 15)}
            {option.label}
          </TypeOption>
        ),
      })),
    [syncFunctions, type],
  );

  const insertVariable = (key: string) => handleChange("value", `${value}\${${key}}`);

  const variableButton =
    VARIABLE_STEP_TYPES.includes(type) && storedKeys.length > 0 ? (
      <Dropdown
        trigger={["click"]}
        getPopupContainer={shadowBody}
        menu={{
          items: storedKeys.map((key) => ({
            key,
            label: `\${${key}}`,
            title: storedValues[key],
            onClick: () => insertVariable(key),
          })),
        }}
      >
        <Button type="text" size="small" icon={<IconVariable size={14} />}>
          Insert value
        </Button>
      </Dropdown>
    ) : null;

  const valueField = (
    label: string,
    control: React.ReactNode,
    options: { optional?: boolean; hint?: React.ReactNode; withVariables?: boolean; id?: string } = {},
  ) => (
    <Field>
      <FieldHead>
        <Label htmlFor={options.id ?? valueId}>
          {label}
          {options.optional && <Optional>optional</Optional>}
        </Label>
        {options.withVariables !== false && variableButton}
      </FieldHead>
      {control}
      {options.id === undefined && errors.value && <ErrorText role="alert">{errors.value.message}</ErrorText>}
      {options.hint && <Hint>{options.hint}</Hint>}
    </Field>
  );

  const elementField = (options: { required?: boolean; label?: string; hint?: string } = {}) => (
    <ElementField
      stepType={type}
      xpath={formValues.xpath || ""}
      alternatives={formValues.alternativeXpaths || []}
      required={options.required ?? true}
      label={options.label}
      hint={options.hint}
      error={errors.xpath?.message}
      onXPathChange={handleXPathChange}
      onElementChange={handleElementChange}
    />
  );

  const textInput = (placeholder: string) => (
    <Input
      id={valueId}
      value={value}
      onChange={(e) => handleChange("value", e.target.value)}
      placeholder={placeholder}
      status={errors.value ? "error" : undefined}
    />
  );

  const textArea = (placeholder: string, mono = false) => {
    const area = (
      <Input.TextArea
        id={valueId}
        value={value}
        onChange={(e) => handleChange("value", e.target.value)}
        placeholder={placeholder}
        autoSize={mono ? { minRows: 4, maxRows: 14 } : { minRows: 2, maxRows: 6 }}
        status={errors.value ? "error" : undefined}
        spellCheck={!mono}
      />
    );
    return mono ? <MonoArea>{area}</MonoArea> : area;
  };

  const msInput = (field: "value" | "delay", placeholder: string, id: string) => (
    <InputNumber<number>
      id={id}
      value={toNumber(field === "delay" ? formValues.delay : value)}
      onChange={(next) => handleChange(field, toNumberString(next))}
      placeholder={placeholder}
      min={1}
      step={500}
      precision={0}
      addonAfter="ms"
      status={field === "value" && errors.value ? "error" : undefined}
      style={{ width: "100%" }}
    />
  );

  const selectOptions = selectElement
    ? Array.from(selectElement.options).map((option) => ({
        value: option.value,
        label: option.text.trim() || option.value || "(empty)",
      }))
    : [];

  const renderTypeSpecificFields = () => {
    switch (type) {
      case StepType.CLICK:
      case StepType.HOVER:
        return elementField();

      case StepType.KEY_PRESS:
        return (
          <>
            {valueField(
              "Key",
              <AutoComplete
                id={valueId}
                value={value}
                options={KEY_PRESS_OPTIONS.map((key) => ({ value: key }))}
                filterOption={(input, option) =>
                  String(option?.value || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(next) => handleChange("value", next)}
                placeholder="Enter, Escape, Tab, Shift+Tab…"
                status={errors.value ? "error" : undefined}
                style={{ width: "100%" }}
                getPopupContainer={shadowBody}
              />,
              { withVariables: false },
            )}
            {elementField({
              required: false,
              hint: "Focused before the key is pressed. Empty: the key goes to whatever has the focus.",
            })}
          </>
        );

      case StepType.VALUE:
      case StepType.INPUT:
        return (
          <>
            {elementField()}
            {valueField(type === StepType.INPUT ? "Text to type" : "Value", textInput("Text"), {
              hint: storedKeys.length > 0 ? <>Stored values work too: <code>{"${key}"}</code></> : undefined,
            })}
          </>
        );

      case StepType.SELECT:
        return (
          <>
            {elementField({ label: "Dropdown" })}
            {valueField(
              "Option",
              selectElement ? (
                <Select
                  id={valueId}
                  mode={selectElement.multiple ? "multiple" : undefined}
                  value={selectElement.multiple ? parseSelectValues(value, true).filter(Boolean) : value || undefined}
                  onChange={(next: string | string[]) =>
                    handleChange("value", Array.isArray(next) ? JSON.stringify(next) : next)
                  }
                  options={selectOptions}
                  placeholder="Choose an option"
                  showSearch
                  optionFilterProp="label"
                  getPopupContainer={shadowBody}
                  style={{ width: "100%" }}
                />
              ) : (
                textInput("Option value or its text")
              ),
              {
                hint: selectElement
                  ? undefined
                  : "Pick the dropdown on this page to choose from its options. A value or the option's text works too.",
              },
            )}
          </>
        );

      case StepType.GET_TEXT:
        return (
          <>
            {elementField()}
            {valueField(
              "Save as",
              <Input
                id={valueId}
                value={value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="key"
                addonBefore="${"
                addonAfter="}"
              />,
              {
                optional: true,
                withVariables: false,
                hint: "Later steps use the text as ${key}. Empty: a key is made up.",
              },
            )}
            {storedKeys.length > 0 && (
              <Field>
                <Label as="span">Stored values</Label>
                <StoredValues>
                  {storedKeys.map((key) => (
                    <StoredValueChip key={key} title={storedValues[key]}>
                      {`\${${key}}`}
                    </StoredValueChip>
                  ))}
                </StoredValues>
              </Field>
            )}
          </>
        );

      case StepType.CODE:
        return valueField("JavaScript", textArea("document.title = 'Done';", true), {
          withVariables: false,
          hint: "Runs on the page. Stored values are not replaced here.",
        });

      case StepType.FUNCTION:
        return syncFunctions
          ? valueField(
              "Function",
              <Select
                id={valueId}
                value={value || undefined}
                onChange={(next: string) => handleChange("value", next)}
                placeholder="Choose a function"
                options={Object.entries(functions).map(([id, func]) => ({ value: id, label: func.title }))}
                status={errors.value ? "error" : undefined}
                getPopupContainer={shadowBody}
                style={{ width: "100%" }}
              />,
              { withVariables: false },
            )
          : <Hint>Functions are off. Turn on function sync in the settings to choose one.</Hint>;

      case StepType.REDIRECT:
        return valueField("Address", textInput("https://example.com/page"));

      case StepType.NAVIGATE:
        return (
          <>
            {valueField("Address", textInput("https://example.com/page"))}
            <SwitchRow htmlFor={extraId}>
              <Switch
                id={extraId}
                size="small"
                checked={!!formValues.enableNavigation}
                onChange={(checked) => handleChange("enableNavigation", checked)}
              />
              <span>
                Open this address during playback
                <small>Off: playback stays on the current page, the step only notes where the page changed.</small>
              </span>
            </SwitchRow>
          </>
        );

      case StepType.WAIT:
        return valueField("Duration", msInput("value", "1000", valueId), { withVariables: false });

      case StepType.WAIT_ELEMENT_VISIBLE:
        return (
          <>
            {elementField()}
            {valueField("Give up after", msInput("value", "10000", valueId), {
              optional: true,
              withVariables: false,
              hint: "The step fails if the element is not visible by then. Empty: 10 seconds.",
            })}
          </>
        );

      case StepType.CONFIRMATION:
        return valueField("Message", textArea("Check the form, then continue"));

      case StepType.NOTIFICATION:
        return (
          <>
            {valueField("Message", textArea("Order sent"))}
            {valueField("Closes after", msInput("delay", "3000", extraId), {
              optional: true,
              withVariables: false,
              id: extraId,
              hint: "Empty: 3 seconds.",
            })}
          </>
        );

      default:
        return null;
    }
  };

  const hasFooter = !!(onMoveUp || onMoveDown || onDelete || isSingleItem);

  return (
    <Form>
      <Field>
        <Label htmlFor={typeId}>Type</Label>
        <Select
          id={typeId}
          value={type}
          onChange={handleTypeChange}
          options={typeOptions}
          status={errors.type ? "error" : undefined}
          getPopupContainer={shadowBody}
          listHeight={320}
          style={{ width: "100%" }}
        />
        {errors.type && <ErrorText role="alert">{errors.type.message}</ErrorText>}
        {type !== StepType.NOT_SET && <Hint>{stepTypeHints[type]}</Hint>}
      </Field>

      {renderTypeSpecificFields()}

      {hasFooter && (
        <FormFooter>
          <div style={{ display: "flex", gap: 2 }}>
            {onMoveUp && (
              <SmallIconButton label="Move step up" disabled={stepIndex === 0} onClick={() => onMoveUp(stepIndex)}>
                <IconArrowUp />
              </SmallIconButton>
            )}
            {onMoveDown && (
              <SmallIconButton
                label="Move step down"
                disabled={stepIndex === totalSteps - 1}
                onClick={() => onMoveDown(stepIndex)}
              >
                <IconArrowDown />
              </SmallIconButton>
            )}
            {onDelete && (
              <SmallIconButton label="Delete step" onClick={onDelete}>
                <IconTrash />
              </SmallIconButton>
            )}
          </div>
          {isSingleItem && (
            <>
              <Button size="small" onClick={onClose}>
                Cancel
              </Button>
              <Button size="small" type="primary" onClick={handleFormSubmit}>
                Save
              </Button>
            </>
          )}
        </FormFooter>
      )}
    </Form>
  );
};

export default StepEditForm;
