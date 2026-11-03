import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

// Enum for portal IDs - now universal for all features
export enum HeaderPortalId {
  FUNCTIONS_TAB = "functions-tab-header",
  SCENARIOS_TAB = "scenarios-tab-header",
  RECORDING = "recording-header",
  STEP_EDIT = "step-edit-header",
  CSS_SNAPSHOT = "css-snapshot-header",
  CSS_SNAPSHOT_COMPARE = "css-snapshot-header-compare",
  CSS_SNAPSHOT_DETAILS = "css-snapshot-header-details",
  ANALYZE_PAGE = "analyze-page-header",
  COLOR_PICKER = "color-picker-header",
  ELEMENT_INSPECTOR = "element-inspector-header",
  UNIT_CONVERTER = "unit-converter-header",
  VIEWPORT_INFO = "viewport-info-header",
  PAGE_NOTES = "page-notes-header",
}

// Universal header portal component for all features
export const PortalModalHeader: React.FC<{
  children?: React.ReactNode;
  portalId: string;
}> = ({ children, portalId }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the shadow root
    const shadowRoot = document.querySelector("hover-inspector")?.shadowRoot as ShadowRoot | null;

    if (shadowRoot) {
      const container = shadowRoot.querySelector("#popup-header-container") as HTMLElement | null;

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
        portalElement.className = "w-full min-w-0";
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

export const PortalModalHeaderButtonsWrapper = styled.div.attrs({ className: "hi-header-buttons" })`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
  margin-right: 8px;
  border-right: 1px solid #e5e7eb;
  padding-right: 8px;
`;

export const PortalModalHeaderButtons: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return <PortalModalHeaderButtonsWrapper>{children}</PortalModalHeaderButtonsWrapper>;
};
// Backward compatibility export
export const ScenarioPortalHeaderButtons = PortalModalHeader;
