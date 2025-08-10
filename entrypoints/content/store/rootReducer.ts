import { combineReducers } from "redux";

import app from "./app/app.slice.ts";
import draggableModal from "@entrypoints/shared/components/ModalDraggable/store/draggableModalSlice.ts";
import automation from "./automation/automation.slice.ts";
import highlight from "./highlight/highlightSlice.ts";

const rootReducer = combineReducers({
  app,
  draggableModal,
  automation,
  highlight,
});

export default rootReducer;
