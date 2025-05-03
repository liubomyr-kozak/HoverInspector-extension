import {combineReducers} from "redux";

import app from './app/app.slice.ts';
import draggableModal from "@entrypoints/shared/components/ModalDraggable/store/draggableModalSlice.ts";

const rootReducer = combineReducers({
    app,
    draggableModal,
});

export default rootReducer;
