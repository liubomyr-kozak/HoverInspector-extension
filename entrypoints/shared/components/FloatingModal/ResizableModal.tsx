import { useRef, useState } from "react";
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
}

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
}: ResizableModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  // rAF throttling refs
  const dragFrame = useRef<number | null>(null);
  const resizeFrame = useRef<number | null>(null);

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

  // Close functionality removed since minimize feature is deprecated
  const handleCloseClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onClose?.();
  };

  if (!isOpen) return null;

  // Validate the initial position before using it
  // const validatedPosition = getValidatedPosition(initialPosition, initialSize);

  if (viewSourceType === "note") {
    console.log("🌟🌟🌟 ResizableModal::ResizableModal -> initialPosition", initialPosition);
  }

  return (
    <ModalOverlay>
      <Rnd
        default={{
          x: initialPosition.x,
          y: initialPosition.y,
          width: initialSize.width,
          height: initialSize.height,
        }}
        style={{ position: position, zIndex: ZINDEX_MODAL }}
        minWidth={10}
        minHeight={10}
        maxHeight={800}
        scale={1}
        enableUserSelectHack={false}
        dragHandleClassName="modal-drag-handle"
        onDragStart={() => setIsDragging(true)}
        onDragStop={(e, d) => {
          setIsDragging(false);
          if (dragFrame.current) cancelAnimationFrame(dragFrame.current);

          onPositionChange?.(d.x, d.y);
        }}
        onResizeStart={() => setIsResizing(true)}
        onResize={(e, direction, ref, delta, position) => {
          if (resizeFrame.current) cancelAnimationFrame(resizeFrame.current);

          const width = parseInt(ref.style.width);
          const height = parseInt(ref.style.height);

          resizeFrame.current = requestAnimationFrame(() => {
            onSizeChange?.(width, height);
            // onPositionChange?.(position.x, position.y);
          });
        }}
        positionOffset={{ x: 0, y: 0 }}
        onResizeStop={() => {
          setIsResizing(false);
          if (resizeFrame.current) cancelAnimationFrame(resizeFrame.current);
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
            <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 bg-white bg-card cursor-grab active:cursor-grabbing">
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
