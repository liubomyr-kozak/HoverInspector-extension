import React from "react";

import {colorBoxStyle} from "../../Popup/PopupStyle.tsx";
import {targetColorStringToHex} from "../../Popup/helpers.tsx";

import {CssKey, CssValue} from "./Border.styled.ts";

export const Border = ({el, index}: {
    el: {
        border: {
            right: { width: string, style: string, color: string },
            left: { width: string, style: string, color: string },
            top: { width: string, style: string, color: string },
            bottom: { width: string, style: string, color: string }
        }
    },
    index: number
}) => {
    return (
        <span key={index}>
          <div key={'border-right' + index}>
            <CssKey>border-right:</CssKey>
            <CssValue>
              {el.border.right.width}
                {' '}
                {el.border.right.style}
                {' '}
                <span style={colorBoxStyle(el.border.right.color)}/>
                {targetColorStringToHex(el.border.right.color)}
            </CssValue>
          </div>

          <div key={'border-left' + index}>
            <CssKey>border-left:</CssKey>
            <CssValue>
                {el.border.left.width}
                {' '}
                {el.border.left.style}
                {' '}
                <span style={colorBoxStyle(el.border.left.color)}/>
                {targetColorStringToHex(el.border.left.color)}
            </CssValue>
          </div>

          <div key={'border-top' + index}>
            <CssKey>border-top:</CssKey>
            <CssValue>
              {el.border.top.width}
                {' '}
                {el.border.top.style}
                {' '}
                <span style={colorBoxStyle(el.border.top.color)}/>
                {targetColorStringToHex(el.border.top.color)}
            </CssValue>
          </div>
          <div key={'border-bottom' + index}>
            <CssKey>border-bottom:</CssKey>
            <CssValue>
                {el.border.bottom.width}
                {' '}
                {el.border.bottom.style}
                {' '}
                <span style={colorBoxStyle(el.border.bottom.color)}/>
                {targetColorStringToHex(el.border.bottom.color)}
            </CssValue>
          </div>
    </span>
    )
}