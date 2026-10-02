import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";

export const cssSnapshotActions = {
  getAllCSSSnapshots: async () => {
    return await AppStorageService.getAllCSSSnapshots();
  },

  getCSSSnapshot: async ({ data: id }) => {
    return await AppStorageService.getCSSSnapshot(id);
  },

  saveCSSSnapshot: async ({ data }) => {
    return await AppStorageService.saveCSSSnapshot(data);
  },

  removeCSSSnapshot: async ({ data: id }) => {
    return await AppStorageService.removeCSSSnapshot(id);
  },
};
