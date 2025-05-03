import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Divider } from 'antd';
import { IconDeviceFloppy, IconPlus, IconTrash } from '@tabler/icons-react';
import { ScenarioStep, stepTypeOptions } from '../types.ts';
import { EmptyState, StepContainer, StepHeader, StepTitle } from '../styles.ts';

interface AddScenarioModalProps {
  visible: boolean;
  isFromRecording: boolean;
  form: any; // Form instance from antd
  currentSteps: ScenarioStep[];
  onCancel: () => void;
  onSave: () => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, field: keyof ScenarioStep, value: string) => void;
}

/**
 * Component for the modal to add or edit scenarios
 */
const AddScenarioModal: React.FC<AddScenarioModalProps> = ({
  visible,
  isFromRecording,
  form,
  currentSteps,
  onCancel,
  onSave,
  onAddStep,
  onRemoveStep,
  onUpdateStep
}) => {
  return (
    // <Modal
    //   title={isFromRecording ? "Save Recorded Scenario" : "Add New Scenario"}
    //   open={visible}
    //   onCancel={onCancel}
    //   width={800}
    //   // @ts-ignore
    //   getContainer={() => (document.querySelector('hover-inspector')!.shadowRoot as HTMLElement)?.querySelector('html > body')}
    //   footer={[
    //     <Button key="cancel" onClick={onCancel}>
    //       Cancel
    //     </Button>,
    //     <Button
    //       key="save"
    //       type="primary"
    //       onClick={onSave}
    //       icon={<IconDeviceFloppy size={18} />}
    //     >
    //       Save Scenario
    //     </Button>
    //   ]}
    // >
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
    // </Modal>
  );
};

export default AddScenarioModal;