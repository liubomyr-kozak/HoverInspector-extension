import { combineReducers } from "redux";

import app from "./app/app.slice.ts";
import draggableModal from "@entrypoints/shared/components/ModalDraggable/store/draggableModalSlice.ts";
import automation from "./automation/automation.slice.ts";

const rootReducer = combineReducers({
  app,
  draggableModal,
  automation,
});

export default rootReducer;
