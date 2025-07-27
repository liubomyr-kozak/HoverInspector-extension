import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Form, message, Progress, Tabs, Button } from 'antd';
import { IconPlus } from '@tabler/icons-react';

// Import types
import { ScenarioMap, ScenarioStep, Scenario, FunctionMap, CustomFunction } from './types.ts';

// Import styled components
import { Title } from './styles.ts';

// Import utility functions
import { 
  getAllScenariosFromLocalStorage, 
  removeScenarioFromLocalStorage,
  generateUniqueId,
  saveScenarioToLocalStorage,
  addStepToScenario,
  getAllFunctionsFromLocalStorage,
  removeFunctionFromLocalStorage,
  saveFunctionToLocalStorage
} from './utils/storage.ts';
import { isExtensionElement, generateXPath } from './utils/dom.ts';
import { StepExecutor } from './utils/stepExecutor.ts';

// Import components
import ScenarioList from './components/ScenarioList.tsx';
import RecordingNotification from './components/RecordingNotification.tsx';
import AddScenarioForm from './components/AddScenarioForm.tsx';
import ActionButtons from './components/ActionButtons.tsx';
import FunctionList from './components/FunctionList.tsx';
import AddFunctionForm from './components/AddFunctionForm.tsx';

// Main component
const AutomationScenarios: React.FC = () => {
  // Scenario state
  const [scenarios, setScenarios] = useState<ScenarioMap>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentSteps, setCurrentSteps] = useState<ScenarioStep[]>([]);
  
  // Function state
  const [functions, setFunctions] = useState<FunctionMap>({});
  const [functionLoading, setFunctionLoading] = useState(true);
  const [functionModalVisible, setFunctionModalVisible] = useState(false);
  const [functionForm] = Form.useForm();
  const [currentFunction, setCurrentFunction] = useState<CustomFunction | null>(null);
  const [activeFunctionId, setActiveFunctionId] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('scenarios');
  
  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<ScenarioStep[]>([]);
  const [isFromRecording, setIsFromRecording] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const clickListenerRef = useRef<(e: MouseEvent) => void | any>(null);
  const changeListenerRef = useRef<(e: Event) => void | any>(null);
  
  // Execution state
  const [executing, setExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  // Check if this feature is active
  const { activeIcons = [] } = useSelector(
    (state: any) => state?.app.launcher
  );
  
  const isActive = activeIcons.includes('automation');
  
  // Load scenarios from storage
  useEffect(() => {
    if (isActive) {
      setLoading(true);
      
      // Define an async function to load scenarios
      const loadScenarios = async () => {
        try {
          const loadedScenarios = await getAllScenariosFromLocalStorage();
          setScenarios(loadedScenarios);
        } catch (error) {
          console.error('Error loading scenarios:', error);
          message.error('Failed to load scenarios');
        } finally {
          setLoading(false);
        }
      };
      
      // Call the async function
      loadScenarios();
    }
  }, [isActive]);
  
  // Load functions from storage
  useEffect(() => {
    if (isActive) {
      setFunctionLoading(true);
      
      // Define an async function to load functions
      const loadFunctions = async () => {
        try {
          const loadedFunctions = await getAllFunctionsFromLocalStorage();
          setFunctions(loadedFunctions);
        } catch (error) {
          console.error('Error loading functions:', error);
          message.error('Failed to load functions');
        } finally {
          setFunctionLoading(false);
        }
      };
      
      // Call the async function
      loadFunctions();
    }
  }, [isActive]);
  
  // Cleanup effect to remove event listeners when component unmounts
  useEffect(() => {
    return () => {
      // Stop recording if active when component unmounts
      if (recording) {
        stopRecording();
      }
    };
  }, [recording]);
  
  // Play a scenario
  const playScenario = async (id: string) => {
    const scenarioId = id.replace('sc_', '');
    const scenario = scenarios[id];
    
    if (!scenario || !scenario.data || scenario.data.length === 0) {
      message.warning(`"${scenario?.title || 'Scenario'}" has no steps to play.`);
      return;
    }
    
    // Don't allow playing a scenario while another one is executing
    if (executing) {
      message.warning('Another scenario is currently executing. Please wait for it to complete.');
      return;
    }
    
    // Set this as the active scenario
    setActiveScenarioId(id);
    
    // Reset execution state
    setExecuting(true);
    setCurrentStepIndex(-1);
    setExecutionProgress(0);
    setExecutionError(null);
    
    try {
      // Calculate total steps including repeats
      const totalSteps = scenario.data.length * Math.max(1, scenario.repeat);
      let stepsCompleted = 0;
      
      // Execute the scenario the specified number of times (minimum once)
      const repeatCount = Math.max(1, scenario.repeat);
      
      message.info(`Starting execution of scenario "${scenario.title}"`);
      
      for (let i = 0; i < repeatCount; i++) {
        // If this is a repeat, show a message
        if (i > 0) {
          message.info(`Repeating scenario "${scenario.title}" (${i + 1}/${repeatCount})`);
        }
        
        // Execute all steps in the scenario
        await StepExecutor.executeSteps(
          scenario.data, 
          (stepIndex) => {
            // Update execution state after each step
            setCurrentStepIndex(stepIndex);
            stepsCompleted++;
            setExecutionProgress(Math.round((stepsCompleted / totalSteps) * 100));
          },
          functions // Pass the functions map for function steps
        );
      }
      
      // Execution completed successfully
      message.success(`Scenario "${scenario.title}" executed successfully`);
    } catch (error) {
      // Handle execution error
      console.error('Error executing scenario:', error);
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
      message.error(`Error executing scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset execution state
      setExecuting(false);
      setCurrentStepIndex(-1);
      setExecutionProgress(0);
    }
  };
  
  // Edit a scenario
  const editScenario = (id: string) => {
    const scenario = scenarios[id];
    
    // Set the current steps to the scenario's steps
    setCurrentSteps([...scenario.data]);
    
    // Set the form values
    form.setFieldsValue({
      title: scenario.title,
      repeat: scenario.repeat || 0
    });
    
    // Set flag to indicate this is not from recording
    setIsFromRecording(false);
    
    // Show the modal
    setModalVisible(true);
    
    // Set this as the active scenario for editing
    setActiveScenarioId(id);
    
    console.log('Editing scenario:', id, scenario);
  };
  
  // Delete a scenario
  const deleteScenario = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete "${scenarios[id]?.title}"?`)) {
      try {
        const success = await removeScenarioFromLocalStorage(id);
        
        if (success) {
          // Update the local state
          const updatedScenarios = { ...scenarios };
          delete updatedScenarios[id];
          setScenarios(updatedScenarios);
          message.success('Scenario deleted successfully');
        } else {
          message.error('Failed to delete scenario');
        }
      } catch (error) {
        console.error('Error deleting scenario:', error);
        message.error('Failed to delete scenario');
      }
    }
  };
  
  /**
   * Adds a new empty step to the current scenario
   * This creates a step with an empty type that the user can configure
   */
  const addStep = () => {
    setCurrentSteps([...currentSteps, { type: '' }]);
  };
  
  /**
   * Removes a step from the current scenario at the specified index
   * 
   * @param {number} index - The index of the step to remove
   */
  const removeStep = (index: number) => {
    const newSteps = [...currentSteps];
    newSteps.splice(index, 1);
    setCurrentSteps(newSteps);
  };
  
  /**
   * Updates a specific field of a step at the specified index
   * 
   * @param {number} index - The index of the step to update
   * @param {keyof ScenarioStep} field - The field to update (type, xpath, or value)
   * @param {string} value - The new value for the field
   */
  const updateStep = (index: number, field: keyof ScenarioStep, value: string) => {
    const newSteps = [...currentSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setCurrentSteps(newSteps);
  };
  
  /**
   * Saves the scenario using ExtensionStorageManager and updates the UI
   * This function validates the form, creates a scenario object,
   * saves it using ExtensionStorageManager, and updates the component state
   * If activeScenarioId is set, it updates the existing scenario; otherwise, it creates a new one
   */
  const saveScenario = () => {
    // Validate the form fields
    form.validateFields().then(async values => {
      try {
        // Create the scenario object
        const scenarioToSave: Scenario = {
          title: values.title,
          repeat: values.repeat || 0,
          data: currentSteps
        };
        
        let success = false;
        let scenarioId = '';
        
        // Check if we're updating an existing scenario or creating a new one
        if (activeScenarioId) {
          // Update existing scenario
          success = await saveScenarioToLocalStorage(activeScenarioId, scenarioToSave);
          scenarioId = activeScenarioId;
        } else {
          // Generate a unique ID for the new scenario
          const id = await generateUniqueId();
          success = await saveScenarioToLocalStorage(id, scenarioToSave);
          scenarioId = `sc_${id}`;
        }
        
        if (success) {
          // Update the local state
          setScenarios(prev => ({
            ...prev,
            [scenarioId]: scenarioToSave
          }));
          
          // Close the modal and reset the form
          setModalVisible(false);
          form.resetFields();
          setCurrentSteps([]);
          setActiveScenarioId(null);
          
          // Show a success message
          const action = activeScenarioId ? 'updated' : 'saved';
          message.success(`Scenario "${scenarioToSave.title}" has been ${action}.`);
        } else {
          // Show an error message if the save failed
          message.error('Failed to save scenario. Please try again.');
        }
      } catch (error) {
        console.error('Error saving scenario:', error);
        message.error('Failed to save scenario. Please try again.');
      }
    }).catch(error => {
      // Log validation errors
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields.');
    });
  };
  
  /**
   * Opens the modal for adding a new scenario
   * This resets the form and steps, then shows the modal
   */
  const addScenario = () => {
    // Reset the form and steps
    form.resetFields();
    setCurrentSteps([]);
    
    // Set flag to indicate this is not from recording
    setIsFromRecording(false);
    
    // Show the modal
    setModalVisible(true);
  };
  
  /**
   * Opens the modal for adding a new scenario while recording is active
   * This resets the form and sets the current steps to the recorded steps
   */
  const addNewScenarioWhileRecording = () => {
    // Reset the form
    form.resetFields();
    
    // Set the current steps to the recorded steps
    setCurrentSteps([...recordedSteps]);
    
    // Set flag to indicate this is from recording
    setIsFromRecording(true);
    
    // Show the modal
    setModalVisible(true);
  };
  
  /**
   * Starts recording user actions
   * This function sets up event listeners for clicks and input changes
   * and updates the UI to show recording is active
   */
  const startRecording = () => {
    // Stop recording if already recording
    if (recording) {
      stopRecording();
      return;
    }
    
    // Clear any previously recorded steps
    setRecordedSteps([]);
    
    // Create click event listener
    const clickListener = async (e: MouseEvent) => {
      // Ignore clicks on the extension UI
      if (isExtensionElement(e.target as HTMLElement)) {
        return;
      }
      
      // Create a step for the click action
      const step: ScenarioStep = {
        type: 'click',
        xpath: generateXPath(e.target as HTMLElement)
      };
      
      // Add the step to recorded steps
      setRecordedSteps(prev => [...prev, step]);
      
      // If there's an active scenario, add the step to it
      if (activeScenarioId) {
        try {
          const success = await addStepToScenario(activeScenarioId, step);
          if (success) {
            // Update the scenarios state to reflect the change
            setScenarios(prev => {
              const updatedScenarios = { ...prev };
              const scenario = { ...updatedScenarios[activeScenarioId] };
              scenario.data = [...scenario.data, step];
              updatedScenarios[activeScenarioId] = scenario;
              return updatedScenarios;
            });
            
            message.success(`Click action added to scenario "${scenarios[activeScenarioId]?.title}"`);
          } else {
            message.error('Failed to add click action to active scenario');
          }
        } catch (error) {
          console.error('Error adding click action to scenario:', error);
          message.error('Failed to add click action to active scenario');
        }
      } else {
        // Just show a notification that the action was recorded
        message.success('Click action recorded');
      }
    };
    
    // Create change event listener
    const changeListener = async (e: Event) => {
      // Ignore changes on the extension UI
      if (isExtensionElement(e.target as HTMLElement)) {
        return;
      }
      
      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      
      // Create a step for the value change
      const step: ScenarioStep = {
        type: 'value',
        xpath: generateXPath(target),
        value: target.value
      };
      
      // Add the step to recorded steps
      setRecordedSteps(prev => [...prev, step]);
      
      // If there's an active scenario, add the step to it
      if (activeScenarioId) {
        try {
          const success = await addStepToScenario(activeScenarioId, step);
          if (success) {
            // Update the scenarios state to reflect the change
            setScenarios(prev => {
              const updatedScenarios = { ...prev };
              const scenario = { ...updatedScenarios[activeScenarioId] };
              scenario.data = [...scenario.data, step];
              updatedScenarios[activeScenarioId] = scenario;
              return updatedScenarios;
            });
            
            message.success(`Value change added to scenario "${scenarios[activeScenarioId]?.title}"`);
          } else {
            message.error('Failed to add value change to active scenario');
          }
        } catch (error) {
          console.error('Error adding value change to scenario:', error);
          message.error('Failed to add value change to active scenario');
        }
      } else {
        // Just show a notification that the action was recorded
        message.success('Value change recorded');
      }
    };
    
    // Save references to the listeners
    clickListenerRef.current = clickListener;
    changeListenerRef.current = changeListener;
    
    // Add event listeners
    document.addEventListener('click', clickListener, true);
    document.addEventListener('change', changeListener, true);
    
    // Update recording state
    setRecording(true);
    
    // Show a notification
    message.info('Recording started. Click on elements to record actions.');
  };
  
  /**
   * Stops recording user actions
   * This function removes event listeners and updates the UI
   * When steps are recorded, it automatically creates a new scenario
   */
  const stopRecording = () => {
    // Remove event listeners
    if (clickListenerRef.current) {
      document.removeEventListener('click', clickListenerRef.current, true);
    }
    
    if (changeListenerRef.current) {
      document.removeEventListener('change', changeListenerRef.current, true);
    }
    
    // Update recording state
    setRecording(false);
    
    // If steps were recorded, automatically create a new scenario
    if (recordedSteps.length > 0) {
      // Generate a timestamp for the scenario title
      const timestamp = new Date().toLocaleString();
      const scenarioTitle = `Recorded Scenario ${timestamp}`;
      
      // Create the new scenario
      const createNewScenario = async () => {
        try {
          // Generate a unique ID for the new scenario
          const id = await generateUniqueId();
          
          // Create the new scenario object
          const newScenario: Scenario = {
            title: scenarioTitle,
            repeat: 0,
            data: recordedSteps
          };
          
          // Save the scenario using ExtensionStorageManager
          const success = await saveScenarioToLocalStorage(id, newScenario);
          
          if (success) {
            // Update the local state to include the new scenario
            setScenarios(prev => ({
              ...prev,
              [`sc_${id}`]: newScenario
            }));
            
            // Show a success message
            message.success(`Recording stopped. New scenario "${scenarioTitle}" created with ${recordedSteps.length} actions.`);
          } else {
            // Show an error message if the save failed
            message.error('Failed to save recorded scenario. Please try again.');
          }
        } catch (error) {
          console.error('Error saving recorded scenario:', error);
          message.error('Failed to save recorded scenario. Please try again.');
        }
      };
      
      // Execute the async function
      createNewScenario();
      
      // Clear recorded steps
      setRecordedSteps([]);
    } else {
      // Show a notification
      message.info('Recording stopped. No actions were recorded.');
    }
  };
  
  
  /**
   * Handles canceling the scenario modal
   * This closes the modal and resets the form and steps
   */
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setCurrentSteps([]);
  };
  
  /**
   * Opens the modal for adding a new function
   * This resets the form and shows the modal
   */
  const addFunction = () => {
    // Reset the form and current function
    functionForm.resetFields();
    setCurrentFunction(null);
    
    // Show the modal
    setFunctionModalVisible(true);
    
    // Reset the active function ID
    setActiveFunctionId(null);
  };
  
  /**
   * Opens the modal for editing an existing function
   * This sets the form values to the function's values and shows the modal
   */
  const editFunction = (id: string) => {
    const func = functions[id];
    
    // Set the current function
    setCurrentFunction(func);
    
    // Set the form values
    functionForm.setFieldsValue({
      title: func.title,
      code: func.code
    });
    
    // Show the modal
    setFunctionModalVisible(true);
    
    // Set this as the active function for editing
    setActiveFunctionId(id);
    
    console.log('Editing function:', id, func);
  };
  
  /**
   * Deletes a function
   * This removes the function from storage and updates the state
   */
  const deleteFunction = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete "${functions[id]?.title}"?`)) {
      try {
        const success = await removeFunctionFromLocalStorage(id);
        
        if (success) {
          // Update the local state
          const updatedFunctions = { ...functions };
          delete updatedFunctions[id];
          setFunctions(updatedFunctions);
          message.success('Function deleted successfully');
        } else {
          message.error('Failed to delete function');
        }
      } catch (error) {
        console.error('Error deleting function:', error);
        message.error('Failed to delete function');
      }
    }
  };
  
  /**
   * Saves the function using ExtensionStorageManager and updates the UI
   * This function validates the form, creates a function object,
   * saves it using ExtensionStorageManager, and updates the component state
   * If activeFunctionId is set, it updates the existing function; otherwise, it creates a new one
   */
  const saveFunction = () => {
    // Validate the form fields
    functionForm.validateFields().then(async values => {
      try {
        // Create the function object
        const functionToSave: CustomFunction = {
          title: values.title,
          code: values.code
        };
        
        let success = false;
        let functionId = '';
        
        // Check if we're updating an existing function or creating a new one
        if (activeFunctionId) {
          // Update existing function
          success = await saveFunctionToLocalStorage(activeFunctionId, functionToSave);
          functionId = activeFunctionId;
        } else {
          // Generate a unique ID for the new function
          const id = await generateUniqueId();
          success = await saveFunctionToLocalStorage(id, functionToSave);
          functionId = `fu_${id}`;
        }
        
        if (success) {
          // Update the local state
          setFunctions(prev => ({
            ...prev,
            [functionId]: functionToSave
          }));
          
          // Close the modal and reset the form
          setFunctionModalVisible(false);
          functionForm.resetFields();
          setCurrentFunction(null);
          setActiveFunctionId(null);
          
          // Show a success message
          const action = activeFunctionId ? 'updated' : 'saved';
          message.success(`Function "${functionToSave.title}" has been ${action}.`);
        } else {
          // Show an error message if the save failed
          message.error('Failed to save function. Please try again.');
        }
      } catch (error) {
        console.error('Error saving function:', error);
        message.error('Failed to save function. Please try again.');
      }
    }).catch(error => {
      // Log validation errors
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields.');
    });
  };
  
  /**
   * Handles canceling the function modal
   * This closes the modal and resets the form
   */
  const handleFunctionCancel = () => {
    setFunctionModalVisible(false);
    functionForm.resetFields();
    setCurrentFunction(null);
  };
  
  if (!isActive) {
    return null;
  }
  
  if (loading) {
    return <div>Loading scenarios...</div>;
    debugger;
  }
  
  const scenarioKeys = Object.keys(scenarios);
  
  
  console.log("😎😎😎 ::AutomationScenarios -> recordedSteps", recordedSteps);
  
  return (
    <div>
      <Title>Automation</Title>
      
      {recording && (
        <RecordingNotification
          activeScenarioId={activeScenarioId}
          scenarioTitle={activeScenarioId ? scenarios[activeScenarioId]?.title : undefined}
          onStopRecording={stopRecording}
          onAddNewScenario={addNewScenarioWhileRecording}
        />
      )}
      
      {executing && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>
              Executing: {activeScenarioId && scenarios[activeScenarioId]?.title}
            </span>
            <span>
              {currentStepIndex >= 0 && activeScenarioId && 
                `Step ${currentStepIndex + 1} of ${scenarios[activeScenarioId]?.data.length}`}
            </span>
          </div>
          <Progress percent={executionProgress} status={executionError ? 'exception' : 'active'} />
          {executionError && (
            <div style={{ marginTop: '8px', color: '#ff4d4f' }}>
              Error: {executionError}
            </div>
          )}
        </div>
      )}

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'scenarios',
            label: 'Scenarios',
            children: (
              <>
                <AddScenarioForm
                  isFromRecording={isFromRecording}
                  form={form}
                  currentSteps={isFromRecording ? recordedSteps : currentSteps}
                  functions={functions}
                  onCancel={handleCancel}
                  onSave={saveScenario}
                  onAddStep={addStep}
                  onRemoveStep={removeStep}
                  onUpdateStep={updateStep}
                />
                <ScenarioList
                  scenarios={scenarios}
                  activeScenarioId={activeScenarioId}
                  recording={recording}
                  executing={executing}
                  executingScenarioId={executing ? activeScenarioId : null}
                  onPlay={playScenario}
                  onEdit={editScenario}
                  onDelete={deleteScenario}
                />
                
                <ActionButtons
                  recording={recording}
                  onAddScenario={addScenario}
                  onToggleRecording={startRecording}
                />
              </>
            ),
          },
          {
            key: 'functions',
            label: 'Functions',
            children: (
              <>
                {functionModalVisible && (
                  <AddFunctionForm
                    form={functionForm}
                    currentFunction={currentFunction}
                    onSave={saveFunction}
                    onCancel={handleFunctionCancel}
                  />
                )}
                <FunctionList
                  functions={functions}
                  activeFunctionId={activeFunctionId}
                  onEdit={editFunction}
                  onDelete={deleteFunction}
                />
                
                <div style={{ marginTop: '16px' }}>
                  <Button 
                    type="primary" 
                    onClick={addFunction}
                    icon={<IconPlus size={18} />}
                    style={{ width: '100%' }}
                  >
                    Add Function
                  </Button>
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AutomationScenarios;