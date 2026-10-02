import { takeLatest, takeEvery } from "redux-saga/effects";
import {
  startNewRecordingWatcher,
  deleteExecutionHistoryWatcher,
  deleteFunctionWatcher,
  deleteScenarioWatcher,
  deleteScheduleWatcher,
  deleteTriggerWatcher,
  loadExecutionHistoryWatcher,
  loadFunctionsWatcher,
  loadScenariosWatcher,
  loadSchedulesWatcher,
  loadTriggersWatcher,
  playScenarioWatcher,
  resumeExecutionWatcher,
  saveExecutionHistoryWatcher,
  saveFunctionWatcher,
  saveScenarioWatcher,
  saveScheduleWatcher,
  saveTriggerWatcher,
  stopRecordingWatcher,
  persistEditingStateWatcher,
  restoreEditingStateWatcher,
  syncRecordingStateWatcher,
  clearEditingStateWatcher,
} from "./automation.saga.action";

/**
 * Main saga for automation features
 * This saga connects all the automation saga watchers to the root saga
 */
export function* automationInit() {
  // Load data watchers
  yield takeLatest(loadScenariosWatcher.actionType, loadScenariosWatcher);
  yield takeLatest(loadFunctionsWatcher.actionType, loadFunctionsWatcher);
  yield takeLatest(loadSchedulesWatcher.actionType, loadSchedulesWatcher);
  yield takeLatest(loadTriggersWatcher.actionType, loadTriggersWatcher);
  yield takeLatest(loadExecutionHistoryWatcher.actionType, loadExecutionHistoryWatcher);

  // Save data watchers
  yield takeLatest(saveScenarioWatcher.actionType, saveScenarioWatcher);
  yield takeLatest(saveFunctionWatcher.actionType, saveFunctionWatcher);
  yield takeLatest(saveScheduleWatcher.actionType, saveScheduleWatcher);
  yield takeLatest(saveTriggerWatcher.actionType, saveTriggerWatcher);
  yield takeLatest(saveExecutionHistoryWatcher.actionType, saveExecutionHistoryWatcher);

  // Delete data watchers
  yield takeLatest(deleteScenarioWatcher.actionType, deleteScenarioWatcher);
  yield takeLatest(deleteFunctionWatcher.actionType, deleteFunctionWatcher);
  yield takeLatest(deleteScheduleWatcher.actionType, deleteScheduleWatcher);
  yield takeLatest(deleteTriggerWatcher.actionType, deleteTriggerWatcher);
  yield takeLatest(deleteExecutionHistoryWatcher.actionType, deleteExecutionHistoryWatcher);

  // Recording and playback watchers
  yield takeLatest(startNewRecordingWatcher.actionType, startNewRecordingWatcher);
  yield takeLatest(stopRecordingWatcher.actionType, stopRecordingWatcher);
  yield takeLatest(playScenarioWatcher.actionType, playScenarioWatcher);
  yield takeLatest(resumeExecutionWatcher.actionType, resumeExecutionWatcher);

  // Editing state management watchers
  yield takeLatest(persistEditingStateWatcher.actionType, persistEditingStateWatcher);
  yield takeLatest(restoreEditingStateWatcher.actionType, restoreEditingStateWatcher);
  yield takeLatest(syncRecordingStateWatcher.actionType, syncRecordingStateWatcher);
  yield takeLatest(clearEditingStateWatcher.actionType, clearEditingStateWatcher);
}
