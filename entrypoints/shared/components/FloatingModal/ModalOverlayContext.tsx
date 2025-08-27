import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

// Interface for modal container reference
interface ModalContainerRef {
  element: HTMLElement;
  id?: string;
}

// Context interface
interface ModalOverlayContextType {
  registerModalContainer: (element: HTMLElement, id?: string) => void;
  unregisterModalContainer: (element: HTMLElement, id?: string) => void;
  getModalContainer: (id?: string) => HTMLElement | null;
  getAllModalContainers: () => HTMLElement[];
  scrollToBottom: (id?: string) => void;
}

// Create the context
const ModalOverlayContext = createContext<ModalOverlayContextType | null>(null);

// Provider component
export const ModalOverlayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const containerRefs = useRef<Map<string, HTMLElement>>(new Map());
  const defaultContainerRef = useRef<HTMLElement | null>(null);

  const registerModalContainer = useCallback((element: HTMLElement, id?: string) => {
    if (id) {
      containerRefs.current.set(id, element);
    } else {
      // If no ID provided, use as default container
      defaultContainerRef.current = element;
    }
  }, []);

  const unregisterModalContainer = useCallback((element: HTMLElement, id?: string) => {
    if (id) {
      containerRefs.current.delete(id);
    } else {
      // Clear default container if it matches
      if (defaultContainerRef.current === element) {
        defaultContainerRef.current = null;
      }
    }
  }, []);

  const getModalContainer = useCallback((id?: string): HTMLElement | null => {
    if (id) {
      return containerRefs.current.get(id) || null;
    }
    
    // Return default container or the first available container
    return defaultContainerRef.current || 
           (containerRefs.current.size > 0 ? Array.from(containerRefs.current.values())[0] : null);
  }, []);

  const getAllModalContainers = useCallback((): HTMLElement[] => {
    const containers: HTMLElement[] = [];
    if (defaultContainerRef.current) {
      containers.push(defaultContainerRef.current);
    }
    containers.push(...Array.from(containerRefs.current.values()));
    return containers;
  }, []);

  const scrollToBottom = useCallback((id?: string) => {
    const container = getModalContainer(id);
    
    if (container) {
      // Use smooth scrolling behavior
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      // Fallback to finding scrollable containers in the current DOM
      // This maintains compatibility with existing implementations
      const fallbackContainers = document.querySelectorAll(
        '.ant-modal-body, .ant-tabs-content, [class*="modal"], [style*="overflow"]'
      );
      
      for (const fallbackContainer of fallbackContainers) {
        const element = fallbackContainer as HTMLElement;
        const style = window.getComputedStyle(element);
        if (
          style.overflow === 'auto' || 
          style.overflow === 'scroll' || 
          style.overflowY === 'auto' || 
          style.overflowY === 'scroll'
        ) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
          break;
        }
      }
    }
  }, [getModalContainer]);

  const contextValue: ModalOverlayContextType = {
    registerModalContainer,
    unregisterModalContainer,
    getModalContainer,
    getAllModalContainers,
    scrollToBottom,
  };

  return (
    <ModalOverlayContext.Provider value={contextValue}>
      {children}
    </ModalOverlayContext.Provider>
  );
};

// Hook to use the context
export const useModalOverlay = (): ModalOverlayContextType => {
  const context = useContext(ModalOverlayContext);
  if (!context) {
    throw new Error('useModalOverlay must be used within a ModalOverlayProvider');
  }
  return context;
};

// Optional: Hook that provides fallback behavior if context is not available
export const useModalOverlayOptional = (): ModalOverlayContextType | null => {
  return useContext(ModalOverlayContext);
};