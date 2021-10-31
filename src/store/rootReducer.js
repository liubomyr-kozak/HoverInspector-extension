import { combineReducers } from "redux";

import { app } from "./redux/app.reducer";

const rootReducer = combineReducers({
  app,
});

export default rootReducer;
