import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Note } from "@entrypoints/shared/types/notes";

export interface NotesState {
  isFormOpen: boolean;
  editingNote?: Note | null;
  initialFormData?: Partial<Note>;
  refreshTrigger: number; // Timestamp to trigger data refresh
}

const initialState: NotesState = {
  isFormOpen: false,
  editingNote: null,
  initialFormData: undefined,
  refreshTrigger: 0,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    openNoteForm: (state, action: PayloadAction<{ editingNote?: Note | null; initialData?: Partial<Note> }>) => {
      state.isFormOpen = true;
      state.editingNote = action.payload.editingNote || null;
      state.initialFormData = action.payload.initialData;
    },
    closeNoteForm: (state) => {
      state.isFormOpen = false;
      state.editingNote = null;
      state.initialFormData = undefined;
    },
    setEditingNote: (state, action: PayloadAction<Note | null>) => {
      state.editingNote = action.payload;
    },
    triggerRefresh: (state) => {
      state.refreshTrigger = Date.now();
    },
  },
});

export const { openNoteForm, closeNoteForm, setEditingNote, triggerRefresh } = notesSlice.actions;
export default notesSlice.reducer;