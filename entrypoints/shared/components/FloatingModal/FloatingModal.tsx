import { FunctionComponent, ReactElement, useRef, useEffect } from "react";
import { ModalProps } from "antd/lib/modal";
import { ResizableModal } from "./ResizableModal";
import { ModalOverlayProvider } from "./ModalOverlayContext";

/**
 * FloatingModal props interface
 * Extends Ant Design's ModalProps but replaces 'open' with our own implementation
 */
export interface FloatingModalProps extends Omit<ModalProps, "open"> {
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  footer?: React.ReactNode;
  viewSourceType?: string;
  open?: boolean;
  position?: "absolute" | "fixed";
  onModalStateChange?: (state: { x: number; y: number; width: number; height: number }) => void;
  minWidth?: number;
  minHeight?: number;
}

/**
 * FloatingModal component
 * A simplified wrapper around ResizableModal that maintains compatibility with existing code
 */
export const FloatingModal: FunctionComponent<FloatingModalProps> = (props): ReactElement => {
  const {
    initialWidth = 600,
    initialHeight = 400,
    initialX = 100,
    initialY = 100,
    title,
    footer,
    children,
    open = false,
    onModalStateChange,
    onCancel,
    position = "fixed",
    viewSourceType,
    minWidth,
    minHeight,
    ...restProps
  } = props;

  // Use refs to track the current position and size across renders
  const positionRef = useRef({ x: initialX, y: initialY });
  const sizeRef = useRef({ width: initialWidth, height: initialHeight });

  // Update refs when props change
  useEffect(() => {
    positionRef.current = { x: initialX, y: initialY };
    sizeRef.current = { width: initialWidth, height: initialHeight };
  }, [initialX, initialY, initialWidth, initialHeight]);

  // Handle position changes
  const handlePositionChange = (x: number, y: number) => {
    positionRef.current = { x, y };
    onModalStateChange?.({
      x,
      y,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
    });
  };

  // Handle size changes
  const handleSizeChange = (width: number, height: number) => {
    sizeRef.current = { width, height };
    onModalStateChange?.({
      x: positionRef.current.x,
      y: positionRef.current.y,
      width,
      height,
    });
  };

  return (
    <ModalOverlayProvider>
      <ResizableModal
        isOpen={open}
        title={title}
        footer={footer}
        initialPosition={positionRef.current}
        initialSize={sizeRef.current}
        onPositionChange={handlePositionChange}
        onSizeChange={handleSizeChange}
        onClose={onCancel}
        position={position}
        viewSourceType={viewSourceType}
        minWidth={minWidth}
        minHeight={minHeight}
      >
        {children}
      </ResizableModal>
    </ModalOverlayProvider>
  );
};
