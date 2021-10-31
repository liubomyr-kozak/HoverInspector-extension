import { all, spawn } from "redux-saga/effects";

import * as appSagas from "./saga/app.saga";

export default function* rootSaga() {
  yield all(
    [
      ...Object.values(appSagas),
    ].map(spawn)
  );
}
