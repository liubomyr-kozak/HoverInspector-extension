import { runSaga, Saga } from "redux-saga";
import { call } from "redux-saga/effects";
import { Store } from "@reduxjs/toolkit";
import { ScenarioStep, StepType } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import {
  executeClickStep,
  executeHoverStep,
  executeInputStep,
  executeKeyPressStep,
  executeNavigateStep,
  executeSelectStep,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/stepExecutor.saga";

/** The step types live watching produces, played by the same code as saved scenarios */
const EXECUTORS: Partial<Record<StepType, (step: ScenarioStep) => Generator>> = {
  [StepType.CLICK]: executeClickStep,
  [StepType.HOVER]: executeHoverStep,
  [StepType.INPUT]: executeInputStep,
  [StepType.SELECT]: executeSelectStep,
  [StepType.KEY_PRESS]: executeKeyPressStep,
  [StepType.NAVIGATE]: executeNavigateStep,
};

function* playOne(step: ScenarioStep) {
  const executor = EXECUTORS[step.type];
  if (!executor) throw new Error(`This step can't be played here: ${step.type}`);
  yield call(executor, step);
}

/**
 * Plays one step of a suggested pattern on this page. Unsaved patterns have no scenario id, so they don't
 * go through playScenarioWatcher (history, sessions); only the step executors are shared.
 *
 * @returns a promise for the step and a function that cancels it
 */
export function playStep(store: Store, step: ScenarioStep): { done: Promise<void>; cancel: () => void } {
  const task = runSaga({ dispatch: store.dispatch, getState: store.getState }, playOne as Saga, step);
  return { done: task.toPromise().then(() => undefined), cancel: () => task.cancel() };
}
