import { FunctionComponent, ReactElement, useMemo } from "react";
import { useUID } from "react-uid";
import { useDispatch, useSelector } from "react-redux";
import { ModalProps } from "antd/lib/modal";

import { DraggableModalInner } from "./DraggableModalInner";
import { getModalState } from "./draggableModalReducer";

export interface DraggableModalProps extends ModalProps {
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  footer?: any;
  onModalStateChange: (state: { x: number; y: number; width: number; height: number }) => void;
}

export const DraggableModal: FunctionComponent<DraggableModalProps> = (props: DraggableModalProps): ReactElement => {
  const state = useSelector((state: any) => state.draggableModal);

  // Get the unique ID of this modal.
  const id = useUID();

  // Memoize modalState to prevent unnecessary recalculations
  const modalState = useMemo(() => {
    console.log("🚀🚀🚀 :: -> modalState", state);

    return getModalState({
      state,
      id,
      initialHeight: props.initialHeight,
      initialWidth: props.initialWidth,
      x: props.initialX,
      y: props.initialY,
    });
  }, [state, id, props.initialHeight, props.initialWidth, props.initialX, props.initialY]);

  // We do this so that we don't re-render all modals for every state change.
  // DraggableModalInner uses React.memo, so it only re-renders if
  // if props change (e.g. modalState).
  return <DraggableModalInner id={id} modalState={modalState} {...props} />;
};
