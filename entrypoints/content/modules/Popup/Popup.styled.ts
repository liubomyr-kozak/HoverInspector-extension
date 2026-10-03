import styled, { css } from "styled-components";
import { ZINDEX_POPUP_WRAPPER } from "@entrypoints/shared/constant/zIndex.ts";

export const BoxLabelContainer = styled.div`
  color: #333;
  border-radius: 8px;
  font-size: 12px;
  background: #ffffff;
  position: relative;
  z-index: 1;
  text-align: left;
  padding: 12px 14px;
  min-height: 20px;
  min-width: 200px;
  max-width: 320px;
  border: 1px solid #e9ecef;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(8px);
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  /* The last section needs no gap below it */
  & > div:last-child {
    margin-bottom: 0 !important;
  }

  /* Remove the old flex class styling */
  .flex {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }
`;

export const PopupWrapper = styled.div<{
  top?: string;
  left?: string;
  visible?: boolean;
  arrowDirection?: "top" | "bottom";
}>`
  box-sizing: border-box;
  position: fixed;
  /* The tooltip often sits over the next element the user moves to; it must never catch the pointer */
  pointer-events: none;
  z-index: ${ZINDEX_POPUP_WRAPPER};
  background: #ffffff;
  border-radius: 8px;
  opacity: 0;
  border: 1px solid #e9ecef;
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.1),
    0 4px 10px rgba(0, 0, 0, 0.06),
    0 2px 4px rgba(0, 0, 0, 0.04);
  top: ${({ top }) => `${top || 0}`}px;
  left: ${({ left }) => `${left || 0}`}px;
  transform: scale(0.95) translateY(-4px);
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);

  ${({ visible }) =>
    visible &&
    css`
      opacity: 1;
      transform: scale(1) translateY(0);
    `}
  
  &.bottom::before {
    content: "";
    background: #ffffff;
    position: absolute;
    display: block;
    width: 10px;
    height: 10px;
    border-left: 1px solid #e9ecef;
    border-top: 1px solid #e9ecef;
    transform: rotate(45deg);
    bottom: -6px;
    left: 16px;
    z-index: 1;
  }

  &.top::before {
    content: "";
    background: #ffffff;
    position: absolute;
    display: block;
    width: 10px;
    height: 10px;
    border-right: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    transform: rotate(45deg);
    top: -6px;
    left: 16px;
    z-index: 1;
  }
`;