import { appStateSlice } from "./slices/appStateSlice.ts";
import { automationSlice } from "./slices/automationSlice.ts";
import { cssSnapshotSlice } from "./slices/cssSnapshotSlice.ts";
import { elementDetailsSlice } from "./slices/elementDetailsSlice.ts";

const slices = [appStateSlice, automationSlice, cssSnapshotSlice, elementDetailsSlice];

export const actionsContextSlice = {
  initMiddleware: () => {
    slices.forEach((slice) => {
      slice.initMiddleware();
    });
  },
};

export * from "./slices/appStateSlice.ts";
export * from "./slices/automationSlice.ts";
export * from "./slices/cssSnapshotSlice.ts";
export * from "./slices/elementDetailsSlice.ts";
