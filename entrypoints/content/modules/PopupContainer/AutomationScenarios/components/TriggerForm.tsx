import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Switch, Divider, Radio, Checkbox } from 'antd';
import { TriggerConfig, TriggerType, ScenarioMap } from '../types.ts';

const { Option } = Select;
const { TextArea } = Input;

interface TriggerFormProps {
  form: any; // Form instance from antd
  currentTrigger: TriggerConfig | null;
  scenarios: ScenarioMap;
}

/**
 * Component for adding or editing a trigger
 */
const TriggerForm: React.FC<TriggerFormProps> = ({
  form,
  currentTrigger,
  scenarios
}) => {
  // State for trigger type selection to show/hide relevant fields
  const [triggerType, setTriggerType] = useState<TriggerType>(
    currentTrigger?.type || TriggerType.DOMAIN
  );

  // Update trigger type when currentTrigger changes
  useEffect(() => {
    if (currentTrigger) {
      setTriggerType(currentTrigger.type);
    }
  }, [currentTrigger]);

  // Handle trigger type change
  const handleTriggerTypeChange = (value: TriggerType) => {
    setTriggerType(value);
    
    // Reset condition fields that are not relevant to the new trigger type
    const resetCondition = {
      domainPattern: undefined,
      exactMatch: false,
      elementXPath: undefined,
      eventName: undefined,
      customCondition: undefined
    };
    
    // Keep only the relevant fields based on the trigger type
    if (value === TriggerType.DOMAIN) {
      resetCondition.domainPattern = form.getFieldValue(['condition', 'domainPattern']);
      resetCondition.exactMatch = form.getFieldValue(['condition', 'exactMatch']);
    } else if (value === TriggerType.ELEMENT_PRESENT) {
      resetCondition.elementXPath = form.getFieldValue(['condition', 'elementXPath']);
    } else if (value === TriggerType.CUSTOM_EVENT) {
      resetCondition.eventName = form.getFieldValue(['condition', 'eventName']);
    }
    
    // Update the form
    form.setFieldsValue({ condition: resetCondition });
  };

  // Get scenario options for the select dropdown
  const scenarioOptions = Object.keys(scenarios).map(key => ({
    value: key,
    label: scenarios[key].title
  }));

  // Initialize form values
  const initialValues = currentTrigger ? {
    ...currentTrigger
  } : {
    enabled: true,
    type: TriggerType.DOMAIN,
    condition: {
      exactMatch: false
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item
        name="title"
        label="Trigger Title"
        rules={[{ required: true, message: 'Please enter a title for the trigger' }]}
      >
        <Input placeholder="Enter trigger title" />
      </Form.Item>
      
      <Form.Item
        name="description"
        label="Description"
        tooltip="A detailed description of what this trigger does"
      >
        <TextArea 
          placeholder="Enter trigger description" 
          rows={2}
        />
      </Form.Item>
      
      <Form.Item
        name="scenarioId"
        label="Scenario to Run"
        rules={[{ required: true, message: 'Please select a scenario to run' }]}
      >
        <Select
          placeholder="Select a scenario"
          options={scenarioOptions}
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>
      
      <Form.Item
        name="enabled"
        label="Enabled"
        valuePropName="checked"
        tooltip="Enable or disable this trigger"
      >
        <Switch />
      </Form.Item>
      
      <Divider orientation="left">Trigger Settings</Divider>
      
      <Form.Item
        name="type"
        label="Trigger Type"
        rules={[{ required: true, message: 'Please select a trigger type' }]}
      >
        <Radio.Group onChange={(e) => handleTriggerTypeChange(e.target.value)}>
          <Radio.Button value={TriggerType.DOMAIN}>Domain</Radio.Button>
          <Radio.Button value={TriggerType.PAGE_LOAD}>Page Load</Radio.Button>
          <Radio.Button value={TriggerType.ELEMENT_PRESENT}>Element Present</Radio.Button>
          <Radio.Button value={TriggerType.CUSTOM_EVENT}>Custom Event</Radio.Button>
        </Radio.Group>
      </Form.Item>
      
      {triggerType === TriggerType.DOMAIN && (
        <>
          <Form.Item
            name={['condition', 'domainPattern']}
            label="Domain Pattern"
            rules={[{ required: true, message: 'Please enter a domain pattern' }]}
            tooltip="Enter a domain pattern to match (e.g., example.com, *.example.com)"
          >
            <Input placeholder="Enter domain pattern (e.g., example.com)" />
          </Form.Item>
          
          <Form.Item
            name={['condition', 'exactMatch']}
            valuePropName="checked"
            tooltip="If checked, the domain must match exactly. Otherwise, subdomains will also match."
          >
            <Checkbox>Exact match</Checkbox>
          </Form.Item>
        </>
      )}
      
      {triggerType === TriggerType.ELEMENT_PRESENT && (
        <Form.Item
          name={['condition', 'elementXPath']}
          label="Element XPath"
          rules={[{ required: true, message: 'Please enter an XPath for the element' }]}
          tooltip="Enter an XPath expression to identify the element"
        >
          <Input placeholder="Enter XPath (e.g., //button[@id='submit'])" />
        </Form.Item>
      )}
      
      {triggerType === TriggerType.CUSTOM_EVENT && (
        <Form.Item
          name={['condition', 'eventName']}
          label="Event Name"
          rules={[{ required: true, message: 'Please enter an event name' }]}
          tooltip="Enter the name of the custom event to listen for"
        >
          <Input placeholder="Enter event name (e.g., myCustomEvent)" />
        </Form.Item>
      )}
      
      <Form.Item
        name={['condition', 'customCondition']}
        label="Additional Condition (JavaScript)"
        tooltip="Optional JavaScript code that returns true or false to determine if the trigger should fire"
      >
        <TextArea 
          placeholder="Enter JavaScript code that returns true or false" 
          rows={4}
        />
      </Form.Item>
    </Form>
  );
};

export default TriggerForm;