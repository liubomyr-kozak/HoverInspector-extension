import styled, { css } from "styled-components";
import { ZINDEX_POPUP_WRAPPER } from "@entrypoints/shared/constant/zIndex.ts";

export const BoxLabelContainer = styled.div`
  color: #333;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  position: relative;
  z-index: 1;
  text-align: left;
  padding: 5px 10px;
  min-height: 20px;
  min-width: 170px;
  max-width: 350px;
`;

export const PopupWrapper = styled.div<{
  top?: string;
  left?: string;
  visible?: boolean;
  arrowDirection?: "top" | "bottom";
}>`
  box-sizing: border-box;
  position: fixed;
  z-index: ${ZINDEX_POPUP_WRAPPER};
  background: #fff;
  border-radius: 4px;
  opacity: 0;
  box-shadow:
    0 1px 5px 0 rgba(67, 67, 67, 0.47),
    0 5px 5px 0 rgba(154, 160, 185, 0.05),
    0 5px 30px 0 rgba(166, 173, 201, 0.22);
  top: ${({ top }) => `${top || 0}`}px;
  left: ${({ left }) => `${left || 0}`}px;

  ${({ visible }) =>
    visible &&
    css`
      opacity: 1;
    `}
  &.bottom::before {
    content: "";
    background: #f1f1f1;
    position: absolute;
    display: block;
    padding: 2px;
    border-width: 0px 7px 7px 0px;
    border-style: solid;
    border-color: #ffffff;
    box-shadow: 0 1px 5px 0 rgb(221 221 221);
    transform: rotate(45deg);
    bottom: -5px;
    left: 10px;
  }

  &.top::before {
    content: "";
    background: #f1f1f1;
    position: absolute;
    display: block;
    padding: 2px;
    border-width: 0px 7px 7px 0px;
    border-style: solid;
    border-color: #ffffff;
    box-shadow: rgb(130 130 130 / 60%) 0px 1px 5px 0px;
    transform: rotate(-135deg);
    top: -5px;
    left: 10px;
  }
`;