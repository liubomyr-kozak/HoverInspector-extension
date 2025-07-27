import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getWindowSize } from "./getWindowSize";
import { clamp } from "./clamp";
import { EDGE_PADDING, MIN_HEIGHT, MIN_WIDTH } from "@entrypoints/shared/components/ModalDraggable/constant.ts";
import { ZINDEX_MODAL } from "@entrypoints/shared/constant/zIndex.ts";

// Ініціалізація стану
const initialState = {
  maxZIndex: ZINDEX_MODAL,
  windowSize: getWindowSize(),
  modals: {},
};

// Типи даних
export type ModalID = string;

export interface ModalState {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  open: boolean;
}

export interface ModalsState {
  maxZIndex: number;
  windowSize: {
    width: number;
    height: number;
  };
  modals: {
    [key: string]: ModalState;
  };
}

// Утиліти
const getNextZIndex = (state: ModalsState, id: string): number =>
  state.modals[id]?.zIndex === state.maxZIndex ? state.maxZIndex : state.maxZIndex + 1;

const clampDrag = (
  windowWidth: number,
  windowHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } => {
  const maxX = windowWidth - width - EDGE_PADDING;
  const maxY = windowHeight - height - EDGE_PADDING;
  return { x: clamp(EDGE_PADDING, maxX, x), y: clamp(EDGE_PADDING, maxY, y) };
};

const clampResize = (
  windowWidth: number,
  windowHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
): { width: number; height: number } => {
  // Calculate maximum dimensions based on window size and modal position
  const maxWidth = windowWidth - x - EDGE_PADDING;
  const maxHeight = windowHeight - y - EDGE_PADDING;

  // Ensure width and height are within bounds (min/max)
  // Use MIN_WIDTH and MIN_HEIGHT from constants instead of hardcoded values
  return {
    width: clamp(MIN_WIDTH, maxWidth, width),
    height: clamp(MIN_HEIGHT, maxHeight, height),
  };
};

// Redux slice
const draggableModalSlice = createSlice({
  name: "draggableModal",
  initialState,
  reducers: {
    windowResizeForModal: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.windowSize = action.payload;
      Object.values(state.modals).forEach((modalState: any) => {
        if (modalState.open) {
          const position = clampDrag(
            state.windowSize.width,
            state.windowSize.height,
            modalState.x,
            modalState.y,
            modalState.width,
            modalState.height,
          );
          const size = clampResize(
            state.windowSize.width,
            state.windowSize.height,
            position.x,
            position.y,
            modalState.width,
            modalState.height,
          );
          Object.assign(modalState, position, size);
        }
      });
    },
    resizeModal: (
      state,
      action: PayloadAction<{
        id: ModalID;
        x: number;
        y: number;
        width: number;
        height: number;
      }>,
    ) => {
      const { id, x, y, width, height } = action.payload;
      const size = clampResize(state.windowSize.width, state.windowSize.height, x, y, width, height);
      const modalState = state.modals[id];

      // Check if modalState exists before trying to update its properties
      if (!modalState) {
        console.warn(`Modal with id ${id} not found in state.modals`);
        return;
      }

      const position = clampDrag(state.windowSize.width, state.windowSize.height, x, y, size.width, size.height);

      modalState.width = size.width;
      modalState.height = size.height;
      modalState.x = position.x;
      modalState.y = position.y;
      // Don't update zIndex on resize
      // modalState.zIndex = getNextZIndex(state, id);
    },
    dragModal: (state, action: PayloadAction<{ id: ModalID; x: number; y: number }>) => {
      const { id, x, y } = action.payload;
      const modalState = state.modals[id];

      // Check if modalState exists before trying to access its properties
      if (!modalState) {
        console.warn(`Modal with id ${id} not found in state.modals`);
        return;
      }

      const position = clampDrag(
        state.windowSize.width,
        state.windowSize.height,
        x,
        y,
        modalState.width,
        modalState.height,
      );
      modalState.x = position.x;
      modalState.y = position.y;
      // Don't update zIndex on drag
      // modalState.zIndex = getNextZIndex(state, id);
    },
    show: (state, action: PayloadAction<ModalID>) => {
      const id = action.payload;
      const modalState = state.modals[id];

      // Check if modalState exists before trying to access its properties
      if (!modalState) {
        console.warn(`Modal with id ${id} not found in state.modals`);
        return;
      }

      const centerX = state.windowSize.width / 2 - modalState.width / 2;
      const centerY = state.windowSize.height / 2 - modalState.height / 2;
      const position = clampDrag(
        state.windowSize.width,
        state.windowSize.height,
        centerX,
        centerY,
        modalState.width,
        modalState.height,
      );
      const size = clampResize(
        state.windowSize.width,
        state.windowSize.height,
        position.x,
        position.y,
        modalState.width,
        modalState.height,
      );
      state.maxZIndex += 1;
      Object.assign(state.modals[id], modalState, position, size, { zIndex: state.maxZIndex, open: true });
    },
    focusModal: (state, action: PayloadAction<ModalID>) => {
      const id = action.payload;

      // Check if modal exists before trying to update it
      if (!state.modals[id]) {
        console.warn(`Modal with id ${id} not found in state.modals`);
        return;
      }

      state.modals[id] = {
        ...state.modals[id],
        zIndex: state.maxZIndex + 1,
      };
      state.maxZIndex += 1;
    },
    hide: (state, action: PayloadAction<ModalID>) => {
      const id = action.payload;
      const modalState = state.modals[id];

      // Check if modalState exists before trying to update its properties
      if (!modalState) {
        console.warn(`Modal with id ${id} not found in state.modals`);
        return;
      }

      modalState.open = false;
    },
    mount: (
      state,
      action: PayloadAction<{
        id: ModalID;
        initialState: { width: number; height: number; x: number; y: number };
      }>,
    ) => {
      const { id, initialState } = action.payload;

      const windowSize = getWindowSize();
      const windowWidth = windowSize.width;
      const windowHeight = windowSize.height;
      const width = initialState.width;
      const height = initialState.height;

      const maxX = windowWidth - width - EDGE_PADDING;
      const maxY = windowHeight - height - EDGE_PADDING;

      let x = typeof initialState.x === "number" ? initialState.x : windowWidth - width;
      let y = typeof initialState.y === "number" ? initialState.y : 0;

      x = clamp(EDGE_PADDING, maxX, x);
      y = clamp(EDGE_PADDING, maxY, y);

      const modalState = {
        ...initialState,
        x,
        y,
        zIndex: state.maxZIndex + 1,
        open: false,
      };

      state.maxZIndex += 1;
      state.modals[id] = modalState;
    },
    unmount: (state, action: PayloadAction<ModalID>) => {
      delete state.modals[action.payload];
    },
  },
});

export const { windowResizeForModal, resizeModal, dragModal, show, hide, mount, unmount, focusModal } =
  draggableModalSlice.actions;

export default draggableModalSlice.reducer;
