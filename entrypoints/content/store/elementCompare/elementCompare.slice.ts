import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ElementCompareState {
  isOpen: boolean;
  title?: string;
  leftTitle?: string; // Snapshot A
  rightTitle?: string; // Snapshot B
  leftText?: string; // formatted element details for A
  rightText?: string; // formatted element details for B
}

const initialState: ElementCompareState = {
  isOpen: false,
};

const elementCompareSlice = createSlice({
  name: "elementCompare",
  initialState,
  reducers: {
    openElementCompare: (state, action: PayloadAction<Partial<ElementCompareState>>) => {
      state.isOpen = true;
      Object.assign(state, action.payload);
    },
    closeElementCompare: (state) => {
      state.isOpen = false;
    },
    setElementCompareData: (state, action: PayloadAction<Partial<ElementCompareState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { openElementCompare, closeElementCompare, setElementCompareData } = elementCompareSlice.actions;
export default elementCompareSlice.reducer;
