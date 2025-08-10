import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { XPathVariants } from "../../modules/PopupContainer/CSSSnapshotInspector/types";

export interface ElementDetailsState {
  isOpen: boolean;
  title?: string;
  path?: string;
  xpath?: string;
  /** Available XPath variants for this element */
  xpathVariants?: XPathVariants;
  /** Currently selected XPath key from variants */
  selectedXPathKey?: keyof XPathVariants;
  tagName?: string;
  id?: string | null;
  classes?: string[];
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
  inlineStyles?: Record<string, string>;
  bounds?: { top: number; left: number; width: number; height: number };
  /** Optional: when present, display A/B diff in the details popup */
  compareLeftTitle?: string;
  compareRightTitle?: string;
  /** Structured compare payload for inline diff UI */
  compareLeftData?: any;
  compareRightData?: any;
  /** Pre-computed compare configuration to avoid runtime calculations */
  compareConfig?: {
    leftNode: any;
    rightNode: any;
    showIdentity: boolean;
    showBounds: boolean;
    changedAttrs: string[];
    changedStyles: string[];
  };
  /** Simple element diff data for simplified comparison */
  styleDiffData?: {
    leftData: Record<string, any>;
    rightData: Record<string, any>;
    changedOnly?: boolean;
  };
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
