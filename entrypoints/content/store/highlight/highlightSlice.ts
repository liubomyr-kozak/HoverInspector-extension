import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface HighlightStyle {
  border: string;
  backgroundColor: string;
  animation?: string;
}

export interface HighlightState {
  hoverMode: boolean;
  xpath: string | null;
  autoHideEnabled: boolean;
  autoHideDelay: number; // in milliseconds
  autoHideTimer: NodeJS.Timeout | null;
  displayStyle: "solid" | "blinking" | "pulse";
  customStyles: Record<string, HighlightStyle>;
}

const defaultStyles: Record<string, HighlightStyle> = {
  solid: {
    border: "2px solid red",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  blinking: {
    border: "2px solid red",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    animation: "highlight-blink 1s infinite",
  },
  pulse: {
    border: "2px solid red",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    animation: "highlight-pulse 2s infinite",
  },
};

const initialState: HighlightState = {
  hoverMode: false,
  xpath: null,
  autoHideEnabled: true,
  autoHideDelay: 2000, // 3 seconds default
  autoHideTimer: null,
  displayStyle: "blinking",
  customStyles: defaultStyles,
};

const highlightSlice = createSlice({
  name: "highlight",
  initialState,
  reducers: {
    startHoverMode: (state) => {
      state.hoverMode = true;
      state.xpath = null;
      // Clear any existing auto-hide timer when entering hover mode
      if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
      }
    },
    stopHoverMode: (state) => {
      state.hoverMode = false;
    },
    setXPath: (state, action: PayloadAction<string>) => {
      state.xpath = action.payload;
      state.hoverMode = false;
      // Clear any existing timer
      if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
      }
    },
    clearHighlight: (state) => {
      state.xpath = null;
      state.hoverMode = false;
      // Clear auto-hide timer
      if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
      }
    },
    setAutoHideEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoHideEnabled = action.payload;
      // If disabling auto-hide, clear any existing timer
      if (!action.payload && state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
      }
    },
    setAutoHideDelay: (state, action: PayloadAction<number>) => {
      state.autoHideDelay = action.payload;
    },
    setAutoHideTimer: (state, action: PayloadAction<NodeJS.Timeout | null>) => {
      // Clear existing timer before setting new one
      if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
      }
      state.autoHideTimer = action.payload;
    },
    setDisplayStyle: (state, action: PayloadAction<"solid" | "blinking" | "pulse">) => {
      state.displayStyle = action.payload;
    },
    updateCustomStyle: (state, action: PayloadAction<{ styleName: string; style: HighlightStyle }>) => {
      state.customStyles[action.payload.styleName] = action.payload.style;
    },
  },
});

export const {
  startHoverMode,
  stopHoverMode,
  setXPath,
  clearHighlight,
  setAutoHideEnabled,
  setAutoHideDelay,
  setAutoHideTimer,
  setDisplayStyle,
  updateCustomStyle,
} = highlightSlice.actions;

export default highlightSlice.reducer;
