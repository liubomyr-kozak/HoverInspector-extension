import { createChromeSlice } from "@entrypoints/core/libs/createChromeSlice.ts";
import {
  Note,
  NotesState,
  NoteGroup,
  ColorPalette,
  CreateNotePayload,
  UpdateNotePayload,
  CreateNoteGroupPayload,
  UpdateNoteGroupPayload,
  DeleteNoteGroupPayload,
  ImportNotesPayload,
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
  normalizeNoteGroups,
  normalizeColorPalettes,
} from "@entrypoints/background/services/notes.ts";

const notesInitialState: NotesState & { version: number } = {
  version: 1, // версія slice
  notes: [],
  groups: [],
  searchQuery: "",
  selectedNoteId: undefined,
  colorPalettes: [],
};

// Accepts both the wrapped ({ data }) and the plain payload shape
const unwrap = <T,>(payload: { data: T } | T): T =>
  payload && typeof payload === "object" && "data" in (payload as any) ? (payload as any).data : (payload as T);

export const notesActionsSlice = createChromeSlice({
  name: "notes",
  version: 2,
  initialState: notesInitialState,
  storage: "localStorage",
  actions: {
    getNoteFormPanelPosition: async (_: void, { getState }): Promise<any> => {
      return getState().position;
    },

    saveNoteFormPanelPosition: async (data: any, { setState }): Promise<any> => {
      return setState({ position: data });
    },

    // Notes Management Actions
    getAllNotes: async (_: void, { getState, setState }): Promise<NotesState> => {
      const state = getState();
      const groups = normalizeNoteGroups(state.groups);
      const colorPalettes = normalizeColorPalettes(state.colorPalettes);

      // Persist repairs of data written by older versions
      if (
        groups.length !== (state.groups || []).length ||
        groups.some((group, index) => group !== state.groups[index]) ||
        colorPalettes.length !== (state.colorPalettes || []).length ||
        colorPalettes.some((palette, index) => palette !== state.colorPalettes[index])
      ) {
        setState({ groups, colorPalettes });
      }

      return getState();
    },

    createNote: async (data: CreateNotePayload, { getState, setState }): Promise<Note> => {
      const newNote = createNewNote(data);
      setState({ notes: [...(getState().notes || []), newNote] });

      return newNote;
    },

    updateNote: async (payload: UpdateNotePayload, { getState, setState }): Promise<Note | null> => {
      const { id, updates } = payload;
      const notes: Note[] = getState().notes || [];

      const noteIndex = notes.findIndex((note) => note.id === id);
      if (noteIndex === -1) return null;

      // Use centralized function to update note data
      const updatedNote = updateNoteData(notes[noteIndex], updates);
      setState({ notes: notes.map((note, index) => (index === noteIndex ? updatedNote : note)) });

      return updatedNote;
    },

    deleteNote: async (id: string, { getState, setState }): Promise<{ success: boolean }> => {
      const notes: Note[] = getState().notes || [];
      const remaining = notes.filter((note) => note.id !== id);

      setState({
        notes: remaining,
        ...(getState().selectedNoteId === id ? { selectedNoteId: undefined } : {}),
      });

      return { success: remaining.length !== notes.length };
    },

    // Adds notes/groups from an export file. Entries with an existing id are replaced.
    importNotes: async (payload: ImportNotesPayload, { getState, setState }): Promise<{ imported: number }> => {
      const { notes: importedNotes = [], groups: importedGroups = [] } = unwrap(payload) || ({} as any);
      const state = getState();

      const validNotes = (Array.isArray(importedNotes) ? importedNotes : []).filter(
        (note) => note && typeof note.id === "string" && typeof note.content === "string",
      );
      const validGroups = normalizeNoteGroups(Array.isArray(importedGroups) ? importedGroups : []);

      const mergeById = <T extends { id: string }>(current: T[] = [], incoming: T[]) => {
        const incomingIds = new Set(incoming.map((item) => item.id));
        return [...current.filter((item) => !incomingIds.has(item.id)), ...incoming];
      };

      setState({
        notes: mergeById(
          state.notes,
          validNotes.map((note) => ({
            ...note,
            title: note.title ?? "",
            locations: Array.isArray(note.locations) ? note.locations : [],
            isVisible: note.isVisible !== false,
          })),
        ),
        groups: mergeById(state.groups, validGroups),
      });

      return { imported: validNotes.length };
    },

    updateNotesSearchQuery: async (searchQuery: string, { setState }): Promise<void> => {
      setState({ searchQuery });
    },

    createNoteGroup: async (payload: CreateNoteGroupPayload, { setState, getState }): Promise<NoteGroup> => {
      // Use centralized function to create new group
      const newGroup = createNewNoteGroup(unwrap(payload));

      setState({ groups: [...normalizeNoteGroups(getState().groups), newGroup] });
      return newGroup;
    },

    updateNoteGroup: async (payload: UpdateNoteGroupPayload, { getState, setState }): Promise<NoteGroup | null> => {
      const { id, updates } = unwrap(payload);
      const groups = normalizeNoteGroups(getState().groups);

      const groupIndex = groups.findIndex((group) => group.id === id);
      if (groupIndex === -1) return null;

      // Use centralized function to update group data
      const updatedGroup = updateNoteGroupData(groups[groupIndex], updates);
      setState({ groups: groups.map((group, index) => (index === groupIndex ? updatedGroup : group)) });

      return updatedGroup;
    },

    deleteNoteGroup: async (payload: DeleteNoteGroupPayload | string, { getState, setState }): Promise<{ success: boolean }> => {
      const id = unwrap(payload);
      const state = getState();

      // Remove group and use centralized function to unassign notes from this group
      setState({
        groups: normalizeNoteGroups(state.groups).filter((group) => group.id !== id),
        notes: removeNotesFromGroup(state.notes || [], id),
      });
      return { success: true };
    },

    setSelectedNote: async (selectedNoteId: string | undefined, { setState }): Promise<void> => {
      setState({ selectedNoteId });
    },

    // Color Palette Management Actions
    getColorPalettes: async (_: void, { getState, setState }): Promise<ColorPalette[]> => {
      const current = getState().colorPalettes || [];
      const colorPalettes = normalizeColorPalettes(current);

      if (colorPalettes.length !== current.length || colorPalettes.some((p, i) => p !== current[i])) {
        setState({ colorPalettes });
      }
      return colorPalettes;
    },

    setColorPalettes: async (payload: SetColorPalettesPayload, { setState }): Promise<void> => {
      setState({ colorPalettes: normalizeColorPalettes(unwrap(payload)) });
    },

    createColorPalette: async (payload: CreateColorPalettePayload, { getState, setState }): Promise<ColorPalette> => {
      // Use centralized function to create new color palette
      const newColorPalette = createNewColorPalette(unwrap(payload));
      const colorPalettes = normalizeColorPalettes(getState().colorPalettes).filter(
        (palette) => palette.id !== newColorPalette.id,
      );

      setState({ colorPalettes: [...colorPalettes, newColorPalette] });

      return newColorPalette;
    },

    updateColorPalette: async (
      payload: UpdateColorPalettePayload,
      { getState, setState },
    ): Promise<ColorPalette | null> => {
      const { id, updates } = unwrap(payload);
      const colorPalettes = normalizeColorPalettes(getState().colorPalettes);

      const paletteIndex = colorPalettes.findIndex((palette) => palette.id === id);
      if (paletteIndex === -1) return null;

      const updatedPalette = { ...colorPalettes[paletteIndex], ...updates, id };
      setState({
        colorPalettes: colorPalettes.map((palette, index) => (index === paletteIndex ? updatedPalette : palette)),
      });

      return updatedPalette;
    },

    deleteColorPalette: async (
      payload: DeleteColorPalettePayload,
      { getState, setState },
    ): Promise<{ success: boolean }> => {
      const id = unwrap(payload);
      const colorPalettes = normalizeColorPalettes(getState().colorPalettes);

      // Default colors can't be removed
      const updatedColorPalettes = colorPalettes.filter((palette) => palette.id !== id || palette.isDefault);

      setState({ colorPalettes: updatedColorPalettes });

      return { success: updatedColorPalettes.length !== colorPalettes.length };
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
  importNotes,
  updateNotesSearchQuery,
  // Groups
  createNoteGroup,
  updateNoteGroup,
  deleteNoteGroup,
  setSelectedNote,
  // Color Palettes
  getColorPalettes,
  setColorPalettes,
  createColorPalette,
  updateColorPalette,
  deleteColorPalette,
} = notesActionsSlice;
