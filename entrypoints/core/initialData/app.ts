import { USER_STATUS_NEW } from "@entrypoints/content/store/app.constant";

export const appSettingsInitial = {
  name: "settings",
  settings: {},
  isActive: true,
  featurePopupPosition: {
    x: 0,
    y: 0,
    width: 350,
    height: 475,
  },
  preventDefault: false,
  isSingleSelect: false,
  showAllBorders: false,
  featurePopupIsMinimized: false,
  selectedElementType: "selectedElement",
  viewType: "code",
  launcher: {
    iconOrder: [] as string[],
    activeIcons: ["inspector"] as string[],
  },
  user: {
    status: USER_STATUS_NEW,
  },
  sponsorMessage: {
    hiddenUntil: 0, // Timestamp until which the sponsor message should be hidden (0 means not hidden)
  },
  colorHistory: [] as string[], // Store history of selected colors
  version: "1.0.13",
};
