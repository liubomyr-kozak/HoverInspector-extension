import { all, spawn } from "redux-saga/effects";

import * as appSaga from "./app/app.saga.ts";
import * as automationSaga from "./automation/automation.saga.ts";

export default function* rootSaga() {
  yield all([...Object.values(appSaga), ...Object.values(automationSaga)].map(spawn));
}
