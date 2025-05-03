import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Form, message } from 'antd';

// Import types
import { ScenarioMap, ScenarioStep, Scenario } from './types.ts';

// Import styled components
import { Title } from './styles.ts';

// Import utility functions
import { 
  getAllScenariosFromLocalStorage, 
  removeScenarioFromLocalStorage,
  generateUniqueId,
  saveScenarioToLocalStorage,
  addStepToScenario
} from './utils/storage.ts';
import { isExtensionElement, generateXPath } from './utils/dom.ts';

// Import components
import ScenarioList from './components/ScenarioList.tsx';
import RecordingNotification from './components/RecordingNotification.tsx';
import AddScenarioModal from './components/AddScenarioModal.tsx';
import ActionButtons from './components/ActionButtons.tsx';

// Main component
const AutomationScenarios: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioMap>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentSteps, setCurrentSteps] = useState<ScenarioStep[]>([]);
  
  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<ScenarioStep[]>([]);
  const [isFromRecording, setIsFromRecording] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const clickListenerRef = useRef<(e: MouseEvent) => void | any>(null);
  const changeListenerRef = useRef<(e: Event) => void | any>(null);
  
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
  const playScenario = (id: string) => {
    const scenarioId = id.replace('sc_', '');
    const scenario = scenarios[id];
    
    if (!scenario || !scenario.data || scenario.data.length === 0) {
      alert(`"${scenario?.title || 'Scenario'}" has no steps to play.`);
      return;
    }
    
    // Set this as the active scenario for recording
    setActiveScenarioId(id);
    
    // Here we would normally send a message to the background script
    // For now, we'll just log the scenario
    console.log('Playing scenario:', scenarioId, scenario);
    alert(`Playing scenario: ${scenario.title}. This is now the active scenario for recording.`);
  };
  
  // Edit a scenario
  const editScenario = (id: string) => {
    const scenario = scenarios[id];
    console.log('Editing scenario:', id, scenario);
    alert(`Editing scenario: ${scenario.title}`);
    // In a real implementation, this would open an editor
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
   * Saves the new scenario using ExtensionStorageManager and updates the UI
   * This function validates the form, generates a unique ID, creates a new scenario object,
   * saves it using ExtensionStorageManager, and updates the component state
   */
  const saveScenario = () => {
    // Validate the form fields
    form.validateFields().then(async values => {
      try {
        // Generate a unique ID for the new scenario
        const id = await generateUniqueId();
        
        // Create the new scenario object
        const newScenario: Scenario = {
          title: values.title,
          repeat: values.repeat || 0,
          data: currentSteps
        };
        
        // Save the scenario using ExtensionStorageManager
        const success = await saveScenarioToLocalStorage(id, newScenario);
        
        if (success) {
          // Update the local state to include the new scenario
          setScenarios(prev => ({
            ...prev,
            [`sc_${id}`]: newScenario
          }));
          
          // Close the modal and reset the form
          setModalVisible(false);
          form.resetFields();
          setCurrentSteps([]);
          
          // Show a success message
          message.success(`Scenario "${newScenario.title}" has been saved.`);
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
   * Handles canceling the modal
   * This closes the modal and resets the form and steps
   */
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setCurrentSteps([]);
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
      <Title>Automation Scenarios</Title>
      
      {recording && (
        <RecordingNotification
          activeScenarioId={activeScenarioId}
          scenarioTitle={activeScenarioId ? scenarios[activeScenarioId]?.title : undefined}
          onStopRecording={stopRecording}
          onAddNewScenario={addNewScenarioWhileRecording}
        />
      )}

      { !!recordedSteps?.length && <AddScenarioModal
          visible={modalVisible}
          isFromRecording={isFromRecording}
          form={form}
          currentSteps={recordedSteps}
          onCancel={handleCancel}
          onSave={saveScenario}
          onAddStep={addStep}
          onRemoveStep={removeStep}
          onUpdateStep={updateStep}
      /> }
      <ScenarioList
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        recording={recording}
        onPlay={playScenario}
        onEdit={editScenario}
        onDelete={deleteScenario}
      />
      
      <ActionButtons
        recording={recording}
        onAddScenario={addScenario}
        onToggleRecording={startRecording}
      />
      

    </div>
  );
};

export default AutomationScenarios;