# Automation System Flow

This document describes the sequential flow of the automation system, focusing on state changes and different types of actions.

## Overview

The automation system is built using Redux for state management and Redux-Saga for handling side effects. It allows users to create, manage, and execute automation scenarios, as well as define custom functions, schedules, and triggers.

## State Structure

The automation state is organized into several sections:

1. **Data Collections**
   - `scenarios`: Map of scenario IDs to scenario objects
   - `functions`: Map of function IDs to function objects
   - `schedules`: Map of schedule IDs to schedule objects
   - `triggers`: Map of trigger IDs to trigger objects
   - `executionHistory`: Map of execution history IDs to execution history entries

2. **Loading States**
   - `loading`: Loading state for scenarios
   - `functionLoading`: Loading state for functions
   - `scheduleLoading`: Loading state for schedules
   - `triggerLoading`: Loading state for triggers
   - `executionHistoryLoading`: Loading state for execution history

3. **UI State**
   - `activeTab`: Currently active tab
   - `expandedScenarios`: List of expanded scenario IDs
   - `keepScenarioExpanded`: Flag to keep scenarios expanded after execution

4. **Scenario State**
   - `currentSteps`: Steps of the currently edited scenario
   - `isEditingScenario`: Flag indicating if a scenario is being edited
   - `activeScenarioId`: ID of the active scenario
   - `recording`: Flag indicating if recording is active
   - `recordingPaused`: Flag indicating if recording is paused
   - `recordedSteps`: Steps recorded during recording

5. **Execution State**
   - `executing`: Flag indicating if a scenario is executing
   - `currentStepIndex`: Index of the current step being executed
   - `executionProgress`: Progress percentage of execution
   - `executionError`: Error message if execution failed
   - `executionStatus`: Status of execution (running, success, error, etc.)
   - `executionSpeed`: Speed multiplier for execution
   - `paused`: Flag indicating if execution is paused
   - `pendingSteps`: Steps pending execution
   - `stepStatuses`: Map of step indices to execution statuses

6. **Function, Schedule, and Trigger States**
   - Similar patterns for each entity type with current item, active ID, and editing flag

## Sequential State Changes

### Initial Loading Process

1. When the application starts, the initial state is set with empty collections and loading flags set to true.
2. The application dispatches load actions for each data type:
   ```javascript
   dispatch(loadScenariosWatcher.getPayload());
   dispatch(loadFunctionsWatcher.getPayload());
   dispatch(loadSchedulesWatcher.getPayload());
   dispatch(loadTriggersWatcher.getPayload());
   dispatch(loadExecutionHistoryWatcher.getPayload());
   ```
3. Each load action triggers a saga that:
   - Sets the corresponding loading flag to true
   - Fetches data from local storage
   - Updates the state with the fetched data
   - Sets the loading flag to false

### User Interactions and State Changes

#### Creating/Editing Scenarios

1. User clicks "Add Scenario" or "Edit" on an existing scenario
   - State changes: `isEditingScenario` set to true, `activeScenarioId` set if editing
   - For editing: `currentSteps` populated with scenario steps

2. User edits scenario details and steps
   - State changes: `currentSteps` updated as user adds/removes/modifies steps

3. User saves the scenario
   - Action: `saveScenarioWatcher` saga triggered
   - Saga generates a new ID if creating a new scenario
   - Saga saves to local storage and updates Redux store
   - State changes: `scenarios` map updated, form state reset

#### Recording Scenarios

1. User starts recording
   - Action: `startNewRecordingWatcher` saga triggered
   - Saga creates a new scenario with a timestamp title
   - State changes: `recording` set to true, `recordedSteps` initialized empty

2. User performs actions that are recorded
   - State changes: `recordedSteps` updated with each recorded action

3. User pauses/resumes recording
   - State changes: `recordingPaused` toggled

4. User saves the recording
   - State changes: `currentSteps` set to `recordedSteps`, `recording` set to false, `isEditingScenario` set to true

#### Executing Scenarios

1. User clicks "Play" on a scenario
   - Action: `playScenarioWatcher` saga triggered
   - State changes: `executing` set to true, `activeScenarioId` set, `pendingSteps` populated

2. Execution begins
   - State changes: `executionStatus` set to RUNNING, `stepStatuses` initialized

3. Each step is executed
   - StepExecutor executes the step and reports result
   - State changes: `currentStepIndex` updated, `executionProgress` updated, `pendingSteps` updated, `stepStatuses` updated

4. Execution completes or fails
   - State changes: `executionStatus` set to SUCCESS/ERROR/CANCELLED, `executionError` set if error, `executing` set to false

#### Managing Functions, Schedules, and Triggers

Similar patterns apply to functions, schedules, and triggers, with state changes following the same create/edit/save/delete flow.

## Types of Actions

### 1. Loading Actions

These actions load data from storage and update the state:

- `loadScenariosWatcher`
- `loadFunctionsWatcher`
- `loadSchedulesWatcher`
- `loadTriggersWatcher`
- `loadExecutionHistoryWatcher`

Example flow:
```
dispatch(loadScenariosWatcher) 
→ setLoading(true) 
→ getAllScenariosFromLocalStorage 
→ setScenarios(data) 
→ setLoading(false)
```

### 2. Saving Actions

These actions save data to storage and update the state:

- `saveScenarioWatcher`
- `saveFunctionWatcher`
- `saveScheduleWatcher`
- `saveTriggerWatcher`
- `saveExecutionHistoryWatcher`

Example flow:
```
dispatch(saveScenarioWatcher) 
→ generateUniqueId (if new) 
→ saveScenarioToLocalStorage 
→ addScenario/updateScenario 
→ resetScenarioForm
```

### 3. Deletion Actions

These actions delete data from storage and update the state:

- `deleteScenarioWatcher`
- `deleteFunctionWatcher`
- `deleteScheduleWatcher`
- `deleteTriggerWatcher`
- `deleteExecutionHistoryWatcher`

Example flow:
```
dispatch(deleteScenarioWatcher) 
→ removeScenarioFromLocalStorage 
→ removeScenario
```

### 4. Execution Actions

These actions control the execution of scenarios:

- `playScenarioWatcher`: Starts or stops scenario execution
- `startNewRecordingWatcher`: Starts recording a new scenario
- `stopRecordingWatcher`: Stops recording

Example flow for execution:
```
dispatch(playScenarioWatcher) 
→ setActiveScenarioId 
→ setExecuting(true) 
→ setPendingSteps 
→ setExecutionStatus(RUNNING) 
→ StepExecutor.executeSteps 
→ [for each step: setCurrentStepIndex, setExecutionProgress, setStepStatus] 
→ setExecutionStatus(final status) 
→ setExecuting(false)
```

### 5. UI State Actions

These actions update UI state without affecting data:

- `setActiveTab`
- `toggleScenarioExpanded`
- `setScenarioExpanded`
- `collapseAllScenarios`
- `expandOnlyScenario`

### 6. Form State Actions

These actions manage form state for editing entities:

- `setIsEditingScenario`
- `setIsEditingFunction`
- `setIsEditingSchedule`
- `setIsEditingTrigger`
- Reset actions for each form type

### 7. Step Management Actions

These actions manage steps in scenarios:

- `setCurrentSteps`
- `addStep`
- `removeStep`
- `updateStep`
- `reorderSteps`

## Execution Flow Details

The execution of a scenario follows these steps:

1. **Initialization**
   - Set active scenario ID
   - Set executing flag to true
   - Set pending steps
   - Initialize execution log
   - Set execution status to RUNNING
   - Clear step statuses
   - Set all pending steps to PENDING status

2. **Step Execution Loop**
   - For each step:
     - Execute the step using StepExecutor
     - Update current step index
     - Update execution progress
     - Update pending steps
     - Update step status to SUCCESS
     - Check if execution should be stopped
     - Add delay between steps based on execution speed

3. **Completion**
   - Set execution status based on result (SUCCESS/ERROR/CANCELLED)
   - Set execution error if applicable
   - Set executing flag to false
   - Reset current step index
   - Clear pending steps
   - Collapse scenario if not keeping expanded

## Conclusion

The automation system uses a well-structured state management approach with Redux and Redux-Saga. State changes follow a predictable pattern for loading, saving, deleting, and executing automation entities. The execution process is handled by the StepExecutor class, which manages the execution of individual steps and reports results back to the Redux store.