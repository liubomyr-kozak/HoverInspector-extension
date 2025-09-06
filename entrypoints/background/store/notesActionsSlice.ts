import { createChromeSlice } from "@entrypoints/core/libs/createChromeSlice.ts";
import {
  Note,
  NoteLocation,
  NotesState,
  NoteFormData,
  NoteGroup,
  ColorPalette,
} from "@entrypoints/shared/types/notes.ts";
import {
  createNewNote,
  addLocationToNote,
  updateNoteData,
  ensureNoteHasLocations,
  createNewNoteGroup,
  updateNoteGroupData,
  removeNotesFromGroup,
  createNewColorPalette,
} from "@entrypoints/background/services/notes.ts";

const notesInitialState: NotesState & { version: number } = {
  version: 1, // версія slice
  notes: [],
  groups: [],
  searchQuery: "",
  showOnlyCurrentDomain: false,
  selectedNoteId: undefined,
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

    saveNoteFormPanelPosition: async (data, { getState, setState }) => {
      return await setState({ position: data });
    },

    // Notes Management Actions
    getAllNotes: async (_, { getState }) => {
      return getState();
    },

    createNote: async (data: NoteFormData & { domain: string; url: string }, { getState, setState }) => {
      debugger;

      const state = await getState();
      const notes = state.notes;

      // Check if this is adding to an existing note
      if (data.addToExistingNote && data.existingNoteId) {
        const existingNoteIndex = notes.findIndex((note) => note.id === data.existingNoteId);
        if (existingNoteIndex !== -1) {
          const existingNote = notes[existingNoteIndex];

          // Use centralized function to add location to existing note
          const updatedNote = addLocationToNote(existingNote, data);
          notes[existingNoteIndex] = updatedNote;

          await setState({ notes });
          return updatedNote;
        }
      }

      // Use centralized function to create new note
      const newNote = createNewNote(data);
      notes.push(newNote);

      await setState({ notes });

      return newNote;
    },

    updateNote: async (
      { id, updates }: { id: string; updates: Partial<Note> & { addNewLocation?: boolean } },
      { getState, setState },
    ) => {
      debugger;

      const notes = await getState().notes;

      const noteIndex = notes.findIndex((note) => note.id === id);
      if (noteIndex !== -1) {
        const existingNote = notes[noteIndex];

        // Use centralized function to update note data
        const updatedNote = updateNoteData(existingNote, updates);
        notes[noteIndex] = updatedNote;

        await setState({ notes });
        return updatedNote;
      }
      return null;
    },

    deleteNote: async (id, { getState, setState }) => {
      let notes = await getState().notes;

      notes = notes.filter((note) => note.id !== id);
      await setState({ notes });

      return { success: true };
    },

    updateNotesSearchQuery: async (searchQuery, { getState, setState }) => {
      await setState({ searchQuery });
    },

    toggleNotesShowOnlyCurrentDomain: async (showOnlyCurrentDomain, { getState, setState }) => {
      await setState({ showOnlyCurrentDomain });
    },

    createNoteGroup: async ({ data }, { setState, getState }) => {
      const state = await getState();

      // Use centralized function to create new group
      const newGroup = createNewNoteGroup(data);

      state.groups.push(newGroup);
      await setState({ groups: state.groups });
      return newGroup;
    },

    updateNoteGroup: async ({ id, updates }: { id: string; updates: Partial<NoteGroup> }, { getState, setState }) => {
      const state = await getState();

      const groupIndex = state.groups.findIndex((group) => group.id === id);
      if (groupIndex !== -1) {
        const existingGroup = state.groups[groupIndex];

        // Use centralized function to update group data
        const updatedGroup = updateNoteGroupData(existingGroup, updates);
        state.groups[groupIndex] = updatedGroup;

        await setState({ groups: state.groups });
        return updatedGroup;
      }
      return null;
    },

    deleteNoteGroup: async (id, { getState, setState }) => {
      const state = await getState();

      // Remove group and use centralized function to unassign notes from this group
      const updatedGroups = state.groups.filter((group) => group.id !== id);
      const updatedNotes = removeNotesFromGroup(state.notes, id);

      await setState({
        groups: updatedGroups,
        notes: updatedNotes,
      });
      return { success: true };
    },

    setSelectedNote: async (selectedNoteId, { getState, setState }) => {
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

      // Use centralized function to create new color palette
      const newColorPalette = createNewColorPalette(data);

      const colorPalettes = state.colorPalettes || [];
      colorPalettes.push(newColorPalette);

      await setState({
        ...state,
        colorPalettes,
      });

      return newColorPalette;
    },

    updateColorPalette: async (
      { id, updates }: { id: string; updates: Partial<ColorPalette> },
      { getState, setState },
    ) => {
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
