import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";
import { createChromeSlice } from "@entrypoints/core/libs/createChromeSlice.ts";

const notesInitialState = {
  version: 1, // версія slice
  notes: [],
  groups: [],
  searchQuery: "",
  showOnlyCurrentDomain: false,
  selectedNoteId: null,
};

export const notesActionsSlice = createChromeSlice({
  name: "notes",
  version: 2,
  initialState: notesInitialState,
  storage: "localStorage",
  actions: {
    getNoteFormPanelPosition: async () => {
      return await AppStorageService.getNoteFormPanelPosition();
    },

    saveNoteFormPanelPosition: async ({ data }) => {
      return await AppStorageService.saveNoteFormPanelPosition(data);
    },

    // Notes Management Actions
    getAllNotes: async (_, { getState }) => {
      return getState().notes;
    },

    createNote: async ({ data }, { getState, setState }) => {
      debugger;

      const notes = await getState().notes;

      const newNote = {
        ...data,
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        domain: data.domain || "",
        url: data.url || "",
        isVisible: true,
      };

      notes.notes.push(newNote);
      await setState({ notes });
      return newNote;
    },

    updateNote: async ({ data: { id, updates } }, { getState, setState }) => {
      const notes = await getState().notes;

      const noteIndex = notes.notes.findIndex((note) => note.id === id);
      if (noteIndex !== -1) {
        notes.notes[noteIndex] = {
          ...notes.notes[noteIndex],
          ...updates,
          updatedAt: Date.now(),
        };
        await setState({ notes });
        return notes.notes[noteIndex];
      }
      return null;
    },

    deleteNote: async ({ data: id }, { getState, setState }) => {
      const notes = await getState().notes;

      notes.notes = notes.notes.filter((note) => note.id !== id);
      await setState({ notes });
      return { success: true };
    },

    updateNotesSearchQuery: async ({ data: searchQuery }, { getState, setState }) => {
      const notes = await getState().notes;

      notes.searchQuery = searchQuery;
      await setState(notes);
    },

    toggleNotesShowOnlyCurrentDomain: async ({ data: showOnlyCurrentDomain }, { getState, setState }) => {
      const notes = await getState().notes;

      notes.showOnlyCurrentDomain = showOnlyCurrentDomain;
      await setState({ notes });
    },

    createNoteGroup: async ({ data }, { setState, getState }) => {
      const notes = await getState().notes;

      const newGroup = {
        ...data,
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isExpanded: true,
      };

      notes.groups.push(newGroup);
      await setState({ notes });
      return newGroup;
    },

    updateNoteGroup: async ({ data: { id, updates } }, { getState, setState }) => {
      const notes = await getState().notes;

      const groupIndex = notes.groups.findIndex((group) => group.id === id);
      if (groupIndex !== -1) {
        notes.groups[groupIndex] = {
          ...notes.groups[groupIndex],
          ...updates,
          updatedAt: Date.now(),
        };
        await setState({ notes });
        return notes.groups[groupIndex];
      }
      return null;
    },

    deleteNoteGroup: async ({ data: id }) => {
      const notes = await AppStorageService.getNotesData();

      // Remove group and unassign notes from this group
      notes.groups = notes.groups.filter((group) => group.id !== id);
      notes.notes = notes.notes.map((note) => (note.groupId === id ? { ...note, groupId: undefined } : note));

      await AppStorageService.setNotesData(notes);
      return { success: true };
    },

    setSelectedNote: async ({ data: selectedNoteId }) => {
      const notes = await AppStorageService.getNotesData();

      notes.selectedNoteId = selectedNoteId;
      await AppStorageService.setNotesData(notes);
    },

    // Color Palette Management Actions
    getColorPalettes: async () => {
      const appState = await AppStorageService.getAppState();
      return appState.colorPalettes || [];
    },

    setColorPalettes: async ({ data: colorPalettes }) => {
      const appState = await AppStorageService.getAppState();
      await AppStorageService.setAppState({
        ...appState,
        colorPalettes,
      });
    },

    createColorPalette: async ({ data }) => {
      const appState = await AppStorageService.getAppState();

      const newColorPalette = {
        ...data,
        id: data.id || `color_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      const colorPalettes = appState.colorPalettes || [];
      colorPalettes.push(newColorPalette);

      await AppStorageService.setAppState({
        ...appState,
        colorPalettes,
      });

      return newColorPalette;
    },

    updateColorPalette: async ({ data: { id, updates } }) => {
      const appState = await AppStorageService.getAppState();
      const colorPalettes = appState.colorPalettes || [];

      const paletteIndex = colorPalettes.findIndex((palette) => palette.id === id);
      if (paletteIndex !== -1) {
        colorPalettes[paletteIndex] = {
          ...colorPalettes[paletteIndex],
          ...updates,
        };

        await AppStorageService.setAppState({
          ...appState,
          colorPalettes,
        });

        return colorPalettes[paletteIndex];
      }
      return null;
    },

    deleteColorPalette: async ({ data: id }) => {
      const appState = await AppStorageService.getAppState();
      const colorPalettes = appState.colorPalettes || [];

      const updatedColorPalettes = colorPalettes.filter((palette) => palette.id !== id);

      await AppStorageService.setAppState({
        ...appState,
        colorPalettes: updatedColorPalettes,
      });

      return { success: true };
    },
  },
});

// Backward-compatible named exports for existing imports across the codebase
export const {
  // NoteForm Panel Position Actions
  getNoteFormPanelPosition,
  saveNoteFormPanelPosition,
  // Notes Management Actions
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  updateNotesSearchQuery,
  toggleNotesShowOnlyCurrentDomain,
  // Groups
  createNoteGroup,
  updateNoteGroup,
  deleteNoteGroup,
  setSelectedNote,
  // Color Palettes
  getColorPalettes,
  createColorPalette,
  updateColorPalette,
  deleteColorPalette,
} = notesActionsSlice as any;
