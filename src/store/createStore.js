import thunk from "redux-thunk";
import { createStore, applyMiddleware, compose } from "redux";
import createSagaMiddleware from "redux-saga";
import { composeWithDevTools } from "redux-devtools-extension";

import { serviceReduxMiddleware } from "../core/services/ServiceReduxHandler/serviceReduxMiddleware";

import {
  appInitial as app,
} from "./initialState";
import rootReducer from "./rootReducer";
import rootSaga from "./rootSaga";

const composeEnhancers = composeWithDevTools({
  trace: true,
  traceLimit: 25,
});

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
  rootReducer,
  { app },
  compose(
    composeEnhancers(
      applyMiddleware(thunk, serviceReduxMiddleware, sagaMiddleware)
    ),
  )
);

sagaMiddleware.run(rootSaga);