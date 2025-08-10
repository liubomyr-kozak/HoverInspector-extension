import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CSSSnapshot } from '../../modules/PopupContainer/CSSSnapshotInspector/types';

interface SnapshotState {
  snapshots: CSSSnapshot[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SnapshotState = {
  snapshots: [],
  isLoading: false,
  error: null,
};

const snapshotSlice = createSlice({
  name: 'snapshot',
  initialState,
  reducers: {
    setSnapshots: (state, action: PayloadAction<CSSSnapshot[]>) => {
      state.snapshots = action.payload;
      state.error = null;
    },
    addSnapshot: (state, action: PayloadAction<CSSSnapshot>) => {
      const exists = state.snapshots.some(snapshot => snapshot.id === action.payload.id);
      if (!exists) {
        state.snapshots.push(action.payload);
        state.error = null;
      }
    },
    removeSnapshot: (state, action: PayloadAction<string>) => {
      state.snapshots = state.snapshots.filter(snapshot => snapshot.id !== action.payload);
      state.error = null;
    },
    updateSnapshot: (state, action: PayloadAction<CSSSnapshot>) => {
      const index = state.snapshots.findIndex(snapshot => snapshot.id === action.payload.id);
      if (index !== -1) {
        state.snapshots[index] = action.payload;
        state.error = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSnapshots: (state) => {
      state.snapshots = [];
      state.error = null;
    },
  },
});

export const {
  setSnapshots,
  addSnapshot,
  removeSnapshot,
  updateSnapshot,
  setLoading,
  setError,
  clearSnapshots,
} = snapshotSlice.actions;

// Selectors
export const selectSnapshots = (state: { snapshot: SnapshotState }) => state.snapshot.snapshots;
export const selectSnapshotById = (state: { snapshot: SnapshotState }, id: string) => 
  state.snapshot.snapshots.find(snapshot => snapshot.id === id);
export const selectSnapshotLoading = (state: { snapshot: SnapshotState }) => state.snapshot.isLoading;
export const selectSnapshotError = (state: { snapshot: SnapshotState }) => state.snapshot.error;

export default snapshotSlice.reducer;