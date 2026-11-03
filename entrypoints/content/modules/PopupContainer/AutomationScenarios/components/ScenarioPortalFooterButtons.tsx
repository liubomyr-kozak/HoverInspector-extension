import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Enum for portal IDs
export enum PortalId {
  FUNCTIONS_TAB = "functions-tab",
  SCENARIOS_TAB = "scenarios-tab",
  RECORDING = "recording",
  STEP_EDIT = "step-edit",
  INITIAL = "INITIAL",
}

export const ScenarioPortalFooterButtons: React.FC<{
  children?: React.ReactNode;
  portalId: string;
  containerId?: string;
}> = ({ children, portalId, containerId = "hover-inspector-popup-footer-container" }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the shadow root
    const shadowRoot = document.querySelector("hover-inspector")?.shadowRoot as ShadowRoot | null;

    if (shadowRoot) {
      const container = shadowRoot.querySelector(`#${containerId}`) as HTMLElement | null;

      if (container) {
        // Check if a portal with this ID already exists
        const existingPortal = container.querySelector(`[data-portal-id="${portalId}"]`) as HTMLElement | null;

        if (existingPortal) {
          // If it exists, use it instead of creating a new one
          setPortalContainer(existingPortal);
          return () => {
            // Don't remove the element in cleanup, just set state to null
          };
        }

        // Create a new portal element if it doesn't exist
        const portalElement = document.createElement("div");
        portalElement.dataset.portalId = portalId; // For identification
        portalElement.className = "w-full";
        container.appendChild(portalElement);
        setPortalContainer(portalElement);

        return () => {
          // Only remove the element if it's still a child of the container
          if (container.contains(portalElement)) {
            container.removeChild(portalElement);
          }
        };
      }
    }

    // If no container is found, just return an empty cleanup function
    return () => {};
  }, [portalId]);

  // Render nothing until the container is ready
  if (!portalContainer) return null;

  // Render the children into the portal
  return createPortal(children, portalContainer);
};
