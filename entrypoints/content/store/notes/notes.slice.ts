import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NoteFormData, Note } from "@entrypoints/shared/types/notes";

export interface NotesState {
  isFormOpen: boolean;
  editingNote?: Note | null;
  initialFormData?: Partial<NoteFormData>;
}

const initialState: NotesState = {
  isFormOpen: false,
  editingNote: null,
  initialFormData: undefined,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    openNoteForm: (state, action: PayloadAction<{ editingNote?: Note | null; initialData?: Partial<NoteFormData> }>) => {
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
  },
});

export const { openNoteForm, closeNoteForm, setEditingNote } = notesSlice.actions;
export default notesSlice.reducer;