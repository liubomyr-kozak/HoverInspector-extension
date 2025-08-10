import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ElementDetailsState {
  isOpen: boolean;
  title?: string;
  path?: string;
  xpath?: string;
  tagName?: string;
  id?: string | null;
  classes?: string[];
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
  inlineStyles?: Record<string, string>;
  bounds?: { top: number; left: number; width: number; height: number };
}

const initialState: ElementDetailsState = {
  isOpen: false,
};

const elementDetailsSlice = createSlice({
  name: "elementDetails",
  initialState,
  reducers: {
    openElementDetails: (state, action: PayloadAction<Partial<ElementDetailsState>>) => {
      state.isOpen = true;
      Object.assign(state, action.payload);
    },
    closeElementDetails: (state) => {
      state.isOpen = false;
      // Keep last data for potential reopen or clear here if needed
    },
    setElementDetailsData: (state, action: PayloadAction<Partial<ElementDetailsState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { openElementDetails, closeElementDetails, setElementDetailsData } = elementDetailsSlice.actions;
export default elementDetailsSlice.reducer;
