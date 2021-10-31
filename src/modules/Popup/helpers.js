import { classNameStyle, idStyle, tagStyle } from "./PopupStyle";
import React from "react";

export const cutPx = (styleValue) => {
  return Number(styleValue.replace('px', ''))
}
export const getTagMeta = (tag, id, className) => {
  return <div className="zTool-foo" style={{ marginRight: '15px' }}>
    <span className="zTool-foo" style={tagStyle}>{tag}</span>
    <span className="zTool-foo" style={idStyle}>{id ? id : ''}</span>
    <span className="zTool-foo" style={classNameStyle}>{className ? className : ''}</span>
  </div>
}


const arrowWidth = 15;

export function isChildText(childNode) {
  if (!childNode) return;
  return !!Array.prototype.slice.call(childNode).find(el => el.nodeType === 3);
}


export function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export const targetColorStringToHex = (value) => {

  const color = value
    .replace('rgb(', '')
    .replace(')', '')
    .split(',')
    .map(v => Number(v))

  if (color[3]) return value;
  return rgbToHex(color[0], color[1], color[2]);
}

export const getLeftPosition = (popupAndHovered) => {
  if (!popupAndHovered.popup.hasTopPosition && !popupAndHovered.popup.hasBottomPosition) {
    return popupAndHovered.popup.left
  }

  const topLabelNode = document.getElementsByClassName('zToolDistanceLine top')[0]
  const bottomLabelNode = document.getElementsByClassName('zToolDistanceLine bottom')[0]

  const labelTopContainer = topLabelNode.offsetTop;
  const labelTop = topLabelNode.children[0].offsetTop;
  const labelBottomContainer = bottomLabelNode.offsetTop;
  const labelBottom = bottomLabelNode.children[0].offsetTop;

  const coveredLabelTopPx = popupAndHovered.popup.hasBottomPosition
    ? labelBottom + labelBottomContainer
    : labelTop + labelTopContainer;

  const isPopupCoverLabel =
    popupAndHovered.popup.top <= coveredLabelTopPx &&
    (popupAndHovered.popup.top + popupAndHovered.popup.height) > coveredLabelTopPx

  if (!isPopupCoverLabel) return popupAndHovered.popup.left

  return popupAndHovered.popup.left
    + cutPx(popupAndHovered.hovered.width)
    + popupAndHovered.hovered.marginLeft
    + popupAndHovered.hovered.paddingLeft
    + popupAndHovered.hovered.paddingRight
    - arrowWidth;
}