import * as React from 'react'
import {useEffect, useMemo, useCallback, memo, useState, useRef} from 'react'
import {Modal, Dropdown, Menu} from 'antd'
import {ModalProps} from 'antd/lib/modal'
import styled from "styled-components";
import {useDispatch} from 'react-redux';
import throttle from 'lodash-es/throttle';

import {ResizeHandle} from './ResizeHandle'
import {useDrag} from './useDrag'
import {usePrevious} from './usePrevious'
import {ModalID, ModalState} from './draggableModalReducer'
import {useResize} from './useResize'

import './index.css'

import {
    dragModal, focusModal, hide, mount, resizeModal, show, unmount
} from "./store/draggableModalSlice.ts";
import {onMinimizedFeaturePopup} from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";


const ModalTitle = styled.div`
    cursor: move;
    padding: 16px;
`;

const modalStyle: React.CSSProperties = {margin: 0, paddingBottom: 0, pointerEvents: 'auto'}

interface ContextProps {
    id: ModalID
    modalState: ModalState
    initialWidth?: number
    initialHeight?: number
    initialX?: number
    initialY?: number
    onModalStateChange: (state: {
        x: number
        y: number
        width: number
        height: number
    }) => void
}


export type DraggableModalInnerProps = ModalProps & { children?: React.ReactNode } & ContextProps

function DraggableModalInnerNonMemo({
                                        id,
                                        modalState,
                                        open,
                                        children,
                                        title,
                                        initialWidth,
                                        initialHeight,
                                        initialX,
                                        initialY,
                                        footer,
                                        onModalStateChange,
                                        ...otherProps
                                    }: DraggableModalInnerProps) {

    const dispatch = useDispatch()


    // Call on mount and unmount.
    useEffect(() => {
        dispatch(mount({
            id, initialState: {
                width: initialWidth as number,
                height: initialHeight as number,
                x: initialX as number,
                y: initialY as number,
            }
        }))

        return () => {
            dispatch(unmount(id))
        }
    }, [dispatch, id, initialWidth, initialHeight])

    const throttledDispatch = useMemo(() => throttle(dispatch, 10), [dispatch]);

    const onMouseMove = (data) => {
        throttledDispatch(dragModal(data));
    };
    const onResizeModal = (data) => {
        throttledDispatch(resizeModal(data));
    };

    const {zIndex, x, y, width, height} = modalState

    const style: React.CSSProperties = useMemo(() => ({
        ...modalStyle,
        top: y,
        left: x,
        height,
        width
    }), [y, x, height, width, modalStyle])

    const onFocus = useCallback(() => dispatch(focusModal(id)), [id, dispatch])

    const onDragWithID = useCallback(args => onMouseMove({id, ...args}), [id,])

    const onResizeWithID = useCallback(args => onResizeModal({id, ...args}), [id,])

    const onMouseDrag = useDrag(x, y, onDragWithID)
    const onMouseResizeBottomRight = useResize(x, y, width, height, 'bottom-right', onResizeWithID)
    const onMouseResizeBottomLeft = useResize(x, y, width, height, 'bottom-left', onResizeWithID)
    const onMouseResizeTopLeft = useResize(x, y, width, height, 'top-left', onResizeWithID)
    const onMouseResizeTopRight = useResize(x, y, width, height, 'top-right', onResizeWithID)

    const titleElement = useMemo(() => (<ModalTitle
        onMouseDown={onMouseDrag}
        onClick={onFocus}
    >
        {title}
    </ModalTitle>), [onMouseDrag, onFocus, title],)


    useEffect(() => {
        const debounce = setTimeout(() => {
            onModalStateChange({
                x: style.left as number,
                y: style.top as number,
                width: style.width as number,
                height: style.height as number,
            })
        }, 300);

        return () => clearTimeout(debounce)
    }, [style]);


    const onCancel = () => {
        dispatch(onMinimizedFeaturePopup.getPayload(true))
    }

    return (
        <Modal
            wrapClassName="draggable-modal"
            keyboard={false}
            open={open}
            style={style}
            width={width}
            destroyOnHidden={true}
            mask={false}
            maskClosable={false}
            onCancel={onCancel}
            zIndex={zIndex}
            title={titleElement}
            {...otherProps}
            footer={footer || null}
            // @ts-ignore
            getContainer={() => (document.querySelector('hover-inspector')!.shadowRoot as HTMLElement)?.querySelector('html > body')}
        >
            <div>
                {children}
            </div>
            <ResizeHandle direction="bottom-right" onMouseDown={onMouseResizeBottomRight}/>
            <ResizeHandle direction="bottom-left" onMouseDown={onMouseResizeBottomLeft}/>
            <ResizeHandle direction="top-left" onMouseDown={onMouseResizeTopLeft}/>
            <ResizeHandle direction="top-right" onMouseDown={onMouseResizeTopRight}/>
        </Modal>
    )
}

export const DraggableModalInner = memo(DraggableModalInnerNonMemo)

if (process.env.NODE_ENV !== 'production') {
    DraggableModalInner.displayName = 'DraggableModalInner'
}
