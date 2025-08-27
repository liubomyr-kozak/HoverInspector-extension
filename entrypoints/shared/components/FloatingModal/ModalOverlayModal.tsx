import React, { useEffect, useRef, forwardRef } from "react";
import styled from "styled-components";
import { useModalOverlayOptional } from "./ModalOverlayContext";

// The styled component (keeping the same styling as before)
const StyledModalOverlayModal = styled.div.attrs({
  className: "flex-1 p-4 overflow-auto bg-white bg-card",
})``;

// Props interface
interface ModalOverlayModalProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
}

// Create a functional component that registers itself with the context
export const ModalOverlayModal = forwardRef<HTMLDivElement, ModalOverlayModalProps>(
  ({ id, children, ...props }, ref) => {
    const modalContext = useModalOverlayOptional();
    const internalRef = useRef<HTMLDivElement>(null);
    
    // Use provided ref or internal ref
    const elementRef = (ref as React.MutableRefObject<HTMLDivElement>) || internalRef;

    useEffect(() => {
      const element = elementRef.current;
      if (element && modalContext) {
        // Register this modal container with the context
        modalContext.registerModalContainer(element, id);
        
        return () => {
          // Unregister on unmount
          modalContext.unregisterModalContainer(element, id);
        };
      }
    }, [modalContext, id]);

    return (
      <StyledModalOverlayModal
        ref={elementRef}
        {...props}
      >
        {children}
      </StyledModalOverlayModal>
    );
  }
);

ModalOverlayModal.displayName = 'ModalOverlayModal';