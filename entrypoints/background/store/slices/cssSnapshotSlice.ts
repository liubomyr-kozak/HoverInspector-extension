import { chromeActionsSlice } from "@entrypoints/core/libs/chromeActionsSlice.ts";
import { cssSnapshotActions } from "../actions/cssSnapshotActions.ts";

export const cssSnapshotSlice = chromeActionsSlice(cssSnapshotActions);

export const { getAllCSSSnapshots, getCSSSnapshot, saveCSSSnapshot, removeCSSSnapshot } = cssSnapshotSlice;
