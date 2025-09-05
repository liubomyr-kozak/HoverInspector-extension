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
    getNoteFormPanelPosition: async (_, { getState }) => {
      return await getState().position;
    },

    saveNoteFormPanelPosition: async ({ data }, { getState, setState }) => {
      return await setState({ position: data });
    },

    // Notes Management Actions
    getAllNotes: async (_, { getState }) => {
      return getState();
    },

    createNote: async (data: any, { getState, setState }) => {
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

      notes.push(newNote);

      await setState({ notes });

      return newNote;
    },

    updateNote: async ({ id, updates }, { getState, setState }) => {
      const notes = await getState().notes;

      const noteIndex = notes.findIndex((note) => note.id === id);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          ...updates,
          updatedAt: Date.now(),
        };
        await setState({ notes });
        return notes[noteIndex];
      }
      return null;
    },

    deleteNote: async ({ data: id }, { getState, setState }) => {
      let notes = await getState().notes;

      notes = notes.filter((note) => note.id !== id);
      await setState({ notes });

      return { success: true };
    },

    updateNotesSearchQuery: async ({ data: searchQuery }, { getState, setState }) => {
      await setState({ searchQuery });
    },

    toggleNotesShowOnlyCurrentDomain: async ({ data: showOnlyCurrentDomain }, { getState, setState }) => {
      await setState({ showOnlyCurrentDomain });
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

    updateNoteGroup: async ({ id, updates }: any, { getState, setState }) => {
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

    deleteNoteGroup: async ({ data: id }, { getState, setState }) => {
      const notes = await getState().notes;

      // Remove group and unassign notes from this group
      notes.groups = notes.groups.filter((group) => group.id !== id);
      notes.notes = notes.notes.map((note) => (note.groupId === id ? { ...note, groupId: undefined } : note));

      await setState({ notes });
      return { success: true };
    },

    setSelectedNote: async ({ data: selectedNoteId }, { getState, setState }) => {
      const notes = await getState().notes;

      notes.selectedNoteId = selectedNoteId;
      await setState({ notes });
    },

    // Color Palette Management Actions
    getColorPalettes: async (_, { getState, setState }) => {
      return getState().colorPalettes || [];
    },

    setColorPalettes: async ({ data: colorPalettes }, { getState, setState }) => {
      const state = await getState();
      await setState({
        ...state,
        colorPalettes,
      });
    },

    createColorPalette: async ({ data }, { getState, setState }) => {
      const state = await getState();

      const newColorPalette = {
        ...data,
        id: data.id || `color_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      const colorPalettes = state.colorPalettes || [];
      colorPalettes.push(newColorPalette);

      await setState({
        ...state,
        colorPalettes,
      });

      return newColorPalette;
    },

    updateColorPalette: async ({ id, updates }: any, { getState, setState }) => {
      const state = await getState();
      const colorPalettes = state.colorPalettes || [];

      const paletteIndex = colorPalettes.findIndex((palette) => palette.id === id);
      if (paletteIndex !== -1) {
        colorPalettes[paletteIndex] = {
          ...colorPalettes[paletteIndex],
          ...updates,
        };

        await setState({
          ...state,
          colorPalettes,
        });

        return colorPalettes[paletteIndex];
      }
      return null;
    },

    deleteColorPalette: async ({ data: id }, { getState, setState }) => {
      const state = await getState();
      const colorPalettes = state.colorPalettes || [];

      const updatedColorPalettes = colorPalettes.filter((palette) => palette.id !== id);

      await setState({
        ...state,
        colorPalettes: updatedColorPalettes,
      });

      return { success: true };
    },
  },
});

console.log("😂😂😂 :: -> notesActionsSlice", notesActionsSlice);

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
} = notesActionsSlice;
