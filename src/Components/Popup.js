import {useStateValue} from "../core/appState";
import React, {useRef} from "react";
import cx from "classnames";

const flexStyle = {
    display: "flex"
}

const flexChildRightStyle = {
    marginLeft: "auto",
}

const colorBoxStyle = (bg) => ({
    display: "inline-block",
    width: "10px",
    height: "10px",
    verticalAlign: "middle",
    marginRight: "7px",
    fontSize: '12px !important',
    background: bg
})

const tagStyle = {
    color: "#8a38ae",
    fontWeight: "bold",
}

const idStyle = {
    color: "#0581cd",
}

const classNameStyle = {
    color: "#d35400",
}

const targetSizeStyle = {
    marginLeft: 'auto',
    color: '#7f8c8d'
}

const targetTitleStyle = {
    color: '#7f8c8d',
    marginRight: "5px"
}

const cutPx = (styleValue) => {
    return Number(styleValue.replace('px', ''))
}

const getTagMeta = (tag, id, className) => {
    return <div style={{marginRight: '15px'}}>
        <span style={tagStyle}>{tag}</span>
        <span style={idStyle}>{id ? id : ''}</span>
        <span style={classNameStyle}>{className ? className : ''}</span>
    </div>
}

const arrowHeight = 8;
const arrowWidth = 15;

function isChildText(childNode) {
    if (!childNode) return;
    return !!Array.prototype.slice.call(childNode).find(el => el.nodeType === 3);
}


function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const targetColorStringToHex = (value) => {

    const color = value
        .replace('rgb(', '')
        .replace(')', '')
        .split(',')
        .map(v => Number(v))

    if (color[3]) return value;
    return rgbToHex(color[0], color[1], color[2]);
}


const getLabelMEtaData = (el, type) => {
    const isVisible = document.defaultView.getComputedStyle(el, "").display !== 'none';

    return {
        el,
        top: el.offsetTop,
        left: el.offsetLeft,
        bottom: el.offsetTop + el.offsetHeight,
        right: el.offsetLeft + el.offsetWidth,
        type,
        isVisible
    }
}

const getLeftPosition = (popupAndHovered) => {
    if(!popupAndHovered.popup.hasTopPosition && !popupAndHovered.popup.hasBottomPosition){
        return popupAndHovered.popup.left
    }

    const topLabelNode = document.getElementsByClassName('zToolDistanceLine top')[0]
    const bottomLabelNode = document.getElementsByClassName('zToolDistanceLine bottom')[0]

    const labelTopContainer = topLabelNode.offsetTop;
    const labelTop =topLabelNode.children[0].offsetTop;
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

export const Popup = () => {
    const nodeRef = useRef(null);
    const [state] = useStateValue();

    if (!state.clientRectHoveredNode) return <div ref={nodeRef}/>

    const {height, width, tag, className, id, padding, margin} = state.hoverNodeParams;
    const {top, bottom, left} = state.clientRectHoveredNode;
    const marginBottom = cutPx(state.hoverNodeParams['margin-bottom']);
    const marginTop = cutPx(state.hoverNodeParams['margin-top']);
    const marginLeft = cutPx(state.hoverNodeParams['margin-left']);
    const paddingLeft = cutPx(state.hoverNodeParams['padding-left']);
    const paddingRight = cutPx(state.hoverNodeParams['padding-right']);
    const color = state.hoverNodeParams['color'];
    const backgroundColor = state.hoverNodeParams['background-color'];
    const font = state.hoverNodeParams['font'];
    const popupHeight = nodeRef.current ? nodeRef.current.offsetHeight : 0;
    const popupWidth = nodeRef.current ? nodeRef.current.offsetWidth : 0;

    const clientWindow = {
        bottom: window.innerHeight || document.documentElement.clientHeight,
        left: window.innerWidth || document.documentElement.clientWidth,
        top: 0
    }

    let popupMeta = {
        position: {
            top: top - popupHeight - marginTop - arrowHeight,
            bottom: bottom + arrowHeight + marginBottom,
        },
        css: {}
    }

    let isPopupVisible = {
        top: clientWindow.top <= popupMeta.position.top,
        bottom: clientWindow.bottom > (popupMeta.position.bottom + popupHeight),
    }

    const topPositionProposal = isPopupVisible.bottom
        ? popupMeta.position.bottom
        : !isPopupVisible.bottom && isPopupVisible.top
            ? popupMeta.position.top
            : 10;

    const leftProposal = isPopupVisible.bottom || isPopupVisible.top ? left - marginLeft : 10;

    popupMeta.css.top = topPositionProposal
    popupMeta.css.left = getLeftPosition({
        popup: {
            top: topPositionProposal,
            height: popupHeight,
            left: leftProposal,
            hasTopPosition: !isPopupVisible.bottom && isPopupVisible.top,
            hasBottomPosition: isPopupVisible.bottom
        },
        hovered: {
            paddingLeft,
            marginLeft,
            paddingRight,
            width
        },
    });

    if(clientWindow.left <= popupMeta.css.left + popupWidth) {
        popupMeta.css.left = 10;
        popupMeta.css.top = 10;

        isPopupVisible.bottom = false;
        isPopupVisible.top = false;
    }

    return (<>
            <div ref={nodeRef}
                 style={{
                     top: popupMeta.css.top,
                     left: popupMeta.css.left
                 }}
                 className={
                     cx('zToolBoxLabel', {
                         "zToolBoxLabel_arrow_top": isPopupVisible.bottom,
                         "zToolBoxLabel_arrow_bottom": !isPopupVisible.bottom && isPopupVisible.top
                     })
                 }>
                <div className="zToolBoxLabelContainer">
                    <div style={flexStyle}>
                        {getTagMeta(tag, id, className)}
                        <span style={targetSizeStyle}>{cutPx(height)} x {cutPx(width)}</span>
                    </div>

                    {padding && <div style={flexStyle}>
                        <div style={targetTitleStyle}>Padding:</div>
                        <div style={flexChildRightStyle}>{padding}</div>
                    </div>}
                    {margin && <div style={flexStyle}>
                        <div style={targetTitleStyle}>Margin:</div>
                        <div style={flexChildRightStyle}>{margin}</div>
                    </div>}
                    {backgroundColor && <div style={flexStyle}>
                        <div style={targetTitleStyle}>Background:</div>
                        <div style={flexChildRightStyle}>
                            <span style={colorBoxStyle(backgroundColor)}/>
                            {targetColorStringToHex(backgroundColor)}
                        </div>
                    </div>}

                    {isChildText(state.hoverElement.childNodes) && <>
                        {font && <div style={flexStyle}>
                            <div style={targetTitleStyle}>Font Size:</div>
                            <div style={flexChildRightStyle}>{font}</div>
                        </div>}
                        {color && <div style={flexStyle}>
                            <div style={targetTitleStyle}>Color:</div>
                            <div style={flexChildRightStyle}>
                                <span style={colorBoxStyle(color)}/>
                                {targetColorStringToHex(color)}
                            </div>
                        </div>}
                    </>}
                </div>
            </div>
        </>
    )
}
