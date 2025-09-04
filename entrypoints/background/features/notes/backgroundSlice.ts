import { chromeActionsSlice } from "@entrypoints/core/libs/chromeActionsSlice.ts";
import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";

export const notesActionsSlice = chromeActionsSlice({
  // NoteForm Panel Position Actions
  getNoteFormPanelPosition: async () => {
    return await AppStorageService.getNoteFormPanelPosition();
  },

  saveNoteFormPanelPosition: async ({ data }) => {
    return await AppStorageService.saveNoteFormPanelPosition(data);
  },

  // Notes Management Actions
  getAllNotes: async () => {
    return await AppStorageService.getNotesData();
  },

  createNote: async ({ data }) => {
    debugger;

    const notes = await AppStorageService.getNotesData();

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
    await AppStorageService.setNotesData(notes);
    return newNote;
  },

  updateNote: async ({ data: { id, updates } }) => {
    const notes = await AppStorageService.getNotesData();

    const noteIndex = notes.notes.findIndex((note) => note.id === id);
    if (noteIndex !== -1) {
      notes.notes[noteIndex] = {
        ...notes.notes[noteIndex],
        ...updates,
        updatedAt: Date.now(),
      };
      await AppStorageService.setNotesData(notes);
      return notes.notes[noteIndex];
    }
    return null;
  },

  deleteNote: async ({ data: id }) => {
    const notes = await AppStorageService.getNotesData();

    notes.notes = notes.notes.filter((note) => note.id !== id);
    await AppStorageService.setNotesData(notes);
    return { success: true };
  },

  updateNotesSearchQuery: async ({ data: searchQuery }) => {
    const notes = await AppStorageService.getNotesData();

    notes.searchQuery = searchQuery;
    await AppStorageService.setNotesData(notes);
  },

  toggleNotesShowOnlyCurrentDomain: async ({ data: showOnlyCurrentDomain }) => {
    const notes = await AppStorageService.getNotesData();

    notes.showOnlyCurrentDomain = showOnlyCurrentDomain;
    await AppStorageService.setNotesData(notes);
  },

  createNoteGroup: async ({ data }) => {
    const notes = await AppStorageService.getNotesData();

    const newGroup = {
      ...data,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true,
    };

    notes.groups.push(newGroup);
    await AppStorageService.setNotesData(notes);
    return newGroup;
  },

  updateNoteGroup: async ({ data: { id, updates } }) => {
    const notes = await AppStorageService.getNotesData();

    const groupIndex = notes.groups.findIndex((group) => group.id === id);
    if (groupIndex !== -1) {
      notes.groups[groupIndex] = {
        ...notes.groups[groupIndex],
        ...updates,
        updatedAt: Date.now(),
      };
      await AppStorageService.setNotesData(notes);
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
});

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
  createNoteGroup,
  updateNoteGroup,
  deleteNoteGroup,
  setSelectedNote,
  // Color Palette Management Actions
  getColorPalettes,
  setColorPalettes,
  createColorPalette,
  updateColorPalette,
  deleteColorPalette,
} = notesActionsSlice;