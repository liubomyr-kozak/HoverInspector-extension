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
  // position "absolute": placed in document coordinates and scrolls with the page
  const isPageAnchored = position === "absolute";
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

  // Where the user put the panel and how big they made it. The window can be smaller than that for a
  // while; the panel is then shown smaller/moved but these are kept, so it comes back when the window grows.
  const preferred = useRef({ position: initialPosition, size: initialSize });

  const applyLayout = (position: { x: number; y: number }, size: { width: number; height: number }) => {
    if (size.width !== currentSize.current.width || size.height !== currentSize.current.height) {
      currentSize.current = size;
      rndRef.current?.updateSize(size);
    }
    if (position.x !== currentPosition.current.x || position.y !== currentPosition.current.y) {
      currentPosition.current = position;
      rndRef.current?.updatePosition(position);
    }
  };

  // On open and on window resize: show the whole panel, shrinking it when the window is smaller, so the
  // close button at the right of the header is never off-screen
  const fitToWindow = () => {
    // Page-anchored panels (sticky notes) use document coordinates: a note further down a long page is
    // not "off-screen", so only keep it inside the document's left/top edges and its width
    if (isPageAnchored) {
      const pageWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const size = preferred.current.size;
      applyLayout(
        {
          x: Math.max(0, Math.min(preferred.current.position.x, pageWidth - Math.min(size.width, pageWidth))),
          y: Math.max(0, preferred.current.position.y),
        },
        size,
      );
      return;
    }
    const size = {
      width: Math.max(minWidth, Math.min(preferred.current.size.width, window.innerWidth)),
      height: Math.max(minHeight, Math.min(preferred.current.size.height, window.innerHeight)),
    };
    const position = {
      x: Math.max(0, Math.min(preferred.current.position.x, window.innerWidth - size.width)),
      y: Math.max(0, Math.min(preferred.current.position.y, window.innerHeight - size.height)),
    };
    applyLayout(position, size);
  };

  // After a drag it is enough that part of the header can still be grabbed
  const clampIntoView = () => {
    const { x, y } = currentPosition.current;
    const pageWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const clamped = isPageAnchored
      ? { x: Math.min(Math.max(x, 0), pageWidth - VISIBLE_HEADER), y: Math.max(y, 0) }
      : {
          x: Math.min(Math.max(x, 0), window.innerWidth - VISIBLE_HEADER * 3),
          y: Math.min(Math.max(y, 0), window.innerHeight - VISIBLE_HEADER),
        };

    if (clamped.x !== x || clamped.y !== y) {
      applyLayout(clamped, currentSize.current);
      preferred.current = { ...preferred.current, position: clamped };
      onPositionChange?.(clamped.x, clamped.y);
    }
  };

  // The saved size can be larger than this window (or tiny from an older version)
  const startSize = useMemo(
    () => ({
      width: Math.max(minWidth, Math.min(initialSize.width, window.innerWidth)),
      height: isPageAnchored
        ? Math.max(minHeight, initialSize.height)
        : Math.max(minHeight, Math.min(initialSize.height, window.innerHeight)),
    }),
    [isOpen],
  );

  useEffect(() => {
    if (!isOpen) return;

    currentPosition.current = initialPosition;
    currentSize.current = startSize;
    const size = {
      width: Math.max(minWidth, initialSize.width),
      height: Math.max(minHeight, initialSize.height),
    };
    preferred.current = { position: initialPosition, size };
    // A size saved below the minimum (older versions) is corrected for good
    if (size.width !== initialSize.width || size.height !== initialSize.height) {
      onSizeChange?.(size.width, size.height);
    }
    fitToWindow();

    window.addEventListener("resize", fitToWindow);
    return () => window.removeEventListener("resize", fitToWindow);
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
          preferred.current = { ...preferred.current, position: { x: d.x, y: d.y } };
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
          preferred.current = { position: currentPosition.current, size: currentSize.current };
          onSizeChange?.(ref.offsetWidth, ref.offsetHeight);
          if (resizePosition && (resizePosition.x !== currentPosition.current.x || resizePosition.y !== currentPosition.current.y)) {
            currentPosition.current = { x: resizePosition.x, y: resizePosition.y };
            preferred.current = { ...preferred.current, position: currentPosition.current };
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
        className={`pointer-events-auto bg-white bg-card border border-gray-200 rounded-lg shadow-xl ${
          isDragging ? "cursor-grabbing" : ""
        } ${isResizing ? "resizing" : ""} rnd-container`}
      >
        {/* Clip here, not on the Rnd box: the resize handles reach a few px outside the panel's edge */}
        <div className={"flex flex-col h-full overflow-hidden rounded-lg"}>
          {/*<div className={"flex flex-col h-full" + (!title ? " modal-drag-handle" : "")}>*/}
          {/* Header - Drag Handle */}
          {title && (
            <div className="modal-drag-handle select-none flex items-center justify-between gap-1 px-3 py-3 border-b border-gray-200 bg-white bg-card cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 w-full min-w-0">
                <TbGripVertical className="w-4 h-4 shrink-0 text-muted-foreground" />
                {title}
              </div>
              <button
                onClick={handleCloseClick}
                title="Close"
                aria-label="Close"
                className="modal-drag-handle-close-button shrink-0 flex items-center justify-center h-8 w-8 p-0 hover:bg-accent z-10 relative"
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
