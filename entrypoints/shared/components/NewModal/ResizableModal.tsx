import { useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import { TbGripVertical } from "react-icons/tb";
import { IoCloseSharp } from "react-icons/io5";
import * as React from "react";
import { onMinimizedFeaturePopup } from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";
import { useDispatch } from "react-redux";

interface ResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
}

export function ResizableModal({
  isOpen,
  title,
  children,
  footer,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  onPositionChange,
  onSizeChange,
}: ResizableModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dispatch = useDispatch();
  const onClose = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation(); // Prevent event bubbling
    dispatch(onMinimizedFeaturePopup.getPayload(true));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <style>
        {`
        /* Base styles for all resize handles */
        .resize-handle {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
          pointer-events: auto;
        }
        
        /* Individual hover and active effects */
        .resize-handle-top:hover, .resize-handle-top:active, .resizing .resize-handle-top {
          opacity: 1 !important;
        }
        .resize-handle-right:hover, .resize-handle-right:active, .resizing .resize-handle-right {
          opacity: 1 !important;
        }
        .resize-handle-bottom:hover, .resize-handle-bottom:active, .resizing .resize-handle-bottom {
          opacity: 1 !important;
        }
        .resize-handle-left:hover, .resize-handle-left:active, .resizing .resize-handle-left {
          opacity: 1 !important;
        }
        .resize-handle-top-left:hover, .resize-handle-top-left:active, .resizing .resize-handle-top-left {
          opacity: 1 !important;
        }
        .resize-handle-top-right:hover, .resize-handle-top-right:active, .resizing .resize-handle-top-right {
          opacity: 1 !important;
        }
        .resize-handle-bottom-right:hover, .resize-handle-bottom-right:active, .resizing .resize-handle-bottom-right {
          opacity: 1 !important;
        }
        .resize-handle-bottom-left:hover, .resize-handle-bottom-left:active, .resizing .resize-handle-bottom-left {
          opacity: 1 !important;
        }
        `}
      </style>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-0"
      >
        <Rnd
          default={{
            x: initialPosition.x,
            y: initialPosition.y,
            width: initialSize.width,
            height: initialSize.height,
          }}
          minWidth={300}
          minHeight={200}
          maxWidth={1200}
          maxHeight={800}
          bounds="parent"
          dragHandleClassName="modal-drag-handle"
          onDragStart={() => setIsDragging(true)}
          onDragStop={(e, d) => {
            setIsDragging(false);
            onPositionChange?.(d.x, d.y);
          }}
          onResizeStart={() => setIsResizing(true)}
          onResize={(e, direction, ref, delta, position) => {
            const width = parseInt(ref.style.width);
            const height = parseInt(ref.style.height);
            onSizeChange?.(width, height);
            onPositionChange?.(position.x, position.y);
          }}
          onResizeStop={() => setIsResizing(false)}
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
          resizeHandleStyles={{
            topLeft: {
              width: "20px",
              height: "20px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "50%",
              left: "-10px",
              top: "-10px",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            topRight: {
              width: "20px",
              height: "20px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "50%",
              right: "-10px",
              top: "-10px",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            bottomLeft: {
              width: "20px",
              height: "20px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "50%",
              left: "-10px",
              bottom: "-10px",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            bottomRight: {
              width: "20px",
              height: "20px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "50%",
              right: "-10px",
              bottom: "-10px",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            top: {
              width: "85%",
              height: "10px",
              backgroundColor: "#3b82f6",
              border: "1px solid white",
              borderRadius: "5px",
              left: "50%",
              transform: "translateX(-50%)",
              top: "-5px",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            right: {
              width: "10px",
              height: "85%",
              backgroundColor: "#3b82f6",
              border: "1px solid white",
              borderRadius: "5px",
              right: "-5px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            bottom: {
              width: "85%",
              height: "10px",
              backgroundColor: "#3b82f6",
              border: "1px solid white",
              borderRadius: "5px",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "-5px",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            left: {
              width: "10px",
              height: "85%",
              backgroundColor: "#3b82f6",
              border: "1px solid white",
              borderRadius: "5px",
              left: "-5px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1000,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
          }}
          className={`pointer-events-auto bg-white bg-card border border-gray-200 rounded-lg shadow-xl overflow-hidden ${
            isDragging ? "cursor-grabbing" : ""
          } ${isResizing ? "resizing" : ""} rnd-container`}
        >
          <div className="flex flex-col h-full">
            {/* Header - Drag Handle */}
            <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 bg-white bg-card cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <TbGripVertical className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-medium">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-accent z-10 relative"
                style={{ pointerEvents: "auto", cursor: "pointer" }}
              >
                <IoCloseSharp className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-auto bg-white bg-card">{children}</div>

            {/* Footer */}
            {footer && <div className="border-t border-gray-200 bg-white bg-card">{footer}</div>}
          </div>
        </Rnd>
      </motion.div>
    </div>
  );
}
