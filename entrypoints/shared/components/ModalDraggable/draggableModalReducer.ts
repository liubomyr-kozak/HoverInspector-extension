// ID for a specific modal.
import {ZINDEX_MODAL} from "@entrypoints/shared/constant/zIndex.ts";

export type ModalID = string

// State for a specific modal.
export interface ModalState {
    x: number
    y: number
    width: number
    height: number
    zIndex: number
    open: boolean
}


// State of all modals.
export interface ModalsState {
    maxZIndex: number
    windowSize: {
        width: number
        height: number
    }
    modals: {
        [key: string]: ModalState
    }
}

export const initialModalState: ModalState = {
    x: 0, y: 0, width: 800, height: 400, zIndex: ZINDEX_MODAL, open: false,
}

const getInitialModalState = ({
                                  initialWidth = initialModalState.width, initialHeight = initialModalState.height, x = initialModalState.x, y = initialModalState.y,
                              }: {
    initialWidth?: number
    initialHeight?: number
    x?: number
    y?: number
}) => {
    return {
        ...initialModalState, width: initialWidth, height: initialHeight, x: x, y: y,
    }
}

export const getModalState = ({
                                  state, id, initialWidth, initialHeight, x, y,
                              }: {
    state: ModalsState
    id: ModalID
    initialWidth?: number
    initialHeight?: number
    x?: number
    y?: number
}): ModalState => state.modals[id] || getInitialModalState({initialWidth, initialHeight, x, y})

