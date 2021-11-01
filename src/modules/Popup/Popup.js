import React, { useRef } from "react";
import cx from "classnames";
import { connect } from "react-redux";

import { colorBoxStyle, flexChildRightStyle, flexStyle, targetSizeStyle, targetTitleStyle } from './PopupStyle'
import { cutPx, getLeftPosition, getTagMeta, isChildText, targetColorStringToHex } from "./helpers";
import DomNodeManager from "../../core/DomNodeManager";

const arrowHeight = 8;

// listen { listenChangeUserAction } events updates
const Popup = ({ listenChangeUserAction }) => {
  const nodeRef = useRef(null);

  const clientRectHoveredNode =  DomNodeManager.getBoundingClientRec("hoverElement");

  if (!clientRectHoveredNode) return <div ref={nodeRef}/>

  const hoverNodeParams =  DomNodeManager.getStyleByNode("hoverElement");
  const hoverElement =  DomNodeManager.get("hoverElement");

  const { height, width, tag, className, id, padding, margin } = hoverNodeParams;

  const { top, bottom, left } = clientRectHoveredNode;
  const marginBottom = cutPx(hoverNodeParams['margin-bottom']);
  const marginTop = cutPx(hoverNodeParams['margin-top']);
  const marginLeft = cutPx(hoverNodeParams['margin-left']);
  const paddingLeft = cutPx(hoverNodeParams['padding-left']);
  const paddingRight = cutPx(hoverNodeParams['padding-right']);

  const color = hoverNodeParams['color'];
  const backgroundColor = hoverNodeParams['background-color'];
  const font = hoverNodeParams['font'];
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

  if (clientWindow.left <= popupMeta.css.left + popupWidth) {
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
          <div style={flexStyle} className="zTool-foo">
            {getTagMeta(tag, id, className)}
            <span className="zTool-foo" style={targetSizeStyle}>{cutPx(width)} x {cutPx(height)}</span>
          </div>

          {padding && <div className="zTool-foo" style={flexStyle}>
            <div className="zTool-foo" style={targetTitleStyle}>Padding:</div>
            <div className="zTool-foo" style={flexChildRightStyle}>{padding}</div>
          </div>}
          {margin && <div className="zTool-foo" style={flexStyle}>
            <div className="zTool-foo" style={targetTitleStyle}>Margin:</div>
            <div className="zTool-foo" style={flexChildRightStyle}>{margin}</div>
          </div>}
          {backgroundColor && <div className="zTool-foo" style={flexStyle}>
            <div className="zTool-foo" style={targetTitleStyle}>Background:</div>
            <div className="zTool-foo" style={flexChildRightStyle}>
              <span className="zTool-foo" style={colorBoxStyle(backgroundColor)}/>
              {targetColorStringToHex(backgroundColor)}
            </div>
          </div>}

          {isChildText(hoverElement.childNodes) && <>
            {font && <div className="zTool-foo" style={flexStyle}>
              <div className="zTool-foo" style={targetTitleStyle}>Font Size:</div>
              <div className="zTool-foo" style={flexChildRightStyle}>{font}</div>
            </div>}
            {color && <div className="zTool-foo" style={flexStyle}>
              <div className="zTool-foo" style={targetTitleStyle}>Color:</div>
              <div className="zTool-foo" style={flexChildRightStyle}>
                <span className="zTool-foo" style={colorBoxStyle(color)}/>
                {targetColorStringToHex(color)}
              </div>
            </div>}
          </>}
        </div>
      </div>
    </>
  )
}


const mapStateToProps = (state) => ({
  listenChangeUserAction: state.app.userAction || {}
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(Popup);