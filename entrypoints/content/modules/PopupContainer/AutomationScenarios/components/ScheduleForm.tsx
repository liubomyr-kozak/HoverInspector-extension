import React, { useEffect, useImperativeHandle } from "react";
import { Checkbox, Col, DatePicker, Divider, InputNumber, Row, Select, Switch, TimePicker } from "antd";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DayOfWeek, ScenarioMap, ScheduleConfig, ScheduleFrequency } from "../types.ts";
import dayjs from "dayjs";

// Yup validation schema
const validationSchema = yup.object().shape({
  title: yup.string().required("Please enter a title for the schedule"),
  description: yup.string(),
  scenarioId: yup.string().required("Please select a scenario to run"),
  frequency: yup.string().required("Please select a frequency"),
  enabled: yup.boolean(),
  startDate: yup.mixed().required("Please select a start date"),
  startTime: yup.mixed().required("Please select a start time"),
  endDate: yup.mixed(),
  daysOfWeek: yup.array().when("frequency", {
    is: ScheduleFrequency.WEEKLY,
    then: (schema) => schema.min(1, "Please select at least one day"),
    otherwise: (schema) => schema.notRequired(),
  }),
  dayOfMonth: yup.number().when("frequency", {
    is: ScheduleFrequency.MONTHLY,
    then: (schema) => schema.required("Please enter the day of month").min(1).max(31),
    otherwise: (schema) => schema.notRequired(),
  }),
  interval: yup.number().when("frequency", {
    is: ScheduleFrequency.CUSTOM,
    then: (schema) => schema.required("Please enter an interval").min(1),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const { Option } = Select;

export interface ScheduleFormHandle {
  /** Validates the form; resolves to the entered schedule, or null when it is not valid */
  submit: () => Promise<ScheduleConfig | null>;
}

interface ScheduleFormProps {
  currentSchedule: ScheduleConfig | null;
  scenarios: ScenarioMap;
  onFormChange?: (formData: ScheduleConfig) => void;
  formRef?: React.Ref<ScheduleFormHandle>;
}

// Converts the date / time pickers' values back to the stored strings
const toScheduleConfig = (values: any): ScheduleConfig => ({
  ...values,
  startDate: values.startDate ? dayjs(values.startDate).format("YYYY-MM-DD") : "",
  startTime: values.startTime ? dayjs(values.startTime).format("HH:mm") : "",
  endDate: values.endDate ? dayjs(values.endDate).format("YYYY-MM-DD") : undefined,
});

/**
 * Component for adding or editing a schedule
 */
const ScheduleForm: React.FC<ScheduleFormProps> = ({ currentSchedule, scenarios, onFormChange, formRef }) => {
  // Convert date strings to dayjs objects for form initialization
  const initialValues = currentSchedule
    ? {
        ...currentSchedule,
        startDate: currentSchedule.startDate ? dayjs(currentSchedule.startDate) : undefined,
        startTime: currentSchedule.startTime ? dayjs(currentSchedule.startTime, "HH:mm") : undefined,
        endDate: currentSchedule.endDate ? dayjs(currentSchedule.endDate) : undefined,
      }
    : {
        enabled: true,
        frequency: ScheduleFrequency.ONCE,
        // A few minutes from now: a one-time schedule set to the current minute would already be in the past
        startDate: dayjs().add(5, "minute"),
        startTime: dayjs().add(5, "minute"),
      };

  // Initialize React Hook Form
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleConfig>({
    resolver: yupResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  useImperativeHandle(
    formRef,
    () => ({
      submit: () =>
        new Promise<ScheduleConfig | null>((resolve) => {
          handleSubmit(
            (values) => resolve(toScheduleConfig(values)),
            () => resolve(null),
          )();
        }),
    }),
    [handleSubmit],
  );

  const frequency = watch("frequency");

  // Handle frequency change - reset fields that are not relevant
  const handleFrequencyChange = (value: ScheduleFrequency) => {
    setValue("frequency", value);

    // Reset fields that are not relevant to the new frequency
    if (value === ScheduleFrequency.ONCE) {
      setValue("endDate", undefined);
      setValue("daysOfWeek", undefined);
      setValue("dayOfMonth", undefined);
      setValue("interval", undefined);
    } else if (value === ScheduleFrequency.DAILY) {
      setValue("daysOfWeek", undefined);
      setValue("dayOfMonth", undefined);
      setValue("interval", undefined);
    } else if (value === ScheduleFrequency.WEEKLY) {
      setValue("dayOfMonth", undefined);
      setValue("interval", undefined);
    } else if (value === ScheduleFrequency.MONTHLY) {
      setValue("daysOfWeek", undefined);
      setValue("interval", undefined);
    } else if (value === ScheduleFrequency.CUSTOM) {
      setValue("daysOfWeek", undefined);
      setValue("dayOfMonth", undefined);
    }
  };

  // Watch form changes and notify parent
  useEffect(() => {
    if (!onFormChange) return;
    const subscription = watch((values) => onFormChange(toScheduleConfig(values)));
    return () => subscription.unsubscribe();
  }, [watch, onFormChange]);

  // Get scenario options for the select dropdown
  const scenarioOptions = Object.keys(scenarios).map((key) => ({
    value: key,
    label: scenarios[key].title,
  }));

  // Days of week options for weekly schedules
  const daysOfWeekOptions = [
    { label: "Sunday", value: DayOfWeek.SUNDAY },
    { label: "Monday", value: DayOfWeek.MONDAY },
    { label: "Tuesday", value: DayOfWeek.TUESDAY },
    { label: "Wednesday", value: DayOfWeek.WEDNESDAY },
    { label: "Thursday", value: DayOfWeek.THURSDAY },
    { label: "Friday", value: DayOfWeek.FRIDAY },
    { label: "Saturday", value: DayOfWeek.SATURDAY },
  ];

  // Convert date strings to dayjs objects for form initialization

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Schedule Title
        </label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <input 
              {...field} 
              type="text"
              placeholder="Enter schedule title"
              style={{
                width: '100%',
                padding: '4px 11px',
                border: `1px solid ${errors.title ? '#ff4d4f' : '#d9d9d9'}`,
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.title ? '#ff4d4f' : '#1890ff';
                e.target.style.boxShadow = `0 0 0 2px ${errors.title ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.title ? '#ff4d4f' : '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          )}
        />
        {errors.title && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.title.message}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Description
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <textarea 
              {...field} 
              placeholder="Enter schedule description" 
              rows={2}
              style={{
                width: '100%',
                padding: '4px 11px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                transition: 'border-color 0.2s',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1890ff';
                e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          )}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Scenario to Run
        </label>
        <Controller
          name="scenarioId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              placeholder="Select a scenario"
              options={scenarioOptions}
              showSearch
              optionFilterProp="label"
              status={errors.scenarioId ? "error" : undefined}
            />
          )}
        />
        {errors.scenarioId && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.scenarioId.message}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Enabled
        </label>
        <Controller
          name="enabled"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Switch
              checked={value}
              onChange={onChange}
            />
          )}
        />
      </div>

      <Divider orientation="left">Schedule Settings</Divider>

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Frequency
        </label>
        <Controller
          name="frequency"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              placeholder="Select frequency"
              onChange={(value) => {
                field.onChange(value);
                handleFrequencyChange(value);
              }}
              status={errors.frequency ? "error" : undefined}
            >
              <Option value={ScheduleFrequency.ONCE}>One-time</Option>
              <Option value={ScheduleFrequency.DAILY}>Daily</Option>
              <Option value={ScheduleFrequency.WEEKLY}>Weekly</Option>
              <Option value={ScheduleFrequency.MONTHLY}>Monthly</Option>
              <Option value={ScheduleFrequency.CUSTOM}>Custom Interval</Option>
            </Select>
          )}
        />
        {errors.frequency && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.frequency.message}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Start Date
        </label>
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              style={{ width: "100%" }}
              status={errors.startDate ? "error" : undefined}
            />
          )}
        />
        {errors.startDate && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.startDate.message}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Start Time
        </label>
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <TimePicker
              {...field}
              getPopupContainer={() =>
                // @ts-ignore
                (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
              }
              format="HH:mm"
              style={{ width: "100%" }}
              status={errors.startTime ? "error" : undefined}
            />
          )}
        />
        {errors.startTime && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.startTime.message}
          </div>
        )}
      </div>

      {frequency !== ScheduleFrequency.ONCE && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            End Date (optional)
          </label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                getPopupContainer={() =>
                  // @ts-ignore
                  (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
                }
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
      )}

      {frequency === ScheduleFrequency.WEEKLY && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Days of Week
          </label>
          <Controller
            name="daysOfWeek"
            control={control}
            render={({ field }) => (
              <Checkbox.Group {...field}>
                <Row>
                  {daysOfWeekOptions.map((option) => (
                    <Col span={8} key={option.value}>
                      <Checkbox value={option.value}>{option.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            )}
          />
          {errors.daysOfWeek && (
            <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
              {errors.daysOfWeek.message}
            </div>
          )}
        </div>
      )}

      {frequency === ScheduleFrequency.MONTHLY && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Day of Month
          </label>
          <Controller
            name="dayOfMonth"
            control={control}
            render={({ field }) => (
              <InputNumber 
                {...field} 
                min={1} 
                max={31} 
                style={{ width: "100%" }}
                status={errors.dayOfMonth ? "error" : undefined}
              />
            )}
          />
          {errors.dayOfMonth && (
            <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
              {errors.dayOfMonth.message}
            </div>
          )}
        </div>
      )}

      {frequency === ScheduleFrequency.CUSTOM && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Interval (minutes)
          </label>
          <Controller
            name="interval"
            control={control}
            render={({ field }) => (
              <InputNumber 
                {...field} 
                min={1} 
                style={{ width: "100%" }}
                status={errors.interval ? "error" : undefined}
              />
            )}
          />
          {errors.interval && (
            <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
              {errors.interval.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleForm;
