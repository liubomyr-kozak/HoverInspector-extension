import { USER_STATUS_NEW } from "@entrypoints/content/store/app.constant";
import { NotesState } from "@entrypoints/shared/types/notes";

export const appSettingsInitial = {
  name: "settings",
  settings: {},
  isActive: true,
  featurePopupPosition: {
    x: 16,
    y: 40, // below the Page Ruler strip
    width: 380,
    height: 560,
  },
  preventDefault: false,
  isSingleSelect: false,
  showAllBorders: false,
  selectedElementType: "selectedElement",
  viewType: "code",
  launcher: {
    iconOrder: [] as string[],
    activeIcons: ["inspector"] as string[],
    minimizedPosition: {
      x: 20,
      y: 20,
    },
  },
  user: {
    status: USER_STATUS_NEW,
  },
  sponsorMessage: {
    hiddenUntil: 0, // Timestamp until which the sponsor message should be hidden (0 means not hidden)
  },
  colorHistory: [] as string[], // Store history of selected colors
  visibleFeatures: ["inspector"] as string[], // Store visible features list
  minimizedFeatures: [] as string[], // Store features that should use minimized launcher
  notes: {
    notes: [],
    groups: [],
    searchQuery: "",
    selectedNoteId: undefined,
  } as NotesState, // Store page notes
  version: "1.0.14",
};

/**
 * Brings a stored settings object up to the current shape: keeps every value the user saved and
 * fills keys added since with defaults, instead of wiping the settings on each version bump.
 */
export const migrateAppSettings = (stored: any) => {
  if (!stored || typeof stored !== "object") return appSettingsInitial;

  return {
    ...appSettingsInitial,
    ...stored,
    featurePopupPosition: { ...appSettingsInitial.featurePopupPosition, ...stored.featurePopupPosition },
    launcher: {
      ...appSettingsInitial.launcher,
      ...stored.launcher,
      minimizedPosition: { ...appSettingsInitial.launcher.minimizedPosition, ...stored.launcher?.minimizedPosition },
    },
    user: { ...appSettingsInitial.user, ...stored.user },
    sponsorMessage: { ...appSettingsInitial.sponsorMessage, ...stored.sponsorMessage },
    colorHistory: Array.isArray(stored.colorHistory) ? stored.colorHistory : appSettingsInitial.colorHistory,
    visibleFeatures: Array.isArray(stored.visibleFeatures) ? stored.visibleFeatures : appSettingsInitial.visibleFeatures,
    minimizedFeatures: Array.isArray(stored.minimizedFeatures)
      ? stored.minimizedFeatures
      : appSettingsInitial.minimizedFeatures,
    version: appSettingsInitial.version,
  };
};
