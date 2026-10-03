import * as yup from "yup";
import { ELEMENT_STEP_TYPES, ScenarioStep, StepType } from "../../types";
import { parseKeyCombo } from "../../utils/keyboardUtils";

// Steps that cannot run without a value
const VALUE_REQUIRED_STEP_TYPES = [
  StepType.INPUT,
  StepType.VALUE,
  StepType.CODE,
  StepType.REDIRECT,
  StepType.WAIT,
  StepType.FUNCTION,
  StepType.NAVIGATE,
  StepType.CONFIRMATION,
  StepType.NOTIFICATION,
];

const isPositiveInteger = (value: string | undefined) => /^\d+$/.test((value || "").trim()) && Number(value) > 0;

// Yup validation schema matching ScenarioStep interface
const validationSchema = yup.object().shape({
  type: yup.string().required("Choose what this step does"),
  xpath: yup.string().when("type", {
    is: (type: string) => ELEMENT_STEP_TYPES.includes(type as StepType),
    then: (schema) => schema.trim().required("Pick the element on the page, or paste its XPath"),
    otherwise: (schema) => schema.notRequired(),
  }),
  alternativeXpaths: yup.array().of(yup.string()).notRequired(),
  value: yup
    .string()
    .when("type", {
      is: (type: string) => VALUE_REQUIRED_STEP_TYPES.includes(type as StepType),
      then: (schema) => schema.trim().required("Enter a value"),
      otherwise: (schema) => schema.notRequired(),
    })
    .when("type", {
      is: StepType.WAIT,
      then: (schema) => schema.test("wait", "Enter the time in milliseconds, e.g. 1000", isPositiveInteger),
    })
    .when("type", {
      is: StepType.WAIT_ELEMENT_VISIBLE,
      then: (schema) => schema.test("timeout", "Enter the time in milliseconds, or leave it empty", (value) => !value || isPositiveInteger(value)),
    })
    .when("type", {
      is: StepType.KEY_PRESS,
      then: (schema) =>
        schema
          .required("Enter a key, e.g. Enter or Shift+Tab")
          .test("key", "Use a key name like Enter, Escape, Tab, Space or ArrowDown, optionally after Ctrl+, Alt+, Shift+ or Meta+", (value) =>
            !!parseKeyCombo(value),
          ),
    }),
  xpathAutoUpdated: yup.boolean().notRequired(),
});

export type StepFormErrors = Partial<Record<keyof ScenarioStep, { message: string }>>;

// Validates the step; returns the error of each invalid field
export const validateStep = (values: ScenarioStep): StepFormErrors => {
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

