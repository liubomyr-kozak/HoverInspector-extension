import React, { useEffect, useState } from "react";
import { Checkbox, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Switch, TimePicker } from "antd";
import { DayOfWeek, ScenarioMap, ScheduleConfig, ScheduleFrequency } from "../types.ts";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface ScheduleFormProps {
  form: any; // Form instance from antd
  currentSchedule: ScheduleConfig | null;
  scenarios: ScenarioMap;
}

/**
 * Component for adding or editing a schedule
 */
const ScheduleForm: React.FC<ScheduleFormProps> = ({ form, currentSchedule, scenarios }) => {
  // State for frequency selection to show/hide relevant fields
  const [frequency, setFrequency] = useState<ScheduleFrequency>(currentSchedule?.frequency || ScheduleFrequency.ONCE);

  // Update frequency when currentSchedule changes
  useEffect(() => {
    if (currentSchedule) {
      setFrequency(currentSchedule.frequency);
    }
  }, [currentSchedule]);

  // Handle frequency change
  const handleFrequencyChange = (value: ScheduleFrequency) => {
    setFrequency(value);

    // Reset fields that are not relevant to the new frequency
    if (value === ScheduleFrequency.ONCE) {
      form.setFieldsValue({
        daysOfWeek: undefined,
        dayOfMonth: undefined,
        interval: undefined,
      });
    } else if (value === ScheduleFrequency.DAILY) {
      form.setFieldsValue({
        daysOfWeek: undefined,
        dayOfMonth: undefined,
        interval: undefined,
      });
    } else if (value === ScheduleFrequency.WEEKLY) {
      form.setFieldsValue({
        dayOfMonth: undefined,
        interval: undefined,
      });
    } else if (value === ScheduleFrequency.MONTHLY) {
      form.setFieldsValue({
        daysOfWeek: undefined,
        interval: undefined,
      });
    } else if (value === ScheduleFrequency.CUSTOM) {
      form.setFieldsValue({
        daysOfWeek: undefined,
        dayOfMonth: undefined,
      });
    }
  };

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
        startDate: dayjs(),
        startTime: dayjs(),
      };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      <Form.Item
        name="title"
        label="Schedule Title"
        rules={[{ required: true, message: "Please enter a title for the schedule" }]}
      >
        <Input placeholder="Enter schedule title" />
      </Form.Item>

      <Form.Item name="description" label="Description" tooltip="A detailed description of what this schedule does">
        <TextArea placeholder="Enter schedule description" rows={2} />
      </Form.Item>

      <Form.Item
        name="scenarioId"
        label="Scenario to Run"
        rules={[{ required: true, message: "Please select a scenario to run" }]}
      >
        <Select
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
          placeholder="Select a scenario"
          options={scenarioOptions}
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item name="enabled" label="Enabled" valuePropName="checked" tooltip="Enable or disable this schedule">
        <Switch />
      </Form.Item>

      <Divider orientation="left">Schedule Settings</Divider>

      <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: "Please select a frequency" }]}>
        <Select
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
          placeholder="Select frequency"
          onChange={handleFrequencyChange}
        >
          <Option value={ScheduleFrequency.ONCE}>One-time</Option>
          <Option value={ScheduleFrequency.DAILY}>Daily</Option>
          <Option value={ScheduleFrequency.WEEKLY}>Weekly</Option>
          <Option value={ScheduleFrequency.MONTHLY}>Monthly</Option>
          <Option value={ScheduleFrequency.CUSTOM}>Custom Interval</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="startDate"
        label="Start Date"
        rules={[{ required: true, message: "Please select a start date" }]}
      >
        <DatePicker
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item
        name="startTime"
        label="Start Time"
        rules={[{ required: true, message: "Please select a start time" }]}
      >
        <TimePicker
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
          format="HH:mm"
          style={{ width: "100%" }}
        />
      </Form.Item>

      {frequency === ScheduleFrequency.ONCE && (
        <Form.Item name="endDate" label="End Date" tooltip="Optional end date for the schedule">
          <DatePicker
            getPopupContainer={() =>
              // @ts-ignore
              (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
            }
            style={{ width: "100%" }}
          />
        </Form.Item>
      )}

      {frequency === ScheduleFrequency.WEEKLY && (
        <Form.Item
          name="daysOfWeek"
          label="Days of Week"
          rules={[{ required: true, message: "Please select at least one day of the week" }]}
        >
          <Checkbox.Group>
            <Row>
              {daysOfWeekOptions.map((option) => (
                <Col span={8} key={option.value}>
                  <Checkbox value={option.value}>{option.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      )}

      {frequency === ScheduleFrequency.MONTHLY && (
        <Form.Item
          name="dayOfMonth"
          label="Day of Month"
          rules={[{ required: true, message: "Please enter a day of the month" }]}
        >
          <InputNumber min={1} max={31} style={{ width: "100%" }} />
        </Form.Item>
      )}

      {frequency === ScheduleFrequency.CUSTOM && (
        <Form.Item
          name="interval"
          label="Interval (minutes)"
          rules={[{ required: true, message: "Please enter an interval" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
      )}
    </Form>
  );
};

export default ScheduleForm;
