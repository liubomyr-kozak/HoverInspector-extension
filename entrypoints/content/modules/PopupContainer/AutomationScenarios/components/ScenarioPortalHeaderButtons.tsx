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
}

// Universal header portal component for all features
export const PortalModalHeader: React.FC<{
  children?: React.ReactNode;
  portalId: string;
}> = ({ children, portalId }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Знаходимо shadowRoot
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
        portalElement.dataset.portalId = portalId; // Для ідентифікації
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

  // Поки контейнер не готовий — нічого не рендеримо
  if (!portalContainer) return null;

  // Рендеримо дітей у портал
  return createPortal(children, portalContainer);
};

export const PortalModalHeaderButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 1.5rem;
  border-right-width: 1px;
  border-style: solid;
  padding-right: 1.25rem;
`;

export const PortalModalHeaderButtons: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return <PortalModalHeaderButtonsWrapper>{children}</PortalModalHeaderButtonsWrapper>;
};
// Backward compatibility export
export const ScenarioPortalHeaderButtons = PortalModalHeader;
