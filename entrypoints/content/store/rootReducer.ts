import { combineReducers } from "redux";

import app from "./app/app.slice.ts";
import draggableModal from "@entrypoints/shared/components/ModalDraggable/store/draggableModalSlice.ts";
import automation from "./automation/automation.slice.ts";
import highlight from "./highlight/highlightSlice.ts";
import elementDetails from "./elementDetails/elementDetails.slice.ts";
import elementCompare from "./elementCompare/elementCompare.slice";

const rootReducer = combineReducers({
  app,
  draggableModal,
  automation,
  highlight,
  elementDetails,
  elementCompare,
});

export default rootReducer;
