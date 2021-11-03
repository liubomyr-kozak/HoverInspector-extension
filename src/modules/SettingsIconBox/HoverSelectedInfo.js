import React, { useState } from "react";
import { connect } from "react-redux";
import cx from "classnames";

import DomNodeManager from "../../core/DomNodeManager";
import { colorBoxStyle } from "../Popup/PopupStyle";
import { targetColorStringToHex } from "../Popup/helpers";

const styleRulesList = [
  'padding-right', 'padding-left', 'padding-top', 'padding-bottom',
  'margin-right', 'margin-left', 'margin-top', 'margin-bottom',
  'height', 'width',
  'font-size', 'font-family', 'font',
  'color',
  'background-color',
  'border-top-color', 'border-top-style', 'border-top-width',
  'border-bottom-color', 'border-bottom-style', 'border-bottom-width',
  'border-left-color', 'border-left-style', 'border-left-width',
  'border-right-color', 'border-right-style', 'border-right-width',
];


const Border = ({ hoverElement }) => {
  return (<>
    <div className="zTool-foo" key="border-right:">
      <span className="zTool-css-key">border-right:</span>
      <span className="zTool-css-value">
                    {hoverElement.border.right.width}
        {' '}
        {hoverElement.border.right.style}
        {' '}
        <span className="zTool-foo" style={colorBoxStyle(hoverElement.border.right.color)}/>
        {targetColorStringToHex(hoverElement.border.right.color)}
                  </span>
    </div>

    <div className="zTool-foo" key="border-left:">
      <span className="zTool-css-key">border-left:</span>
      <span className="zTool-css-value">
                    {hoverElement.border.left.width}
        {' '}
        {hoverElement.border.left.style}
        {' '}
        <span className="zTool-foo" style={colorBoxStyle(hoverElement.border.left.color)}/>
        {targetColorStringToHex(hoverElement.border.left.color)}
                  </span>
    </div>

    <div className="zTool-foo" key="border-top:">
      <span className="zTool-css-key">border-top:</span>
      <span className="zTool-css-value">
                    {hoverElement.border.top.width}
        {' '}
        {hoverElement.border.top.style}
        {' '}
        <span className="zTool-foo" style={colorBoxStyle(hoverElement.border.top.color)}/>
        {targetColorStringToHex(hoverElement.border.top.color)}
                  </span>
    </div>

    <div className="zTool-foo" key="border-bottom:">
      <span className="zTool-css-key">border-bottom:</span>
      <span className="zTool-css-value">
                    {hoverElement.border.bottom.width}
        {' '}
        {hoverElement.border.bottom.style}
        {' '}
        <span className="zTool-foo" style={colorBoxStyle(hoverElement.border.bottom.color)}/>
        {targetColorStringToHex(hoverElement.border.bottom.color)}
                  </span>
    </div>
  </>)
}

const HoverSelectedInfo = ({ userAction }) => {
  const [activeTab, setActiveTab] = useState(0);

  const selectedElement = DomNodeManager.getStyleByNode("selectedElement", styleRulesList);
  const hoverElement = DomNodeManager.getStyleByNode("hoverElement", styleRulesList);

  const switchTab = () => {
    setActiveTab(!activeTab)
  }

  return (<div className="zToolSettingTab">
      <div className="zToolSettingTabHeader">
        <span onClick={switchTab} className={cx('zToolSettingTabHeaderItem', { '--active': !activeTab })}>Target</span>
        <span onClick={switchTab} className={cx('zToolSettingTabHeaderItem', { '--active': activeTab })}>Source</span>
      </div>
      <div className="zTool-foo">

        <div className={cx('zToolSettingTabContainer', { '--active': !activeTab })}>
          {Object.keys(hoverElement)
            .filter((key)=> hoverElement[key])
            .map((key) => {
            if (key === 'border' && hoverElement[key]) {
              return <Border hoverElement={hoverElement}/>
            }
            return (
              <div className="zTool-foo" key={key}>
                <span className="zTool-css-key">{key}</span>
                <span className="zTool-css-value">{hoverElement[key]}</span>
              </div>
            )
          })}
        </div>
        <div className={cx('zToolSettingTabContainer', { '--active': activeTab })}>
          {Object.keys(selectedElement)
            .filter((key)=> selectedElement[key])
            .map((key) => {
            if (key === 'border' && selectedElement[key]) {
              return <Border hoverElement={selectedElement}/>
            }
            return (
              <div className="zTool-foo" key={key}>
                <span className="zTool-css-key">{key}</span>
                <span className="zTool-css-value">{selectedElement[key]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


const mapStateToProps = (state) => ({
  userAction: state.app.userAction || {}
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(HoverSelectedInfo)