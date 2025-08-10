import * as React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "antd";
import { ModalProps } from "antd/lib/modal";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import debounce from "lodash-es/debounce";
import { Rnd } from "react-rnd";
import { createPortal } from "react-dom";

import { ModalID, ModalState } from "./draggableModalReducer";
import "./index.css";

import { dragModal, focusModal, mount, resizeModal, unmount } from "./store/draggableModalSlice";
import { EDGE_PADDING, MIN_HEIGHT, MIN_WIDTH } from "./constant";

const ModalTitle = styled.div`
  padding: 16px;
  width: 100%;
  user-select: none;
`;

const modalStyle: React.CSSProperties = { margin: 0, paddingBottom: 0, pointerEvents: "auto" };

// Modal style constants
const modalBoxShadow = `
  0 3px 6px -4px rgba(0, 0, 0, 0.12),
  0 6px 16px 0 rgba(0, 0, 0, 0.08),
  0 9px 28px 8px rgba(0, 0, 0, 0.05)
`;

interface ContextProps {
  id: ModalID;
  modalState: ModalState;
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  onModalStateChange: (state: { x: number; y: number; width: number; height: number }) => void;
}

export type DraggableModalInnerProps = ModalProps & { children?: React.ReactNode } & ContextProps;

function DraggableModalInnerNonMemo({
  id,
  modalState,
  open,
  children,
  title,
  initialWidth,
  initialHeight,
  initialX,
  initialY,
  footer,
  onModalStateChange,
  ...otherProps
}: DraggableModalInnerProps) {
  const dispatch = useDispatch();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Call on mount and unmount.
  useEffect(() => {

    // Calculate default position to center the modal if not provided
    const defaultWidth = initialWidth || 800;
    const defaultHeight = initialHeight || 600;
    const defaultX = initialX !== undefined ? initialX : Math.max(0, (window.innerWidth - defaultWidth) / 2);
    const defaultY = initialY !== undefined ? initialY : Math.max(0, (window.innerHeight - defaultHeight) / 2);

    dispatch(
      mount({
        id,
        initialState: {
          width: defaultWidth,
          height: defaultHeight,
          x: defaultX,
          y: defaultY,
        },
      }),
    );

    return () => {
      dispatch(unmount(id));
    };
  }, [dispatch, id, initialWidth, initialHeight, initialX, initialY]);

  // Create portal container in shadow DOM
  useEffect(() => {
    // Find the shadow root
    const shadowRoot = document.querySelector("hover-inspector")?.shadowRoot as ShadowRoot | null;

    if (shadowRoot) {
      // Find or create a container for modals
      let container = shadowRoot.querySelector("#modal-container") as HTMLElement | null;

      if (!container) {
        // Create the container if it doesn't exist
        container = document.createElement("div");
        container.id = "modal-container";
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.pointerEvents = "none";
        container.style.zIndex = "1000";

        // Append to the body in shadow DOM
        const body = shadowRoot.querySelector("html > body");
        if (body) {
          body.appendChild(container);
        }
      }

      // Create or find a specific container for this modal
      const modalId = `modal-${id}`;
      let modalContainer = container.querySelector(`#${modalId}`) as HTMLElement | null;

      if (!modalContainer) {
        modalContainer = document.createElement("div");
        modalContainer.id = modalId;
        modalContainer.style.position = "absolute";
        modalContainer.style.pointerEvents = "auto";
        container.appendChild(modalContainer);
      }

      setPortalContainer(modalContainer);

      return () => {
        if (container && modalContainer && container.contains(modalContainer)) {
          container.removeChild(modalContainer);
        }
      };
    }

    return () => {};
  }, [id]);

  const throttledDispatch = useMemo(() => debounce(dispatch, 10000), [dispatch]);

  // Cache modalState properties in a ref
  const modalStateRef = useRef({
    zIndex: modalState.zIndex,
    x: modalState.x,
    y: modalState.y,
    width: modalState.width,
    height: modalState.height,
  });

  // Update ref when modalState changes
  useEffect(() => {
    // Check if any values have changed before updating ref
    if (
      modalStateRef.current.zIndex !== modalState.zIndex ||
      modalStateRef.current.x !== modalState.x ||
      modalStateRef.current.y !== modalState.y ||
      modalStateRef.current.width !== modalState.width ||
      modalStateRef.current.height !== modalState.height
    ) {
      // Update ref if values have changed
      modalStateRef.current = {
        zIndex: modalState.zIndex,
        x: modalState.x,
        y: modalState.y,
        width: modalState.width,
        height: modalState.height,
      };
    }
  }, [modalState]);

  const onFocus = useCallback(() => dispatch(focusModal(id)), [id, dispatch]);

  // Handle focus when clicking on the modal
  const handleModalClick = useCallback(() => {
    dispatch(focusModal(id));
  }, [dispatch, id]);

  const handleResizeStop = useCallback(
    (e, direction, ref, delta, position) => {
      const newSize = {
        id,
        x: modalStateRef.current.x,
        y: modalStateRef.current.y,
        width: parseInt(ref.style.width, 10),
        height: parseInt(ref.style.height, 10),
      };
      throttledDispatch(resizeModal(newSize));
    },
    [id, throttledDispatch],
  );

  useEffect(() => {
    // update localstorage modal state every 5 seconds
    const debounce = setTimeout(() => {
      onModalStateChange({
        x: modalStateRef.current.x,
        y: modalStateRef.current.y,
        width: modalStateRef.current.width,
        height: modalStateRef.current.height,
      });
    }, 5000);

    return () => clearTimeout(debounce);
  }, [modalState, onModalStateChange]);

  const titleElement = useMemo(() => <ModalTitle>{title}</ModalTitle>, [title]);

  // If portal container is not ready, don't render anything
  if (!portalContainer) return null;

  // Create a single component with Rnd wrapping the Modal
  const modalComponent = (
    <Rnd
      style={{
        display: open ? "block" : "none",
        position: "fixed",
        boxShadow: modalBoxShadow,
        borderRadius: "2px",
        backgroundColor: "#fff",
        overflow: "hidden",
        zIndex: modalStateRef.current.zIndex,
      }}
      size={{
        width: modalStateRef.current.width,
        height: modalStateRef.current.height,
      }}
      position={{
        x: modalStateRef.current.x,
        y: modalStateRef.current.y,
      }}
      onResizeStop={handleResizeStop}
      dragHandleClassName="modal-drag-handle"
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      className="draggable-modal-container"
      onClick={onFocus}
      onDragStop={(e, d) => {
        throttledDispatch(dragModal({ id, x: d.x, y: d.y }));
      }}
      bounds={{
        left: EDGE_PADDING,
        top: EDGE_PADDING,
        right: window.innerWidth - EDGE_PADDING,
        bottom: window.innerHeight - EDGE_PADDING,
      }}
    >
      {/* Ant Design Modal */}
      <Modal
        wrapClassName="draggable-modal"
        keyboard={false}
        open={true}
        style={{
          ...modalStyle,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          margin: 0,
        }}
        width="100%"
        destroyOnHidden={true}
        mask={false}
        maskClosable={false}
        title={<div className="modal-drag-handle">{titleElement}</div>}
        {...otherProps}
        footer={footer || null}
        getContainer={() => portalContainer}
      >
        <div>{children}</div>
      </Modal>
    </Rnd>
  );

  // Render the component into the portal container
  return createPortal(modalComponent, portalContainer);
}

export const DraggableModalInner = memo(DraggableModalInnerNonMemo);

if (process.env.NODE_ENV !== "production") {
  DraggableModalInner.displayName = "DraggableModalInner";
}
