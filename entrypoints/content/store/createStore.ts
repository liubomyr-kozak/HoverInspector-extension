import { configureStore, Middleware } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";

import rootReducer from "./rootReducer.ts";

import { serviceReduxMiddleware } from "@entrypoints/features/serviceRedux/ServiceReduxMiddleware.ts";
import rootSaga from "./rootSaga.ts";

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware as Middleware, serviceReduxMiddleware as Middleware),
});

sagaMiddleware.run(rootSaga);
