import { createChromeSlice } from "@entrypoints/core/libs/createChromeSlice.ts";
import {
  Note,
  NoteLocation,
  NotesState,
  NoteViewType,
  NoteGroup,
  ColorPalette,
  AttachmentType,
  CreateNotePayload,
  UpdateNotePayload,
  CreateNoteGroupPayload,
  UpdateNoteGroupPayload,
  CreateColorPalettePayload,
  UpdateColorPalettePayload,
  DeleteColorPalettePayload,
  SetColorPalettesPayload,
} from "@entrypoints/shared/types/notes";
import {
  createNewNote,
  updateNoteData,
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
  selectedNoteId: undefined,
};

// Type definitions for action payloads

export const notesActionsSlice = createChromeSlice({
  name: "notes",
  version: 2,
  initialState: notesInitialState,
  storage: "localStorage",
  actions: {
    getNoteFormPanelPosition: async (_: void, { getState }): Promise<any> => {
      return await getState().position;
    },

    saveNoteFormPanelPosition: async (data: any, { getState, setState }): Promise<any> => {
      return setState({ position: data });
    },

    // Notes Management Actions
    getAllNotes: async (_: void, { getState }): Promise<NotesState> => {
      debugger;
      return getState();
    },

    createNote: async (data: CreateNotePayload, { getState, setState }): Promise<Note> => {
      const state = await getState();
      const notes = state.notes;

      debugger;
      const newNote = createNewNote(data);
      notes.push(newNote);

      setState({ notes });

      return newNote;
    },

    updateNote: async (payload: UpdateNotePayload, { getState, setState }): Promise<Note | null> => {
      const { id, updates } = payload;

      const notes = await getState().notes;

      const noteIndex = notes.findIndex((note) => note.id === id);
      if (noteIndex !== -1) {
        const existingNote = notes[noteIndex];

        // Use centralized function to update note data
        const updatedNote = updateNoteData(existingNote, updates);
        notes[noteIndex] = updatedNote;

        setState({ notes });
        return updatedNote;
      }
      return null;
    },

    deleteNote: async (id: string, { getState, setState }): Promise<{ success: boolean }> => {
      let notes = await getState().notes;
      debugger;

      notes = notes.filter((note) => note.id !== id);
      setState({ notes });

      return { success: true };
    },

    updateNotesSearchQuery: async (searchQuery: string, { getState, setState }): Promise<void> => {
      setState({ searchQuery });
    },

    createNoteGroup: async (payload: CreateNoteGroupPayload, { setState, getState }): Promise<NoteGroup> => {
      const state = await getState();

      debugger;

      // Use centralized function to create new group
      const newGroup = createNewNoteGroup(payload);

      state.groups.push(newGroup);
      setState({ groups: state.groups });
      return newGroup;
    },

    updateNoteGroup: async (payload: UpdateNoteGroupPayload, { getState, setState }): Promise<NoteGroup | null> => {
      const state = await getState();
      const { id, updates } = payload;

      const groupIndex = state.groups.findIndex((group) => group.id === id);
      if (groupIndex !== -1) {
        const existingGroup = state.groups[groupIndex];

        // Use centralized function to update group data
        const updatedGroup = updateNoteGroupData(existingGroup, updates);
        state.groups[groupIndex] = updatedGroup;

        setState({ groups: state.groups });
        return updatedGroup;
      }
      return null;
    },

    deleteNoteGroup: async (id: string, { getState, setState }): Promise<{ success: boolean }> => {
      const state = await getState();

      // Remove group and use centralized function to unassign notes from this group
      const updatedGroups = state.groups.filter((group) => group.id !== id);
      const updatedNotes = removeNotesFromGroup(state.notes, id);

      setState({
        groups: updatedGroups,
        notes: updatedNotes,
      });
      return { success: true };
    },

    setSelectedNote: async (selectedNoteId: string | undefined, { getState, setState }): Promise<void> => {
      const notes = await getState().notes;

      notes.selectedNoteId = selectedNoteId;
      setState({ notes });
    },

    // Color Palette Management Actions
    getColorPalettes: async (_: void, { getState, setState }): Promise<ColorPalette[]> => {
      return getState().colorPalettes || [];
    },

    setColorPalettes: async (payload: SetColorPalettesPayload, { getState, setState }): Promise<void> => {
      const state = await getState();
      setState({
        ...state,
        payload,
      });
    },

    createColorPalette: async (payload: CreateColorPalettePayload, { getState, setState }): Promise<ColorPalette> => {
      const state = await getState();

      // Use centralized function to create new color palette
      const newColorPalette = createNewColorPalette(payload);

      const colorPalettes = state.colorPalettes || [];
      colorPalettes.push(newColorPalette);

      setState({
        ...state,
        colorPalettes,
      });

      return newColorPalette;
    },

    updateColorPalette: async (
      payload: UpdateColorPalettePayload,
      { getState, setState },
    ): Promise<ColorPalette | null> => {
      const {
        data: { id, updates },
      } = payload;
      const state = await getState();
      const colorPalettes = state.colorPalettes || [];

      const paletteIndex = colorPalettes.findIndex((palette) => palette.id === id);
      if (paletteIndex !== -1) {
        colorPalettes[paletteIndex] = {
          ...colorPalettes[paletteIndex],
          ...updates,
        };

        setState({
          ...state,
          colorPalettes,
        });

        return colorPalettes[paletteIndex];
      }
      return null;
    },

    deleteColorPalette: async (
      id: DeleteColorPalettePayload,
      { getState, setState },
    ): Promise<{ success: boolean }> => {
      const state = await getState();
      const colorPalettes = state.colorPalettes || [];

      const updatedColorPalettes = colorPalettes.filter((palette) => palette.id !== id);

      setState({
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
