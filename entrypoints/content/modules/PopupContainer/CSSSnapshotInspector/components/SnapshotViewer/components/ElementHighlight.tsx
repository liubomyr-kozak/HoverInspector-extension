import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

interface ElementHighlightProps {
  selectedElementData: any;
}

const HighlightOverlay = styled.div`
  position: absolute;
  pointer-events: none;
  border: 2px solid #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(25, 118, 210, 0.3);
  transition: all 0.2s ease;
  z-index: 10;
`;

const ElementLabel = styled.div`
  position: absolute;
  top: -24px;
  left: 0;
  background-color: #1976d2;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  white-space: nowrap;
  z-index: 11;
`;

/**
 * Component for highlighting the selected element with an overlay
 */
export const ElementHighlight: React.FC<ElementHighlightProps> = ({ selectedElementData }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // skip for now
    // if (!selectedElementData || !selectedElementData.bounds) {
    //   return;
    // }
    //
    // // Get the body element from the shadow DOM of the hover-inspector
    // const body = (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!;
    //
    // // Reset visibility when new element is selected
    // setVisible(true);
    //
    // // Find the actual DOM element to get its real position
    // const findElement = () => {
    //   // Try to find the element by selector if available
    //   let element: Element | null = null;
    //
    //   if (selectedElementData.id) {
    //     element = document.getElementById(selectedElementData.id);
    //   } else if (selectedElementData.classes && selectedElementData.classes.length > 0) {
    //     const selector = `${selectedElementData.tagName.toLowerCase()}.${selectedElementData.classes.join('.')}`;
    //     element = document.querySelector(selector);
    //   } else {
    //     // Fallback to tag name
    //     element = document.querySelector(selectedElementData.tagName.toLowerCase());
    //   }
    //
    //   return element;
    // };
    //
    // const domElement = findElement();
    // let position = selectedElementData.bounds;
    //
    // // If we found the actual DOM element, use its position
    // if (domElement) {
    //   const rect = domElement.getBoundingClientRect();
    //   position = {
    //     x: rect.left,
    //     y: rect.top,
    //     width: rect.width,
    //     height: rect.height
    //   };
    // }
    //
    // if (body && overlayRef.current) {
    //   // Append the overlay to the body in the shadow DOM
    //   body.appendChild(overlayRef.current);
    //
    //   // Update position based on the actual element position
    //   const { x, y, width, height } = position;
    //
    //   if (overlayRef.current) {
    //     overlayRef.current.style.left = `${x}px`;
    //     overlayRef.current.style.top = `${y}px`;
    //     overlayRef.current.style.width = `${width}px`;
    //     overlayRef.current.style.height = `${height}px`;
    //   }
    //
    //   // Hide the highlight after a few seconds
    //   const timer = setTimeout(() => {
    //     setVisible(false);
    //   }, 3000);
    //
    //   // Cleanup function to remove the overlay when component unmounts
    //   return () => {
    //     clearTimeout(timer);
    //     if (overlayRef.current && body.contains(overlayRef.current)) {
    //       body.removeChild(overlayRef.current);
    //     }
    //   };
    // }
  }, [selectedElementData]);

  if (!selectedElementData || !selectedElementData.bounds || !visible) {
    return null;
  }

  // Create element label text
  const labelText = `${selectedElementData.tagName.toLowerCase()}${
    selectedElementData.id ? `#${selectedElementData.id}` : ""
  }${
    selectedElementData.classes && selectedElementData.classes.length > 0
      ? `.${selectedElementData.classes.join(".")}`
      : ""
  }`;

  // Get position from selectedElementData as initial values
  const { bounds } = selectedElementData;
  const { x, y, width, height } = bounds;

  // Create a div element that will be appended to the shadow DOM
  const highlightElement = (
    <HighlightOverlay
      ref={overlayRef}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <ElementLabel>{labelText}</ElementLabel>
    </HighlightOverlay>
  );

  // Return the element that will be rendered in React's virtual DOM
  return highlightElement;
};
