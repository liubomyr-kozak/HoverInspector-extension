import { chromeActionsSlice } from "@entrypoints/core/libs/chromeActionsSlice.ts";
import { elementDetailsActions } from "../actions/elementDetailsActions.ts";

export const elementDetailsSlice = chromeActionsSlice(elementDetailsActions);

export const {
  getAllSavedElementDetails,
  getSavedElementDetails,
  saveElementDetails,
  removeSavedElementDetails,
  getElementDetailsPanelPosition,
  saveElementDetailsPanelPosition,
} = elementDetailsSlice;
