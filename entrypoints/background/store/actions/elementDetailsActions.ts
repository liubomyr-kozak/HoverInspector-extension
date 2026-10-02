import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";

export const elementDetailsActions = {
  // Element Details Storage Actions
  getAllSavedElementDetails: async () => {
    return await AppStorageService.getAllSavedElementDetails();
  },

  getSavedElementDetails: async ({ data: id }) => {
    return await AppStorageService.getSavedElementDetails(id);
  },

  saveElementDetails: async ({ data }) => {
    return await AppStorageService.saveElementDetails(data);
  },

  removeSavedElementDetails: async ({ data: id }) => {
    return await AppStorageService.removeSavedElementDetails(id);
  },

  // Element Details Panel Position Actions
  getElementDetailsPanelPosition: async () => {
    return await AppStorageService.getElementDetailsPanelPosition();
  },

  saveElementDetailsPanelPosition: async ({ data }) => {
    return await AppStorageService.saveElementDetailsPanelPosition(data);
  },
};
