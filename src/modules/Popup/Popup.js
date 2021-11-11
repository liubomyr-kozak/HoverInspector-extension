import React, { Component, createRef } from "react";
import cx from "classnames";
import { connect } from "react-redux";
import { cutPx, getLeftPosition, getTagMeta, isChildText, targetColorStringToHex } from "./helpers";
import DomNodeManager from "../../core/DomNodeManager";
import { colorBoxStyle, flexChildRightStyle, flexStyle, targetSizeStyle, targetTitleStyle } from "./PopupStyle";


const PopupContainer = ({ data, hoverElement }) => {
  const { height, width, tag, className, id, padding, margin, border, color, backgroundColor, font } = data;
  return (
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

      {border && border.type === 'single' && <div className="zTool-foo" style={flexStyle}>
        <div className="zTool-foo" style={targetTitleStyle}>Border:</div>
        <div className="zTool-foo" style={flexChildRightStyle}>
          {border.width}
          {' '}
          {border.style}
          {' '}
          <span className="zTool-foo" style={colorBoxStyle(border.color)}/>
          {targetColorStringToHex(border.color)}
        </div>
      </div>}

      {border && border.type === 'multiple' && <>
        <div className="zTool-foo" style={flexStyle}>
          <div className="zTool-foo" style={targetTitleStyle}>Border-Right:</div>
          <div className="zTool-foo" style={flexChildRightStyle}>
            {border.right.width}
            {' '}
            {border.right.style}
            {' '}
            <span className="zTool-foo" style={colorBoxStyle(border.right.color)}/>
            {targetColorStringToHex(border.right.color)}
          </div>
        </div>
        <div className="zTool-foo" style={flexStyle}>
          <div className="zTool-foo" style={targetTitleStyle}>Border-Left:</div>
          <div className="zTool-foo" style={flexChildRightStyle}>
            {border.left.width}
            {' '}
            {border.left.style}
            {' '}
            <span className="zTool-foo" style={colorBoxStyle(border.left.color)}/>
            {targetColorStringToHex(border.left.color)}
          </div>
        </div>
        <div className="zTool-foo" style={flexStyle}>

          <div className="zTool-foo" style={targetTitleStyle}>Border-Top:</div>
          <div className="zTool-foo" style={flexChildRightStyle}>
            {border.top.width}
            {' '}
            {border.top.style}
            {' '}
            <span className="zTool-foo" style={colorBoxStyle(border.top.color)}/>
            {targetColorStringToHex(border.top.color)}
          </div>
        </div>
        <div className="zTool-foo" style={flexStyle}>
          <div className="zTool-foo" style={targetTitleStyle}>Border-Bottom:</div>
          <div className="zTool-foo" style={flexChildRightStyle}>
            {border.bottom.width}
            {' '}
            {border.bottom.style}
            {' '}
            <span className="zTool-foo" style={colorBoxStyle(border.bottom.color)}/>
            {targetColorStringToHex(border.bottom.color)}
          </div>
        </div>
      </>}
    </div>
  )
}

// listen { listenChangeUserAction } events updates
class Popup extends Component {
  popupRef = createRef();
  lockRerender = false;
  arrowHeight = 8

  state = {
    isVisible: false,
    visibleIn: {},
    data: null
  }

  componentDidUpdate(prevProps) {
    if (this.lockRerender) return;

    const hoverNodeParams = DomNodeManager.getStyleByNode("hoverElement");
    if (!Object.keys(hoverNodeParams).length) return;

    this.setState(
      () => {
        return {
          data: {
            ...hoverNodeParams,
            backgroundColor: hoverNodeParams['background-color']
          }
        }
      },
      () => {
        this.lockRerender = true;

        this.setState(
          () => this.getPopupPosition(),
          () => {
            setTimeout(() => {
              this.lockRerender = false;
            }, 0)
          }
        )
      }
    )
  }

  getPopupPosition = () => {
    const hoverNodeParams = DomNodeManager.getStyleByNode("hoverElement");
    const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

    const { width } = hoverNodeParams;
    const { top, bottom, left } = clientRectHoveredNode;

    const marginBottom = cutPx(hoverNodeParams['margin-bottom']);
    const marginTop = cutPx(hoverNodeParams['margin-top']);
    const marginLeft = cutPx(hoverNodeParams['margin-left']);
    const paddingLeft = cutPx(hoverNodeParams['padding-left']);
    const paddingRight = cutPx(hoverNodeParams['padding-right']);

    const popupHeight = this.popupRef.current ? this.popupRef.current.offsetHeight : 0;
    const popupWidth = this.popupRef.current ? this.popupRef.current.offsetWidth : 0;

    const clientWindow = {
      bottom: window.innerHeight || document.documentElement.clientHeight,
      left: window.innerWidth || document.documentElement.clientWidth,
      top: 0
    }

    const popupTopPosition = top - popupHeight - marginTop - this.arrowHeight
    const popupBottomPosition = bottom + this.arrowHeight + marginBottom;

    let popup = {
      css: {
        top: '0',
        left: '0'
      },
      visibleIn: {
        top: false,
        bottom: false,
      },
      isVisible: true
    }

    popup.visibleIn.top = clientWindow.top <= popupTopPosition;
    popup.visibleIn.bottom = clientWindow.bottom > (popupBottomPosition + popupHeight);

    const topPositionProposal = popup.visibleIn.bottom
      ? popupBottomPosition
      : !popup.visibleIn.bottom && popup.visibleIn.top
        ? popupTopPosition
        : 10;

    const leftProposal = popup.visibleIn.bottom || popup.visibleIn.top ? left - marginLeft : 10;

    popup.css.top = topPositionProposal
    popup.css.left = getLeftPosition({
      popup: {
        top: topPositionProposal,
        height: popupHeight,
        left: leftProposal,
        hasTopPosition: !popup.visibleIn.bottom && popup.visibleIn.top,
        hasBottomPosition: popup.visibleIn.bottom
      },
      hovered: { paddingLeft, marginLeft, paddingRight, width },
    });

    if (clientWindow.left <= popup.css.left + popupWidth) {
      popup.css.left = 10;
      popup.css.top = 10;

      popup.visibleIn.bottom = false;
      popup.visibleIn.top = false;
    }

    return popup;
  }

  render() {
    const popup = this.state || {};
    const hoverElement = DomNodeManager.get("hoverElement");
    return (<>
        <div
          ref={this.popupRef}
          style={{
            top: popup && popup.css && popup.css.top,
            left: popup && popup.css && popup.css.left
          }}
          className={
            cx('zToolBoxLabel', {
              "zToolBoxLabel_arrow_top": popup.visibleIn.bottom,
              "zToolBoxLabel_arrow_bottom": !popup.visibleIn.bottom && popup.visibleIn.top,
              "--visible": popup.isVisible
            })
          }>
          {popup.data && <PopupContainer data={popup.data} hoverElement={hoverElement}/>}
        </div>
      </>
    )
  }
}


const mapStateToProps = (state) => ({
  listenChangeUserAction: state.app.userAction || {}
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(Popup);