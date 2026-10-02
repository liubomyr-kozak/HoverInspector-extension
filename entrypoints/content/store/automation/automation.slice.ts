import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CustomFunction,
  ExecutionHistoryEntry,
  ExecutionHistoryMap,
  ExecutionLog,
  ExecutionLogEntry,
  ExecutionStatus,
  FunctionMap,
  Scenario,
  ScenarioMap,
  ScenarioStep,
  ScheduleConfig,
  ScheduleMap,
  StepType,
  TriggerConfig,
  TriggerMap,
} from "../../modules/PopupContainer/AutomationScenarios/types";

// Scenario status enum
export enum ScenarioStatus {
  IDLE = 'idle',
  RECORDING = 'recording', 
  EDITING = 'editing'
}

// Define the state interface
export interface AutomationState {
  // Shared state
  scenarios: ScenarioMap;
  functions: FunctionMap;
  schedules: ScheduleMap;
  triggers: TriggerMap;
  executionHistory: ExecutionHistoryMap;

  // Stored values from getText steps
  storedValues: { [key: string]: string };

  // Loading states
  loading: boolean;
  functionLoading: boolean;
  scheduleLoading: boolean;
  triggerLoading: boolean;
  executionHistoryLoading: boolean;

  // UI state
  activeTab: string;
  expandedScenarios: string[];

  // Scenario state
  currentSteps: ScenarioStep[];
  status: ScenarioStatus;
  activeScenarioId: string | null;
  recordingPaused: boolean;
  executing: boolean;
  currentStepIndex: number;
  executionProgress: number;
  executionError: string | null;
  executionStatus: ExecutionStatus | null;
  executionSpeed: number;
  debugMode: boolean;
  paused: boolean;
  shouldStop: boolean;
  pendingSteps: ScenarioStep[];
  stepStatuses: { [index: number]: ExecutionStatus };

  // Execution modes
  singleStepMode: boolean; // true = execute one step and pause, false = continue execution
  searchedStepIndex: number | null;

  // Step editing state is now handled locally in components

  // Function state
  currentFunction: CustomFunction | null;
  activeFunctionId: string | null;
  isEditingFunction: boolean;

  // Schedule state
  currentSchedule: ScheduleConfig | null;
  activeScheduleId: string | null;
  isEditingSchedule: boolean;

  // Trigger state
  currentTrigger: TriggerConfig | null;
  activeTriggerID: string | null;
  isEditingTrigger: boolean;

  // Execution History state
  executionLog: ExecutionLog | null;
  logEntries: ExecutionLogEntry[];
  currentExecutionLog: ExecutionLog | null;
}

// Define the initial state
const initialState: AutomationState = {
  // Shared state
  scenarios: {},
  functions: {},
  schedules: {},
  triggers: {},
  executionHistory: {},
  storedValues: {},

  // Loading states
  loading: true,
  functionLoading: true,
  scheduleLoading: true,
  triggerLoading: true,
  executionHistoryLoading: true,

  // UI state
  activeTab: "scenarios",
  expandedScenarios: [],

  // Scenario state
  currentSteps: [],
  status: ScenarioStatus.IDLE,
  activeScenarioId: null,
  recordingPaused: false,
  executing: false,
  currentStepIndex: -1,
  executionProgress: 0,
  executionError: null,
  executionStatus: null,
  executionSpeed: 1.5,
  debugMode: false,
  paused: false,
  shouldStop: false,
  pendingSteps: [],
  stepStatuses: {},
  searchedStepIndex: null,
  singleStepMode: false,

  // Step editing state is now handled locally in components

  // Function state
  currentFunction: null,
  activeFunctionId: null,
  isEditingFunction: false,

  // Schedule state
  currentSchedule: null,
  activeScheduleId: null,
  isEditingSchedule: false,

  // Trigger state
  currentTrigger: null,
  activeTriggerID: null,
  isEditingTrigger: false,

  // Execution History state
  executionLog: null,
  logEntries: [],
  currentExecutionLog: null,
};

// Create the slice
const automationSlice = createSlice({
  name: "automation",
  initialState,
  reducers: {
    // Loading state actions
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setFunctionLoading(state, action: PayloadAction<boolean>) {
      state.functionLoading = action.payload;
    },
    setScheduleLoading(state, action: PayloadAction<boolean>) {
      state.scheduleLoading = action.payload;
    },
    setTriggerLoading(state, action: PayloadAction<boolean>) {
      state.triggerLoading = action.payload;
    },
    setExecutionHistoryLoading(state, action: PayloadAction<boolean>) {
      state.executionHistoryLoading = action.payload;
    },

    // UI state actions
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
    toggleScenarioExpanded(state, action: PayloadAction<string>) {
      const scenarioId = action.payload;
      const index = state.expandedScenarios.indexOf(scenarioId);
      if (index === -1) {
        state.expandedScenarios.push(scenarioId);
      } else {
        state.expandedScenarios.splice(index, 1);
      }
    },
    setScenarioExpanded(state, action: PayloadAction<{ id: string; expanded: boolean }>) {
      const { id, expanded } = action.payload;
      const index = state.expandedScenarios.indexOf(id);
      if (expanded && index === -1) {
        state.expandedScenarios.push(id);
      } else if (!expanded && index !== -1) {
        state.expandedScenarios.splice(index, 1);
      }
    },
    collapseAllScenarios(state) {
      state.expandedScenarios = [];
    },
    expandOnlyScenario(state, action: PayloadAction<string>) {
      state.expandedScenarios = [action.payload];
    },

    // Scenario actions
    setScenarios(state, action: PayloadAction<ScenarioMap>) {
      state.scenarios = action.payload;
    },
    addScenario(state, action: PayloadAction<{ id: string; scenario: Scenario }>) {
      state.scenarios[action.payload.id] = action.payload.scenario;
    },
    updateScenario(state, action: PayloadAction<{ id: string; scenario: Scenario }>) {
      state.scenarios[action.payload.id] = action.payload.scenario;
    },
    removeScenario(state, action: PayloadAction<string>) {
      delete state.scenarios[action.payload];
    },
    setCurrentSteps(state, action: PayloadAction<ScenarioStep[]>) {
      state.currentSteps = action.payload;
    },
    addStep(state) {
      const newStep: ScenarioStep = { type: StepType.NOT_SET };
      state.currentSteps.push(newStep);
    },
    addCurrentStep(state, action: PayloadAction<ScenarioStep>) {
      state.currentSteps.push(action.payload);
    },
    // Records typing: consecutive input steps into the same field are merged into one step
    upsertInputStep(state, action: PayloadAction<ScenarioStep>) {
      const lastStep = state.currentSteps[state.currentSteps.length - 1];
      if (lastStep && lastStep.type === StepType.INPUT && lastStep.xpath === action.payload.xpath) {
        lastStep.value = action.payload.value;
        return;
      }
      state.currentSteps.push(action.payload);
    },
    insertStep(state, action: PayloadAction<number>) {
      state.currentSteps.splice(action.payload, 0, { type: StepType.NOT_SET });
    },
    removeStep(state, action: PayloadAction<number>) {
      const index = action.payload;
      
      // Validate index bounds
      if (index < 0 || index >= state.currentSteps.length) {
        console.error('🔥 [REDUX REMOVE STEP] *** INDEX OUT OF BOUNDS ***', {
          index,
          stepsLength: state.currentSteps.length,
          steps: state.currentSteps
        });
        return;
      }
      
      state.currentSteps.splice(index, 1);
    },
    updateStep(state, action: PayloadAction<{ index: number; field: keyof ScenarioStep; value: string }>) {
      const { index, field, value } = action.payload;
      
      // Validate index bounds
      if (index < 0 || index >= state.currentSteps.length) {
        console.error('🔥 [REDUX UPDATE STEP] *** INDEX OUT OF BOUNDS ***', {
          index,
          stepsLength: state.currentSteps.length,
          payload: action.payload
        });
        return;
      }
      
      state.currentSteps[index] = {
        ...state.currentSteps[index],
        [field]: value,
      };
    },
    replaceStep(state, action: PayloadAction<{ index: number; step: ScenarioStep }>) {
      const { index, step } = action.payload;
      if (index < 0 || index >= state.currentSteps.length) return;
      state.currentSteps[index] = step;
    },
    addAlternativeXPath(state, action: PayloadAction<{ index: number; xpath: string }>) {
      const step = state.currentSteps[action.payload.index];
      if (!step.alternativeXpaths) {
        step.alternativeXpaths = [];
      }
      // Only add if it's not already in the array
      if (!step.alternativeXpaths.includes(action.payload.xpath)) {
        step.alternativeXpaths.push(action.payload.xpath);
      }
    },
    reorderSteps(state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) {
      const { fromIndex, toIndex } = action.payload;
      
      // Validate indices bounds
      if (fromIndex < 0 || fromIndex >= state.currentSteps.length || toIndex < 0 || toIndex >= state.currentSteps.length) {
        console.error('🔥 [REDUX REORDER STEPS] *** INDICES OUT OF BOUNDS ***', {
          fromIndex,
          toIndex,
          stepsLength: state.currentSteps.length,
          steps: state.currentSteps
        });
        return;
      }
      
      const [movedStep] = state.currentSteps.splice(fromIndex, 1);
      state.currentSteps.splice(toIndex, 0, movedStep);
    },
    setStatus(state, action: PayloadAction<ScenarioStatus>) {
      state.status = action.payload;
    },
    setActiveScenarioId(state, action: PayloadAction<string | null>) {
      state.activeScenarioId = action.payload;
    },
    setRecordingPaused(state, action: PayloadAction<boolean>) {
      state.recordingPaused = action.payload;
    },
    addAlternativeXPathToCurrentStep(state, action: PayloadAction<{ index: number; xpath: string }>) {
      const step = state.currentSteps[action.payload.index];
      if (!step.alternativeXpaths) {
        step.alternativeXpaths = [];
      }
      // Only add if it's not already in the array
      if (!step.alternativeXpaths.includes(action.payload.xpath)) {
        step.alternativeXpaths.push(action.payload.xpath);
      }
    },
    addAlternativeXPathToRecordedStep(state, action: PayloadAction<{ index: number; xpath: string }>) {
      const step = state.currentSteps[action.payload.index];
      if (!step.alternativeXpaths) {
        step.alternativeXpaths = [];
      }
      // Only add if it's not already in the array
      if (!step.alternativeXpaths.includes(action.payload.xpath)) {
        step.alternativeXpaths.push(action.payload.xpath);
      }
    },

    // Execution actions
    setExecuting(state, action: PayloadAction<boolean>) {
      state.executing = action.payload;
    },
    setCurrentStepIndex(state, action: PayloadAction<number>) {
      state.currentStepIndex = action.payload;
    },
    setExecutionProgress(state, action: PayloadAction<number>) {
      state.executionProgress = action.payload;
    },
    setExecutionError(state, action: PayloadAction<string | null>) {
      state.executionError = action.payload;
    },
    setExecutionStatus(state, action: PayloadAction<ExecutionStatus | null>) {
      state.executionStatus = action.payload;
    },
    setExecutionSpeed(state, action: PayloadAction<number>) {
      state.executionSpeed = action.payload;
    },
    setDebugMode(state, action: PayloadAction<boolean>) {
      state.debugMode = action.payload;
    },
    setPaused(state, action: PayloadAction<boolean>) {
      state.paused = action.payload;
    },
    setShouldStop(state, action: PayloadAction<boolean>) {
      state.shouldStop = action.payload;
    },
    setSingleStepMode(state, action: PayloadAction<boolean>) {
      state.singleStepMode = action.payload;
    },
    setPendingSteps(state, action: PayloadAction<ScenarioStep[]>) {
      state.pendingSteps = action.payload;
    },

    // Step status actions
    setStepStatus(state, action: PayloadAction<{ index: number; status: ExecutionStatus }>) {
      state.stepStatuses = {
        ...state.stepStatuses,
        [action.payload.index]: action.payload.status,
      };
    },

    clearStepStatuses(state) {
      state.stepStatuses = {};
    },

    setSearchedStepIndex(state, action: PayloadAction<number | null>) {
      state.searchedStepIndex = action.payload;
    },

    // Function actions
    setFunctions(state, action: PayloadAction<FunctionMap>) {
      state.functions = action.payload;
    },
    addFunction(state, action: PayloadAction<{ id: string; func: CustomFunction }>) {
      state.functions[action.payload.id] = action.payload.func;
    },
    updateFunction(state, action: PayloadAction<{ id: string; func: CustomFunction }>) {
      state.functions[action.payload.id] = action.payload.func;
    },
    removeFunction(state, action: PayloadAction<string>) {
      delete state.functions[action.payload];
    },
    setCurrentFunction(state, action: PayloadAction<CustomFunction | null>) {
      state.currentFunction = action.payload;
    },
    setActiveFunctionId(state, action: PayloadAction<string | null>) {
      state.activeFunctionId = action.payload;
    },
    setIsEditingFunction(state, action: PayloadAction<boolean>) {
      state.isEditingFunction = action.payload;
    },

    // Schedule actions
    setSchedules(state, action: PayloadAction<ScheduleMap>) {
      state.schedules = action.payload;
    },
    addSchedule(state, action: PayloadAction<{ id: string; schedule: ScheduleConfig }>) {
      state.schedules[action.payload.id] = action.payload.schedule;
    },
    updateSchedule(state, action: PayloadAction<{ id: string; schedule: ScheduleConfig }>) {
      state.schedules[action.payload.id] = action.payload.schedule;
    },
    removeSchedule(state, action: PayloadAction<string>) {
      delete state.schedules[action.payload];
    },
    setCurrentSchedule(state, action: PayloadAction<ScheduleConfig | null>) {
      state.currentSchedule = action.payload;
    },
    setActiveScheduleId(state, action: PayloadAction<string | null>) {
      state.activeScheduleId = action.payload;
    },
    setIsEditingSchedule(state, action: PayloadAction<boolean>) {
      state.isEditingSchedule = action.payload;
    },

    // Trigger actions
    setTriggers(state, action: PayloadAction<TriggerMap>) {
      state.triggers = action.payload;
    },
    addTrigger(state, action: PayloadAction<{ id: string; trigger: TriggerConfig }>) {
      state.triggers[action.payload.id] = action.payload.trigger;
    },
    updateTrigger(state, action: PayloadAction<{ id: string; trigger: TriggerConfig }>) {
      state.triggers[action.payload.id] = action.payload.trigger;
    },
    removeTrigger(state, action: PayloadAction<string>) {
      delete state.triggers[action.payload];
    },
    setCurrentTrigger(state, action: PayloadAction<TriggerConfig | null>) {
      state.currentTrigger = action.payload;
    },
    setActiveTriggerID(state, action: PayloadAction<string | null>) {
      state.activeTriggerID = action.payload;
    },
    setIsEditingTrigger(state, action: PayloadAction<boolean>) {
      state.isEditingTrigger = action.payload;
    },

    // Stored values actions
    setStoredValue(state, action: PayloadAction<{ key: string; value: string }>) {
      state.storedValues[action.payload.key] = action.payload.value;
    },
    clearStoredValue(state, action: PayloadAction<string>) {
      delete state.storedValues[action.payload];
    },
    clearAllStoredValues(state) {
      state.storedValues = {};
    },

    // Execution History actions
    setExecutionHistory(state, action: PayloadAction<ExecutionHistoryMap>) {
      state.executionHistory = action.payload;
    },
    addExecutionHistory(state, action: PayloadAction<{ id: string; entry: ExecutionHistoryEntry }>) {
      state.executionHistory[action.payload.id] = action.payload.entry;
    },
    removeExecutionHistory(state, action: PayloadAction<string>) {
      delete state.executionHistory[action.payload];
    },
    removeMultipleExecutionHistory(state, action: PayloadAction<string[]>) {
      action.payload.forEach(id => {
        delete state.executionHistory[id];
      });
    },
    setExecutionLog(state, action: PayloadAction<ExecutionLog | null>) {
      state.executionLog = action.payload;
    },
    setLogEntries(state, action: PayloadAction<ExecutionLogEntry[]>) {
      state.logEntries = action.payload;
    },
    setCurrentExecutionLog(state, action: PayloadAction<ExecutionLog | null>) {
      state.currentExecutionLog = action.payload;
    },

    // Step editing actions removed - now handled locally in components

    // Reset actions
    resetScenarioForm(state) {
      state.currentSteps = [];
      state.status = ScenarioStatus.IDLE;
      state.activeScenarioId = null;
    },
    // resetStepEditForm removed - step editing is now handled locally in components
    resetFunctionForm(state) {
      state.currentFunction = null;
      state.isEditingFunction = false;
      state.activeFunctionId = null;
    },
    resetScheduleForm(state) {
      state.currentSchedule = null;
      state.isEditingSchedule = false;
      state.activeScheduleId = null;
    },
    resetTriggerForm(state) {
      state.currentTrigger = null;
      state.isEditingTrigger = false;
      state.activeTriggerID = null;
    },
    resetExecutionState(state) {
      state.executing = false;
      state.currentStepIndex = -1;
      state.executionProgress = 0;
      state.executionError = null;
      state.executionStatus = null;
      state.executionSpeed = 1.5;
      state.debugMode = false;
      state.paused = false;
      state.shouldStop = false;
      state.pendingSteps = [];
      state.stepStatuses = {};
      state.searchedStepIndex = null;
      state.executionLog = null;
      state.logEntries = [];
    },
  },
});

// Export actions
export const automationActions = automationSlice.actions;

// Export selectors
export const selectScenarios = (state: { automation: AutomationState }) => state.automation.scenarios;
export const selectFunctions = (state: { automation: AutomationState }) => state.automation.functions;
export const selectSchedules = (state: { automation: AutomationState }) => state.automation.schedules;
export const selectTriggers = (state: { automation: AutomationState }) => state.automation.triggers;
export const selectExecutionHistory = (state: { automation: AutomationState }) => state.automation.executionHistory;

// Stored values selectors
export const selectStoredValues = (state: { automation: AutomationState }) => state.automation.storedValues;
export const selectStoredValue = (key: string) => (state: { automation: AutomationState }) =>
  state.automation.storedValues[key];

export const selectLoading = (state: { automation: AutomationState }) => state.automation.loading;
export const selectFunctionLoading = (state: { automation: AutomationState }) => state.automation.functionLoading;
export const selectScheduleLoading = (state: { automation: AutomationState }) => state.automation.scheduleLoading;
export const selectTriggerLoading = (state: { automation: AutomationState }) => state.automation.triggerLoading;
export const selectExecutionHistoryLoading = (state: { automation: AutomationState }) =>
  state.automation.executionHistoryLoading;

export const selectActiveTab = (state: { automation: AutomationState }) => state.automation.activeTab;
export const selectExpandedScenarios = (state: { automation: AutomationState }) => state.automation.expandedScenarios;
export const selectIsScenarioExpanded = (id: string) => (state: { automation: AutomationState }) =>
  state.automation.expandedScenarios.includes(id);
export const selectCurrentSteps = (state: { automation: AutomationState }) => state.automation.currentSteps;
export const selectStatus = (state: { automation: AutomationState }) => state.automation.status;
export const selectActiveScenarioId = (state: { automation: AutomationState }) => state.automation.activeScenarioId;
export const selectRecordingPaused = (state: { automation: AutomationState }) => state.automation.recordingPaused;

// Helper selectors for backward compatibility and cleaner usage
export const selectIsEditingScenario = (state: { automation: AutomationState }) => state.automation.status === ScenarioStatus.EDITING;
export const selectRecording = (state: { automation: AutomationState }) => state.automation.status === ScenarioStatus.RECORDING;

export const selectExecuting = (state: { automation: AutomationState }) => state.automation.executing;
export const selectCurrentStepIndex = (state: { automation: AutomationState }) => state.automation.currentStepIndex;
export const selectExecutionProgress = (state: { automation: AutomationState }) => state.automation.executionProgress;
export const selectExecutionError = (state: { automation: AutomationState }) => state.automation.executionError;
export const selectExecutionStatus = (state: { automation: AutomationState }) => state.automation.executionStatus;
export const selectExecutionSpeed = (state: { automation: AutomationState }) => state.automation.executionSpeed;
export const selectDebugMode = (state: { automation: AutomationState }) => state.automation.debugMode;
export const selectPaused = (state: { automation: AutomationState }) => state.automation.paused;
export const selectShouldStop = (state: { automation: AutomationState }) => state.automation.shouldStop;
export const selectSingleStepMode = (state: { automation: AutomationState }) => state.automation.singleStepMode;
export const selectPendingSteps = (state: { automation: AutomationState }) => state.automation.pendingSteps;
export const selectStepStatuses = (state: { automation: AutomationState }) => state.automation.stepStatuses;
export const selectSearchedStepIndex = (state: { automation: AutomationState }) => state.automation.searchedStepIndex;

// Step editing selectors removed - step editing is now handled locally in components

export const selectCurrentFunction = (state: { automation: AutomationState }) => state.automation.currentFunction;
export const selectActiveFunctionId = (state: { automation: AutomationState }) => state.automation.activeFunctionId;
export const selectIsEditingFunction = (state: { automation: AutomationState }) => state.automation.isEditingFunction;

export const selectCurrentSchedule = (state: { automation: AutomationState }) => state.automation.currentSchedule;
export const selectActiveScheduleId = (state: { automation: AutomationState }) => state.automation.activeScheduleId;
export const selectIsEditingSchedule = (state: { automation: AutomationState }) => state.automation.isEditingSchedule;

export const selectCurrentTrigger = (state: { automation: AutomationState }) => state.automation.currentTrigger;
export const selectActiveTriggerID = (state: { automation: AutomationState }) => state.automation.activeTriggerID;
export const selectIsEditingTrigger = (state: { automation: AutomationState }) => state.automation.isEditingTrigger;

export const selectCurrentExecutionLog = (state: { automation: AutomationState }) =>
  state.automation.currentExecutionLog;
export const selectExecutionLog = (state: { automation: AutomationState }) => state.automation.executionLog;
export const selectLogEntries = (state: { automation: AutomationState }) => state.automation.logEntries;

// Export reducer
export default automationSlice.reducer;
