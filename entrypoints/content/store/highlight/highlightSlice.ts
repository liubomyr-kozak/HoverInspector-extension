import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HighlightState {
  hoverMode: boolean;
  xpath: string | null;
}

const initialState: HighlightState = {
  hoverMode: false,
  xpath: null
};

const highlightSlice = createSlice({
  name: "highlight",
  initialState,
  reducers: {
    startHoverMode: (state) => { 
      state.hoverMode = true; 
      state.xpath = null; 
    },
    stopHoverMode: (state) => { 
      state.hoverMode = false; 
    },
    setXPath: (state, action: PayloadAction<string>) => { 
      state.xpath = action.payload; 
      state.hoverMode = false; 
    },
    clearHighlight: (state) => { 
      state.xpath = null; 
      state.hoverMode = false; 
    }
  }
});

export const { startHoverMode, stopHoverMode, setXPath, clearHighlight } = highlightSlice.actions;
export default highlightSlice.reducer;
