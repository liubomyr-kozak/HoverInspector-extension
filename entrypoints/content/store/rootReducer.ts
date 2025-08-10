import { combineReducers } from "redux";

import app from "./app/app.slice.ts";
import draggableModal from "@entrypoints/shared/components/ModalDraggable/store/draggableModalSlice.ts";
import automation from "./automation/automation.slice.ts";
import elementDetails from "./elementDetails/elementDetails.slice.ts";
import elementCompare from "./elementCompare/elementCompare.slice";
import snapshot from "./snapshot/snapshotSlice.ts";

const rootReducer = combineReducers({
  app,
  draggableModal,
  automation,
  elementDetails,
  elementCompare,
  snapshot,
});

export default rootReducer;
