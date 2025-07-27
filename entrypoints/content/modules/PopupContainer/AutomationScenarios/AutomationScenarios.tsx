/**
 * AutomationScenarios Component
 * 
 * This component provides a UI for creating, managing, and executing automation scenarios.
 * It includes features for:
 * - Creating and managing scenarios with multiple steps
 * - Creating and managing custom JavaScript functions
 * - Recording user actions to create scenarios
 * - Executing scenarios manually (normal mode or debug mode)
 * - Scheduling scenarios to run at specified times
 * - Setting up triggers to run scenarios in response to events
 * 
 * TODO: Implement the following features:
 * - Scheduling engine to execute scenarios at specified times
 * - Background process to check and run scheduled scenarios
 * - Domain trigger functionality to run scenarios when visiting specific websites
 * - Event trigger functionality to run scenarios in response to events
 * - Trigger detection system to detect when triggers should fire
 * - Execution tracking to log and monitor scenario executions
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Form, message, Progress, Tabs, Button, Modal, Spin } from 'antd';
import { IconPlus, IconCalendar, IconBolt } from '@tabler/icons-react';
import dayjs from 'dayjs';

// Import types
import { 
  ScenarioMap, 
  ScenarioStep, 
  Scenario, 
  FunctionMap, 
  CustomFunction, 
  ScheduleMap, 
  ScheduleConfig, 
  TriggerMap, 
  TriggerConfig,
  ScheduleFrequency
} from './types.ts';

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
  saveFunctionToLocalStorage,
  getAllSchedulesFromLocalStorage,
  saveScheduleToLocalStorage,
  removeScheduleFromLocalStorage,
  updateScheduleNextExecution,
  updateScheduleLastExecuted,
  getAllTriggersFromLocalStorage,
  saveTriggerToLocalStorage,
  removeTriggerFromLocalStorage,
  updateTriggerLastTriggered
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
import ScheduleList from './components/ScheduleList.tsx';
import ScheduleForm from './components/ScheduleForm.tsx';
import TriggerList from './components/TriggerList.tsx';
import TriggerForm from './components/TriggerForm.tsx';

// Main component
const AutomationScenarios: React.FC = () => {
  // Scenario state
  const [scenarios, setScenarios] = useState<ScenarioMap>({});
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [currentSteps, setCurrentSteps] = useState<ScenarioStep[]>([]);
  const [isEditingScenario, setIsEditingScenario] = useState(false);
  
  // Function state
  const [functions, setFunctions] = useState<FunctionMap>({});
  const [functionLoading, setFunctionLoading] = useState(true);
  const [functionForm] = Form.useForm();
  const [currentFunction, setCurrentFunction] = useState<CustomFunction | null>(null);
  const [activeFunctionId, setActiveFunctionId] = useState<string | null>(null);
  const [isEditingFunction, setIsEditingFunction] = useState(false);
  
  // Schedule state
  const [schedules, setSchedules] = useState<ScheduleMap>({});
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleForm] = Form.useForm();
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleConfig | null>(null);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  
  // Trigger state
  const [triggers, setTriggers] = useState<TriggerMap>({});
  const [triggerLoading, setTriggerLoading] = useState(true);
  const [triggerForm] = Form.useForm();
  const [currentTrigger, setCurrentTrigger] = useState<TriggerConfig | null>(null);
  const [activeTriggerID, setActiveTriggerID] = useState<string | null>(null);
  const [isEditingTrigger, setIsEditingTrigger] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('scenarios');
  
  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<ScenarioStep[]>([]);
  const [isFromRecording, setIsFromRecording] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const clickListenerRef = useRef<(e: MouseEvent) => void | any>(null);
  const changeListenerRef = useRef<(e: Event) => void | any>(null);
  
  // Execution state for Manual Execution features
  const [executing, setExecuting] = useState(false);          // Whether a scenario is currently executing
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);  // Current step being executed
  const [executionProgress, setExecutionProgress] = useState<number>(0);  // Progress percentage
  const [executionError, setExecutionError] = useState<string | null>(null);  // Error message if any
  const [debugMode, setDebugMode] = useState(false);          // Whether debug mode is enabled (step-by-step execution)
  const [paused, setPaused] = useState(false);                // Whether execution is paused
  const [pendingSteps, setPendingSteps] = useState<ScenarioStep[]>([]);  // Steps pending execution
  
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
  
  // Load schedules from storage
  useEffect(() => {
    if (isActive) {
      setScheduleLoading(true);
      
      // Define an async function to load schedules
      const loadSchedules = async () => {
        try {
          const loadedSchedules = await getAllSchedulesFromLocalStorage();
          setSchedules(loadedSchedules);
        } catch (error) {
          console.error('Error loading schedules:', error);
          message.error('Failed to load schedules');
        } finally {
          setScheduleLoading(false);
        }
      };
      
      // Call the async function
      loadSchedules();
    }
  }, [isActive]);
  
  // Load triggers from storage
  useEffect(() => {
    if (isActive) {
      setTriggerLoading(true);
      
      // Define an async function to load triggers
      const loadTriggers = async () => {
        try {
          const loadedTriggers = await getAllTriggersFromLocalStorage();
          setTriggers(loadedTriggers);
        } catch (error) {
          console.error('Error loading triggers:', error);
          message.error('Failed to load triggers');
        } finally {
          setTriggerLoading(false);
        }
      };
      
      // Call the async function
      loadTriggers();
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
  
  /**
   * Plays a scenario either in normal mode or debug mode
   * This is the main entry point for the Manual Execution feature
   * 
   * @param id The ID of the scenario to play
   * @param useDebugMode Whether to enable debug mode (step-by-step execution)
   */
  const playScenario = async (id: string, useDebugMode = false) => {
    const scenarioId = id.replace('sc_', '');
    const scenario = scenarios[id];
    
    if (!scenario || !scenario.data || scenario.data.length === 0) {
      message.warning(`"${scenario?.title || 'Scenario'}" has no steps to play.`);
      return;
    }
    
    // Don't allow playing a scenario while another one is executing
    if (executing && !paused) {
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
    setDebugMode(useDebugMode);
    setPaused(false);
    
    // Calculate total steps including repeats
    const repeatCount = Math.max(1, scenario.repeat);
    const totalSteps = scenario.data.length * repeatCount;
    
    // Prepare all steps including repeats
    let allSteps: ScenarioStep[] = [];
    for (let i = 0; i < repeatCount; i++) {
      allSteps = [...allSteps, ...scenario.data];
    }
    
    // Store the steps for execution
    setPendingSteps(allSteps);
    
    message.info(`Starting execution of scenario "${scenario.title}"${useDebugMode ? ' in debug mode' : ''}`);
    
    // If not in debug mode, execute all steps automatically
    if (!useDebugMode) {
      try {
        let stepsCompleted = 0;
        
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
        
        // Reset execution state
        setExecuting(false);
        setCurrentStepIndex(-1);
        setExecutionProgress(0);
        setPendingSteps([]);
      } catch (error) {
        // Handle execution error
        console.error('Error executing scenario:', error);
        setExecutionError(error instanceof Error ? error.message : 'Unknown error');
        message.error(`Error executing scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Reset execution state
        setExecuting(false);
        setCurrentStepIndex(-1);
        setExecutionProgress(0);
        setPendingSteps([]);
      }
    } else {
      // In debug mode, just set up the initial state and wait for user to click "Next Step"
      message.info('Debug mode active. Click "Next Step" to execute each step individually.');
    }
  };
  
  /**
   * Executes the next step in debug mode
   * This function is used for step-by-step execution when debug mode is enabled
   * It executes a single step and updates the execution state accordingly
   */
  const executeNextStep = async () => {
    if (!executing || pendingSteps.length === 0) {
      return;
    }
    
    // Don't execute if paused
    if (paused) {
      message.warning('Execution is paused. Resume execution to continue.');
      return;
    }
    
    try {
      // Get the next step
      const nextStep = pendingSteps[0];
      
      // Execute the step
      await StepExecutor.executeStep(nextStep, functions);
      
      // Update state
      const newPendingSteps = [...pendingSteps];
      newPendingSteps.shift(); // Remove the executed step
      setPendingSteps(newPendingSteps);
      
      // Update progress
      const scenario = activeScenarioId ? scenarios[activeScenarioId] : null;
      const totalSteps = scenario ? scenario.data.length * Math.max(1, scenario.repeat) : 0;
      const stepsCompleted = totalSteps - newPendingSteps.length;
      setCurrentStepIndex(stepsCompleted - 1);
      setExecutionProgress(Math.round((stepsCompleted / totalSteps) * 100));
      
      // Check if we're done
      if (newPendingSteps.length === 0) {
        message.success(`Scenario "${scenario?.title}" executed successfully`);
        
        // Reset execution state
        setExecuting(false);
        setCurrentStepIndex(-1);
        setExecutionProgress(0);
        setDebugMode(false);
      }
    } catch (error) {
      // Handle execution error
      console.error('Error executing step:', error);
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
      message.error(`Error executing step: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Pauses the execution of a scenario
   * This function is part of the Pause/Resume feature and allows users to
   * temporarily halt execution at any point
   */
  const pauseExecution = () => {
    if (executing && !paused) {
      setPaused(true);
      message.info('Execution paused. Click "Resume" to continue.');
    }
  };
  
  /**
   * Resumes the execution of a paused scenario
   * This function is part of the Pause/Resume feature and allows users to
   * continue execution after it has been paused
   * In normal mode, it continues automatic execution
   * In debug mode, it just enables the Next Step button
   */
  const resumeExecution = () => {
    if (executing && paused) {
      setPaused(false);
      message.info('Execution resumed.');
      
      // If not in debug mode, continue automatic execution
      if (!debugMode && pendingSteps.length > 0) {
        // Continue execution from where we left off
        const remainingSteps = [...pendingSteps];
        setPendingSteps([]);
        
        // Execute remaining steps
        StepExecutor.executeSteps(
          remainingSteps,
          (stepIndex) => {
            // Update execution state after each step
            const stepsCompleted = (activeScenarioId ? scenarios[activeScenarioId]?.data.length * Math.max(1, scenarios[activeScenarioId]?.repeat) : 0) - remainingSteps.length + stepIndex + 1;
            const totalSteps = activeScenarioId ? scenarios[activeScenarioId]?.data.length * Math.max(1, scenarios[activeScenarioId]?.repeat) : 0;
            setCurrentStepIndex(stepIndex);
            setExecutionProgress(Math.round((stepsCompleted / totalSteps) * 100));
          },
          functions
        ).then(() => {
          // Execution completed successfully
          message.success(`Scenario "${activeScenarioId ? scenarios[activeScenarioId]?.title : ''}" executed successfully`);
          
          // Reset execution state
          setExecuting(false);
          setCurrentStepIndex(-1);
          setExecutionProgress(0);
          setPaused(false);
        }).catch((error) => {
          // Handle execution error
          console.error('Error executing scenario:', error);
          setExecutionError(error instanceof Error ? error.message : 'Unknown error');
          message.error(`Error executing scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Reset execution state
          setExecuting(false);
          setCurrentStepIndex(-1);
          setExecutionProgress(0);
          setPaused(false);
        });
      }
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
      description: scenario.description || '',
      category: scenario.category || undefined,
      tags: scenario.tags || [],
      repeat: scenario.repeat || 0
    });
    
    // Set flag to indicate this is not from recording
    setIsFromRecording(false);
    
    // Show the form view
    setIsEditingScenario(true);
    
    // Set this as the active scenario for editing
    setActiveScenarioId(id);
    
  };
  
  // Delete a scenario
  const deleteScenario = async (id: string) => {
    Modal.confirm({
      title: 'Delete Scenario',
      content: `Are you sure you want to delete "${scenarios[id]?.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
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
    });
  };
  
  // Duplicate a scenario
  const duplicateScenario = async (id: string) => {
    try {
      // Use the utility function to duplicate the scenario
      const { success, id: newId } = await duplicateScenarioInLocalStorage(id);
      
      if (success && newId) {
        // Reload scenarios to include the new one
        const loadedScenarios = await getAllScenariosFromLocalStorage();
        setScenarios(loadedScenarios);
        message.success(`Scenario "${scenarios[id]?.title}" duplicated successfully`);
      } else {
        message.error('Failed to duplicate scenario');
      }
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      message.error('Failed to duplicate scenario');
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
   * Reorders steps by moving a step from one index to another
   * 
   * @param {number} fromIndex - The index of the step to move
   * @param {number} toIndex - The index where the step should be moved to
   */
  const reorderSteps = (fromIndex: number, toIndex: number) => {
    const newSteps = [...currentSteps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    setCurrentSteps(newSteps);
    
    // Show a success message
    message.success(`Step ${fromIndex + 1} moved to position ${toIndex + 1}`);
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
          description: values.description,
          category: values.category,
          tags: values.tags,
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
          
          // Hide the form view and reset the form
          setIsEditingScenario(false);
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
   * Prepares the form for adding a new scenario
   * This resets the form and steps, then shows the form view
   */
  const addScenario = () => {
    // Reset the form and steps
    form.resetFields();
    setCurrentSteps([]);
    
    // Set flag to indicate this is not from recording
    setIsFromRecording(false);
    
    // Show the form view
    setIsEditingScenario(true);
  };
  
  /**
   * Prepares the form for adding a new scenario while recording is active
   * This resets the form and sets the current steps to the recorded steps
   */
  const addNewScenarioWhileRecording = () => {
    // Reset the form
    form.resetFields();
    
    // Set the current steps to the recorded steps
    setCurrentSteps([...recordedSteps]);
    
    // Set flag to indicate this is from recording
    setIsFromRecording(true);
    
    // Show the form view
    setIsEditingScenario(true);
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
   * Handles canceling the scenario editing
   * This hides the form view and resets the form and steps
   */
  const handleCancel = () => {
    setIsEditingScenario(false);
    form.resetFields();
    setCurrentSteps([]);
    setActiveScenarioId(null);
  };
  
  /**
   * Prepares the form for adding a new function
   * This resets the form and shows the form view
   */
  const addFunction = () => {
    // Reset the form and current function
    functionForm.resetFields();
    setCurrentFunction(null);
    
    // Show the form view
    setIsEditingFunction(true);
    
    // Reset the active function ID
    setActiveFunctionId(null);
  };
  
  /**
   * Prepares the form for editing an existing function
   * This sets the form values to the function's values and shows the form view
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
    
    // Show the form view
    setIsEditingFunction(true);
    
    // Set this as the active function for editing
    setActiveFunctionId(id);
    
  };
  
  /**
   * Deletes a function
   * This removes the function from storage and updates the state
   */
  const deleteFunction = async (id: string) => {
    Modal.confirm({
      title: 'Delete Function',
      content: `Are you sure you want to delete "${functions[id]?.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
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
    });
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
          
          // Hide the form view and reset the form
          setIsEditingFunction(false);
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
   * Handles canceling the function editing
   * This hides the form view and resets the form
   */
  const handleFunctionCancel = () => {
    setIsEditingFunction(false);
    functionForm.resetFields();
    setCurrentFunction(null);
    setActiveFunctionId(null);
  };
  
  /**
   * Prepares the form for adding a new schedule
   * This resets the form and shows the form view
   */
  const addSchedule = () => {
    // Reset the form and current schedule
    scheduleForm.resetFields();
    setCurrentSchedule(null);
    
    // Show the form view
    setIsEditingSchedule(true);
    
    // Reset the active schedule ID
    setActiveScheduleId(null);
  };
  
  /**
   * Prepares the form for editing an existing schedule
   * This sets the form values to the schedule's values and shows the form view
   */
  const editSchedule = (id: string) => {
    const schedule = schedules[id];
    
    // Set the current schedule
    setCurrentSchedule(schedule);
    
    // Set the form values
    scheduleForm.setFieldsValue({
      title: schedule.title,
      description: schedule.description || '',
      scenarioId: schedule.scenarioId,
      enabled: schedule.enabled,
      frequency: schedule.frequency,
      startDate: schedule.startDate ? dayjs(schedule.startDate) : undefined,
      startTime: schedule.startTime ? dayjs(schedule.startTime, 'HH:mm') : undefined,
      endDate: schedule.endDate ? dayjs(schedule.endDate) : undefined,
      daysOfWeek: schedule.daysOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      interval: schedule.interval
    });
    
    // Show the form view
    setIsEditingSchedule(true);
    
    // Set this as the active schedule for editing
    setActiveScheduleId(id);
  };
  
  /**
   * Deletes a schedule
   * This removes the schedule from storage and updates the state
   */
  const deleteSchedule = async (id: string) => {
    Modal.confirm({
      title: 'Delete Schedule',
      content: `Are you sure you want to delete "${schedules[id]?.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const success = await removeScheduleFromLocalStorage(id);
          
          if (success) {
            // Update the local state
            const updatedSchedules = { ...schedules };
            delete updatedSchedules[id];
            setSchedules(updatedSchedules);
            message.success('Schedule deleted successfully');
          } else {
            message.error('Failed to delete schedule');
          }
        } catch (error) {
          console.error('Error deleting schedule:', error);
          message.error('Failed to delete schedule');
        }
      }
    });
  };
  
  /**
   * Toggles the enabled status of a schedule
   * This updates the schedule in storage and updates the state
   */
  const toggleScheduleEnabled = async (id: string, enabled: boolean) => {
    try {
      // Get the schedule
      const schedule = schedules[id];
      
      if (!schedule) {
        console.error(`Schedule with ID ${id} not found`);
        return;
      }
      
      // Update the enabled status
      const updatedSchedule = { ...schedule, enabled };
      
      // Save the updated schedule
      const success = await saveScheduleToLocalStorage(id, updatedSchedule);
      
      if (success) {
        // Update the local state
        setSchedules(prev => ({
          ...prev,
          [id]: updatedSchedule
        }));
        
        // Show a success message
        const status = enabled ? 'enabled' : 'disabled';
        message.success(`Schedule "${schedule.title}" has been ${status}.`);
      } else {
        // Show an error message if the save failed
        message.error('Failed to update schedule. Please try again.');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      message.error('Failed to update schedule. Please try again.');
    }
  };
  
  /**
   * Saves the schedule using ExtensionStorageManager and updates the UI
   * This function validates the form, creates a schedule object,
   * saves it using ExtensionStorageManager, and updates the component state
   * If activeScheduleId is set, it updates the existing schedule; otherwise, it creates a new one
   */
  const saveSchedule = () => {
    // Validate the form fields
    scheduleForm.validateFields().then(async values => {
      try {
        // Format dates and times
        const startDate = values.startDate ? values.startDate.format('YYYY-MM-DD') : '';
        const startTime = values.startTime ? values.startTime.format('HH:mm') : '';
        const endDate = values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined;
        
        // Calculate the next execution time
        let nextExecution = '';
        if (startDate && startTime) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const nextDate = new Date(startDate);
          nextDate.setHours(hours, minutes, 0, 0);
          
          // If the next execution time is in the past, adjust it based on the frequency
          if (nextDate < new Date()) {
            switch (values.frequency) {
              case ScheduleFrequency.ONCE:
                // For one-time schedules, keep the original date
                break;
              case ScheduleFrequency.DAILY:
                // For daily schedules, set to tomorrow at the same time
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case ScheduleFrequency.WEEKLY:
                // For weekly schedules, set to next week at the same time
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case ScheduleFrequency.MONTHLY:
                // For monthly schedules, set to next month at the same time
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
              case ScheduleFrequency.CUSTOM:
                // For custom schedules, add the interval in minutes
                nextDate.setMinutes(nextDate.getMinutes() + (values.interval || 0));
                break;
            }
          }
          
          nextExecution = nextDate.toISOString();
        }
        
        // Create the schedule object
        const scheduleToSave: ScheduleConfig = {
          title: values.title,
          description: values.description,
          scenarioId: values.scenarioId,
          enabled: values.enabled,
          frequency: values.frequency,
          startDate,
          startTime,
          endDate,
          daysOfWeek: values.daysOfWeek,
          dayOfMonth: values.dayOfMonth,
          interval: values.interval,
          nextExecution
        };
        
        let success = false;
        let scheduleId = '';
        
        // Check if we're updating an existing schedule or creating a new one
        if (activeScheduleId) {
          // Update existing schedule
          success = await saveScheduleToLocalStorage(activeScheduleId, scheduleToSave);
          scheduleId = activeScheduleId;
        } else {
          // Generate a unique ID for the new schedule
          const id = await generateUniqueId();
          success = await saveScheduleToLocalStorage(id, scheduleToSave);
          scheduleId = `sc_sch_${id}`;
        }
        
        if (success) {
          // Update the local state
          setSchedules(prev => ({
            ...prev,
            [scheduleId]: scheduleToSave
          }));
          
          // Hide the form view and reset the form
          setIsEditingSchedule(false);
          scheduleForm.resetFields();
          setCurrentSchedule(null);
          setActiveScheduleId(null);
          
          // Show a success message
          const action = activeScheduleId ? 'updated' : 'saved';
          message.success(`Schedule "${scheduleToSave.title}" has been ${action}.`);
        } else {
          // Show an error message if the save failed
          message.error('Failed to save schedule. Please try again.');
        }
      } catch (error) {
        console.error('Error saving schedule:', error);
        message.error('Failed to save schedule. Please try again.');
      }
    }).catch(error => {
      // Log validation errors
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields.');
    });
  };
  
  /**
   * Handles canceling the schedule editing
   * This hides the form view and resets the form
   */
  const handleScheduleCancel = () => {
    setIsEditingSchedule(false);
    scheduleForm.resetFields();
    setCurrentSchedule(null);
    setActiveScheduleId(null);
  };
  
  /**
   * Prepares the form for adding a new trigger
   * This resets the form and shows the form view
   */
  const addTrigger = () => {
    // Reset the form and current trigger
    triggerForm.resetFields();
    setCurrentTrigger(null);
    
    // Show the form view
    setIsEditingTrigger(true);
    
    // Reset the active trigger ID
    setActiveTriggerID(null);
  };
  
  /**
   * Prepares the form for editing an existing trigger
   * This sets the form values to the trigger's values and shows the form view
   */
  const editTrigger = (id: string) => {
    const trigger = triggers[id];
    
    // Set the current trigger
    setCurrentTrigger(trigger);
    
    // Set the form values
    triggerForm.setFieldsValue({
      title: trigger.title,
      description: trigger.description || '',
      scenarioId: trigger.scenarioId,
      enabled: trigger.enabled,
      type: trigger.type,
      condition: trigger.condition
    });
    
    // Show the form view
    setIsEditingTrigger(true);
    
    // Set this as the active trigger for editing
    setActiveTriggerID(id);
  };
  
  /**
   * Deletes a trigger
   * This removes the trigger from storage and updates the state
   */
  const deleteTrigger = async (id: string) => {
    Modal.confirm({
      title: 'Delete Trigger',
      content: `Are you sure you want to delete "${triggers[id]?.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const success = await removeTriggerFromLocalStorage(id);
          
          if (success) {
            // Update the local state
            const updatedTriggers = { ...triggers };
            delete updatedTriggers[id];
            setTriggers(updatedTriggers);
            message.success('Trigger deleted successfully');
          } else {
            message.error('Failed to delete trigger');
          }
        } catch (error) {
          console.error('Error deleting trigger:', error);
          message.error('Failed to delete trigger');
        }
      }
    });
  };
  
  /**
   * Toggles the enabled status of a trigger
   * This updates the trigger in storage and updates the state
   */
  const toggleTriggerEnabled = async (id: string, enabled: boolean) => {
    try {
      // Get the trigger
      const trigger = triggers[id];
      
      if (!trigger) {
        console.error(`Trigger with ID ${id} not found`);
        return;
      }
      
      // Update the enabled status
      const updatedTrigger = { ...trigger, enabled };
      
      // Save the updated trigger
      const success = await saveTriggerToLocalStorage(id, updatedTrigger);
      
      if (success) {
        // Update the local state
        setTriggers(prev => ({
          ...prev,
          [id]: updatedTrigger
        }));
        
        // Show a success message
        const status = enabled ? 'enabled' : 'disabled';
        message.success(`Trigger "${trigger.title}" has been ${status}.`);
      } else {
        // Show an error message if the save failed
        message.error('Failed to update trigger. Please try again.');
      }
    } catch (error) {
      console.error('Error updating trigger:', error);
      message.error('Failed to update trigger. Please try again.');
    }
  };
  
  /**
   * Saves the trigger using ExtensionStorageManager and updates the UI
   * This function validates the form, creates a trigger object,
   * saves it using ExtensionStorageManager, and updates the component state
   * If activeTriggerID is set, it updates the existing trigger; otherwise, it creates a new one
   */
  const saveTrigger = () => {
    // Validate the form fields
    triggerForm.validateFields().then(async values => {
      try {
        // Create the trigger object
        const triggerToSave: TriggerConfig = {
          title: values.title,
          description: values.description,
          scenarioId: values.scenarioId,
          enabled: values.enabled,
          type: values.type,
          condition: values.condition
        };
        
        let success = false;
        let triggerId = '';
        
        // Check if we're updating an existing trigger or creating a new one
        if (activeTriggerID) {
          // Update existing trigger
          success = await saveTriggerToLocalStorage(activeTriggerID, triggerToSave);
          triggerId = activeTriggerID;
        } else {
          // Generate a unique ID for the new trigger
          const id = await generateUniqueId();
          success = await saveTriggerToLocalStorage(id, triggerToSave);
          triggerId = `sc_tr_${id}`;
        }
        
        if (success) {
          // Update the local state
          setTriggers(prev => ({
            ...prev,
            [triggerId]: triggerToSave
          }));
          
          // Hide the form view and reset the form
          setIsEditingTrigger(false);
          triggerForm.resetFields();
          setCurrentTrigger(null);
          setActiveTriggerID(null);
          
          // Show a success message
          const action = activeTriggerID ? 'updated' : 'saved';
          message.success(`Trigger "${triggerToSave.title}" has been ${action}.`);
        } else {
          // Show an error message if the save failed
          message.error('Failed to save trigger. Please try again.');
        }
      } catch (error) {
        console.error('Error saving trigger:', error);
        message.error('Failed to save trigger. Please try again.');
      }
    }).catch(error => {
      // Log validation errors
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields.');
    });
  };
  
  /**
   * Handles canceling the trigger editing
   * This hides the form view and resets the form
   */
  const handleTriggerCancel = () => {
    setIsEditingTrigger(false);
    triggerForm.resetFields();
    setCurrentTrigger(null);
    setActiveTriggerID(null);
  };
  
  if (!isActive) {
    return null;
  }
  
  // Loading state is now handled within each tab
  
  const scenarioKeys = Object.keys(scenarios);
  
  
  
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
              {debugMode && <span style={{ marginLeft: '8px', color: '#1890ff' }}>(Debug Mode)</span>}
              {paused && <span style={{ marginLeft: '8px', color: '#ff4d4f' }}>(Paused)</span>}
            </span>
            <span>
              {currentStepIndex >= 0 && activeScenarioId && 
                `Step ${currentStepIndex + 1} of ${scenarios[activeScenarioId]?.data.length * Math.max(1, scenarios[activeScenarioId]?.repeat)}`}
            </span>
          </div>
          <Progress percent={executionProgress} status={executionError ? 'exception' : paused ? 'normal' : 'active'} />
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {debugMode && (
              <Button 
                type="primary"
                onClick={executeNextStep}
                disabled={paused || pendingSteps.length === 0}
              >
                Next Step
              </Button>
            )}
            
            {paused ? (
              <Button 
                type="primary" 
                onClick={resumeExecution}
              >
                Resume
              </Button>
            ) : (
              <Button 
                onClick={pauseExecution}
                disabled={!executing}
              >
                Pause
              </Button>
            )}
          </div>
          
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
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Spin tip="Loading scenarios..." size="large" />
                  </div>
                ) : (
                  <>
                    {isEditingScenario ? (
                      <div>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3>{activeScenarioId ? 'Edit' : 'Add'} Scenario</h3>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button onClick={handleCancel}>
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              onClick={saveScenario}
                            >
                              Save Scenario
                            </Button>
                          </div>
                        </div>
                        
                        <AddScenarioForm
                          isFromRecording={isFromRecording}
                          form={form}
                          currentSteps={isFromRecording ? recordedSteps : currentSteps}
                          functions={functions}
                          onAddStep={addStep}
                          onRemoveStep={removeStep}
                          onUpdateStep={updateStep}
                          onReorderSteps={reorderSteps}
                        />
                      </div>
                    ) : (
                      <>
                        <ScenarioList
                          scenarios={scenarios}
                          activeScenarioId={activeScenarioId}
                          recording={recording}
                          executing={executing}
                          executingScenarioId={executing ? activeScenarioId : null}
                          onPlay={playScenario}
                          onEdit={editScenario}
                          onDelete={deleteScenario}
                          onDuplicate={duplicateScenario}
                        />
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                          <Button 
                            type="primary" 
                            onClick={addScenario}
                            icon={<IconPlus size={18} />}
                            style={{ flex: 1 }}
                          >
                            Add Scenario
                          </Button>
                          
                          <Button
                            onClick={startRecording}
                            style={{ 
                              backgroundColor: recording ? '#ff4d4f' : undefined,
                              color: recording ? 'white' : undefined,
                              flex: 1
                            }}
                          >
                            {recording ? 'Stop Recording' : 'Start Recording'}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ),
          },
          {
            key: 'functions',
            label: 'Functions',
            children: (
              <>
                {functionLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Spin tip="Loading functions..." size="large" />
                  </div>
                ) : (
                  <>
                    {isEditingFunction ? (
                      <div>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3>{activeFunctionId ? 'Edit' : 'Add'} Function</h3>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button onClick={handleFunctionCancel}>
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              onClick={saveFunction}
                            >
                              Save Function
                            </Button>
                          </div>
                        </div>
                        
                        <AddFunctionForm
                          form={functionForm}
                          currentFunction={currentFunction}
                        />
                      </div>
                    ) : (
                      <>
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
                    )}
                  </>
                )}
              </>
            ),
          },
          {
            key: 'schedules',
            label: (
              <span>
                <IconCalendar size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Schedules
              </span>
            ),
            children: (
              <>
                {scheduleLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Spin tip="Loading schedules..." size="large" />
                  </div>
                ) : (
                  <>
                    {isEditingSchedule ? (
                      <div>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3>{activeScheduleId ? 'Edit' : 'Add'} Schedule</h3>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button onClick={handleScheduleCancel}>
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              onClick={saveSchedule}
                            >
                              Save Schedule
                            </Button>
                          </div>
                        </div>
                        
                        <ScheduleForm
                          form={scheduleForm}
                          currentSchedule={currentSchedule}
                          scenarios={scenarios}
                        />
                      </div>
                    ) : (
                      <>
                        <ScheduleList
                          schedules={schedules}
                          activeScheduleId={activeScheduleId}
                          onEdit={editSchedule}
                          onDelete={deleteSchedule}
                          onToggleEnabled={toggleScheduleEnabled}
                        />
                        
                        <div style={{ marginTop: '16px' }}>
                          <Button 
                            type="primary" 
                            onClick={addSchedule}
                            icon={<IconPlus size={18} />}
                            style={{ width: '100%' }}
                          >
                            Add Schedule
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ),
          },
          {
            key: 'triggers',
            label: (
              <span>
                <IconBolt size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Triggers
              </span>
            ),
            children: (
              <>
                {triggerLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Spin tip="Loading triggers..." size="large" />
                  </div>
                ) : (
                  <>
                    {isEditingTrigger ? (
                      <div>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3>{activeTriggerID ? 'Edit' : 'Add'} Trigger</h3>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button onClick={handleTriggerCancel}>
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              onClick={saveTrigger}
                            >
                              Save Trigger
                            </Button>
                          </div>
                        </div>
                        
                        <TriggerForm
                          form={triggerForm}
                          currentTrigger={currentTrigger}
                          scenarios={scenarios}
                        />
                      </div>
                    ) : (
                      <>
                        <TriggerList
                          triggers={triggers}
                          activeTriggerID={activeTriggerID}
                          onEdit={editTrigger}
                          onDelete={deleteTrigger}
                          onToggleEnabled={toggleTriggerEnabled}
                        />
                        
                        <div style={{ marginTop: '16px' }}>
                          <Button 
                            type="primary" 
                            onClick={addTrigger}
                            icon={<IconPlus size={18} />}
                            style={{ width: '100%' }}
                          >
                            Add Trigger
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AutomationScenarios;