import { combineChromeSlices } from "@entrypoints/core/libs/createChromeSlice.ts";
import { notesActionsSlice } from "./notesActionsSlice.ts";

export const appBackgroundSlice = combineChromeSlices({
  notes: notesActionsSlice,
});
