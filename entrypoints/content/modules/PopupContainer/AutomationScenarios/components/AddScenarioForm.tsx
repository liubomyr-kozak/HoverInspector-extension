import React from 'react';
import { Form, Input, InputNumber, Select, Button, Divider } from 'antd';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { ScenarioStep, stepTypeOptions, FunctionMap } from '../types.ts';
import { EmptyState, StepContainer, StepHeader, StepTitle } from '../styles.ts';

interface AddScenarioFormProps {
  form: any; // Form instance from antd
  currentSteps: ScenarioStep[];
  functions?: FunctionMap; // Optional map of functions for function steps
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, field: keyof ScenarioStep, value: string) => void;
}

const AddScenarioForm: React.FC<AddScenarioFormProps> = ({
  form,
  currentSteps,
  functions = {}, // Default to empty object if not provided
  onAddStep,
  onRemoveStep,
  onUpdateStep
}) => {
  return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{ title: '', repeat: 0 }}
      >
        <Form.Item
          name="title"
          label="Scenario Title"
          rules={[{ required: true, message: 'Please enter a title for the scenario' }]}
        >
          <Input placeholder="Enter scenario title" />
        </Form.Item>
        
        <Form.Item
          name="repeat"
          label="Repeat Count"
          tooltip="Number of times to repeat the scenario (0 = no repeat)"
        >
          <InputNumber min={0} defaultValue={0} style={{ width: '100%' }} />
        </Form.Item>
        
        <Divider orientation="left">Steps</Divider>
        
        {currentSteps.length === 0 ? (
          <EmptyState style={{ padding: '12px' }}>
            No steps added yet. Add a step to get started.
          </EmptyState>
        ) : (
          currentSteps.map((step, index) => (
            <StepContainer key={index}>
              <StepHeader>
                <StepTitle>Step {index + 1}</StepTitle>
                <Button 
                  danger 
                  type="text" 
                  icon={<IconTrash size={16} />} 
                  onClick={() => onRemoveStep(index)}
                  style={{ marginLeft: 'auto' }}
                >
                  Remove
                </Button>
              </StepHeader>
              
              <Form.Item label="Type" required style={{ marginBottom: '8px' }}>
                <Select
                  value={step.type}
                  onChange={(value) => onUpdateStep(index, 'type', value)}
                  style={{ width: '100%' }}
                  options={stepTypeOptions}
                />
              </Form.Item>
              
              {(step.type === 'click' || step.type === 'value') && (
                <Form.Item label="XPath" required style={{ marginBottom: '8px' }}>
                  <Input
                    value={step.xpath || ''}
                    onChange={(e) => onUpdateStep(index, 'xpath', e.target.value)}
                    placeholder="Enter XPath selector"
                  />
                </Form.Item>
              )}
              
              {step.type === 'function' && (
                <Form.Item label="Function" required style={{ marginBottom: '8px' }}>
                  <Select
                    value={step.value || ''}
                    onChange={(value) => onUpdateStep(index, 'value', value)}
                    style={{ width: '100%' }}
                    placeholder="Select a function"
                    options={Object.keys(functions).map(key => ({
                      value: functions[key].title,
                      label: functions[key].title
                    }))}
                  />
                </Form.Item>
              )}
              
              {(step.type === 'value' || step.type === 'code' || step.type === 'redirect' || step.type === 'wait') && (
                <Form.Item label="Value" required style={{ marginBottom: '8px' }}>
                  {step.type === 'code' ? (
                    <Input.TextArea
                      value={step.value || ''}
                      onChange={(e) => onUpdateStep(index, 'value', e.target.value)}
                      placeholder="Enter code"
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={step.value || ''}
                      onChange={(e) => onUpdateStep(index, 'value', e.target.value)}
                      placeholder={
                        step.type === 'value' ? 'Enter value' :
                        step.type === 'redirect' ? 'Enter URL' :
                        step.type === 'wait' ? 'Enter wait time in ms' : ''
                      }
                    />
                  )}
                </Form.Item>
              )}
            </StepContainer>
          ))
        )}
        
        <Button 
          type="dashed" 
          onClick={onAddStep} 
          block 
          icon={<IconPlus size={16} />}
          style={{ marginTop: '16px' }}
        >
          Add Step
        </Button>
      </Form>
  );
};

export default AddScenarioForm;