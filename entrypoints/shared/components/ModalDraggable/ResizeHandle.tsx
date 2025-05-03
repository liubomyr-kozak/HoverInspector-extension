import * as React from 'react'
import styled from "styled-components";
import {RxCornerBottomRight, RxCornerBottomLeft, RxCornerTopRight, RxCornerTopLeft} from "react-icons/rx";
import {ResizeDirection} from "./useResize.ts";
import {TbMinusVertical, TbMinus} from "react-icons/tb";

const directionCursors: Record<ResizeDirection, string> = {
    'top': 'n-resize', 'right': 'e-resize', 'bottom': 's-resize', 'left': 'w-resize', 'top-left': 'nw-resize', 'top-right': 'ne-resize', 'bottom-left': 'sw-resize', 'bottom-right': 'se-resize',
}

// 💡 Координати для позиціонування хендлу в кутку/краї
const positionMap: Record<ResizeDirection, { [key: string]: string }> = {
    'top': {top: '-4px', left: '50%', transform: 'translateX(-50%)'},
    'right': {top: '50%', right: '-3px', transform: 'translateY(-50%)'},
    'bottom': {bottom: '-4px', left: '50%', transform: 'translateX(-50%)'},
    'left': {top: '50%', left: '-9px', transform: 'translateY(-50%)'},
    'top-left': {top: '-4px', left: '-3px'},
    'top-right': {top: '-4px', right: '-3px'},
    'bottom-left': {bottom: '-4px', left: '-3px'},
    'bottom-right': {bottom: '-4px', right: '-3px'},
}

const ModalResizeHandle = styled.div<{ direction: ResizeDirection }>`
    position: absolute;
    width: 30px;
    height: 30px;
    font-size: 27px;

    // динамічний курсор мишки
    cursor: ${({direction}) => directionCursors[direction]};

    // позиціонування на основі напрямку

    ${({direction}) => {
        const style = positionMap[direction]
        return Object.entries(style)
                .map(([key, value]) => `${key}: ${value};`)
                .join('\n')
    }}
    &:active {
        svg {
            display: block;
        }
    }

    svg {
        display: none;
    }

    &:hover {
        svg {
            display: block;
        }
    }
    
`

interface ResizeHandleProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    direction: ResizeDirection
}

export const ResizeHandle = ({
                                 direction, ...props
                             }: ResizeHandleProps): React.ReactElement => (<ModalResizeHandle direction={direction} {...props}>
        {direction === 'bottom-right' && <RxCornerBottomRight/>}
        {direction === 'bottom-left' && <RxCornerBottomLeft/>}
        {direction === 'top-right' && <RxCornerTopRight/>}
        {direction === 'top-left' && <RxCornerTopLeft/>}
        {direction === 'left' && <>
          <TbMinusVertical/>
          <TbMinusVertical/>
          <TbMinusVertical/>
        </>}
        {direction === 'right' && <>
          <TbMinusVertical/>
          <TbMinusVertical/>
          <TbMinusVertical/>
        </>}
        {direction === 'top' && <div className="flex">
          <TbMinus/>
          <TbMinus/>
          <TbMinus/>
        </div>}
    </ModalResizeHandle>)