import styled from "styled-components";

export const ModalOverlay = styled.div<{ $zIndex: number }>`
  //position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: ${(p) => p.$zIndex};

  /* Resize handles base */
  .resize-handle {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    pointer-events: auto;
  }

  /* Show on interaction */
  .resize-handle:hover,
  .resize-handle:active,
  .resizing .resize-handle {
    opacity: 1 !important;
  }
`;

export const ModalOverlayModal = styled.div.attrs({
  className: "flex-1 p-4 overflow-auto bg-white bg-card",
})``;
