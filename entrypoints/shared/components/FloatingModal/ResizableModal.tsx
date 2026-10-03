import { useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "../ReactRnd";
import { TbGripVertical } from "react-icons/tb";
import { IoCloseSharp } from "react-icons/io5";
import * as React from "react";
import { ZINDEX_MODAL } from "@entrypoints/shared/constant/zIndex.ts";
import { RESIZE_HANDLE_STYLES } from "@entrypoints/shared/components/FloatingModal/FloatingModal.constant";
import { ModalOverlay } from "./FloatingModal.styled";

interface ResizableModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  position: "fixed" | "absolute";
  viewSourceType?: string;
  minWidth?: number;
  minHeight?: number;
}

// Keep at least this much of the header on screen so the panel can always be dragged back
const VISIBLE_HEADER = 48;

export function ResizableModal({
  isOpen,
  title = <></>,
  children,
  footer,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  onPositionChange,
  onSizeChange,
  onClose,
  position,
  viewSourceType,
  minWidth = 40,
  minHeight = 24,
}: ResizableModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const rndRef = useRef<Rnd | null>(null);
  const currentPosition = useRef(initialPosition);
  const currentSize = useRef(initialSize);

  // Validate and constrain initial position within viewport bounds
  const getValidatedPosition = (pos: { x: number; y: number }, size: { width: number; height: number }) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let validatedX = pos.x;
    let validatedY = pos.y;

    // Ensure position is not negative
    validatedX = Math.max(0, validatedX);
    validatedY = Math.max(0, validatedY);

    // Ensure modal doesn't go out of right boundary
    if (validatedX + size.width > windowWidth) {
      validatedX = Math.max(0, windowWidth - size.width);
    }

    // Ensure modal doesn't go out of bottom boundary
    if (validatedY + size.height > windowHeight) {
      validatedY = Math.max(0, windowHeight - size.height);
    }

    return { x: validatedX, y: validatedY };
  };

  // Pull the panel back into the window when it was saved off-screen or the window got smaller
  const clampIntoView = () => {
    // The drag grip sits at the left of the header, so the left edge stays on screen; at the right
    // and bottom it is enough that part of the header can still be grabbed
    const { x, y } = currentPosition.current;
    const clamped = {
      x: Math.min(Math.max(x, 0), window.innerWidth - VISIBLE_HEADER * 3),
      y: Math.min(Math.max(y, 0), window.innerHeight - VISIBLE_HEADER),
    };

    if (clamped.x !== x || clamped.y !== y) {
      currentPosition.current = clamped;
      rndRef.current?.updatePosition(clamped);
      onPositionChange?.(clamped.x, clamped.y);
    }
  };

  // The saved size can be larger than this window (or tiny from an older version)
  const startSize = useMemo(
    () => ({
      width: Math.max(minWidth, Math.min(initialSize.width, window.innerWidth)),
      height: Math.max(minHeight, Math.min(initialSize.height, window.innerHeight)),
    }),
    [isOpen],
  );

  useEffect(() => {
    if (!isOpen) return;

    currentPosition.current = initialPosition;
    currentSize.current = startSize;
    if (startSize.width !== initialSize.width || startSize.height !== initialSize.height) {
      onSizeChange?.(startSize.width, startSize.height);
    }
    clampIntoView();

    window.addEventListener("resize", clampIntoView);
    return () => window.removeEventListener("resize", clampIntoView);
  }, [isOpen]);

  // Close functionality removed since minimize feature is deprecated
  const handleCloseClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onClose?.();
  };

  if (!isOpen) return null;

  // Validate the initial position before using it
  // const validatedPosition = getValidatedPosition(initialPosition, initialSize);

  return (
    <ModalOverlay>
      <Rnd
        ref={rndRef}
        default={{
          x: initialPosition.x,
          y: initialPosition.y,
          width: startSize.width,
          height: startSize.height,
        }}
        style={{ position: position, zIndex: ZINDEX_MODAL }}
        minWidth={minWidth}
        minHeight={minHeight}
        maxHeight={window.innerHeight}
        maxWidth={window.innerWidth}
        scale={1}
        // Without this, dragging by the title selects its text and the next drag starts a native
        // text drag-and-drop instead of moving the panel
        enableUserSelectHack={true}
        dragHandleClassName="modal-drag-handle"
        onDragStart={() => setIsDragging(true)}
        onDragStop={(e, d) => {
          setIsDragging(false);
          currentPosition.current = { x: d.x, y: d.y };
          onPositionChange?.(d.x, d.y);
          // After react-draggable has finished its own stop handling
          setTimeout(clampIntoView, 0);
        }}
        onResizeStart={() => setIsResizing(true)}
        positionOffset={{ x: 0, y: 0 }}
        onResizeStop={(e, direction, ref, delta, resizePosition) => {
          setIsResizing(false);

          // Saved once per gesture; resizing from the top/left edge also moves the panel
          currentSize.current = { width: ref.offsetWidth, height: ref.offsetHeight };
          onSizeChange?.(ref.offsetWidth, ref.offsetHeight);
          if (resizePosition && (resizePosition.x !== currentPosition.current.x || resizePosition.y !== currentPosition.current.y)) {
            currentPosition.current = { x: resizePosition.x, y: resizePosition.y };
            onPositionChange?.(resizePosition.x, resizePosition.y);
          }
        }}
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
        resizeHandleClasses={{
          top: "resize-handle resize-handle-top",
          right: "resize-handle resize-handle-right",
          bottom: "resize-handle resize-handle-bottom",
          left: "resize-handle resize-handle-left",
          topRight: "resize-handle resize-handle-corner resize-handle-top-right",
          bottomRight: "resize-handle resize-handle-corner resize-handle-bottom-right",
          bottomLeft: "resize-handle resize-handle-corner resize-handle-bottom-left",
          topLeft: "resize-handle resize-handle-corner resize-handle-top-left",
        }}
        resizeHandleStyles={RESIZE_HANDLE_STYLES}
        className={`pointer-events-auto bg-white bg-card border border-gray-200 rounded-lg shadow-xl overflow-hidden ${
          isDragging ? "cursor-grabbing" : ""
        } ${isResizing ? "resizing" : ""} rnd-container`}
      >
        <div className={"flex flex-col h-full"}>
          {/*<div className={"flex flex-col h-full" + (!title ? " modal-drag-handle" : "")}>*/}
          {/* Header - Drag Handle */}
          {title && (
            <div className="modal-drag-handle select-none flex items-center justify-between p-4 border-b border-gray-200 bg-white bg-card cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 w-full">
                <TbGripVertical className="w-4 h-4 text-muted-foreground" />
                {title}
              </div>
              <button
                onClick={handleCloseClick}
                className="modal-drag-handle-close-button h-8 w-8 p-0 hover:bg-accent z-10 relative"
                style={{ pointerEvents: "auto", cursor: "pointer" }}
              >
                <IoCloseSharp size={"20px"} />
              </button>
            </div>
          )}

          {/* Body */}
          {children}

          {/* Footer */}
          {footer && <div className="border-t border-gray-200 bg-white bg-card">{footer}</div>}
        </div>
      </Rnd>
    </ModalOverlay>
  );
}
