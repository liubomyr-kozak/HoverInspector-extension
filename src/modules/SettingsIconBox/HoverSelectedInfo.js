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

const Border = ({ el, index }) => {
  return (
    <span key={index}>
      <div className="zTool-foo" key={'border-right' + index}>
        <span className="zTool-css-key">border-right:</span>
        <span className="zTool-css-value">
          {el.border.right.width}
          {' '}
          {el.border.right.style}
          {' '}
          <span className="zTool-foo" style={colorBoxStyle(el.border.right.color)}/>
          {targetColorStringToHex(el.border.right.color)}
        </span>
      </div>

      <div className="zTool-foo"  key={'border-left' + index}>
        <span className="zTool-css-key">border-left:</span>
        <span className="zTool-css-value">
          {el.border.left.width}
          {' '}
          {el.border.left.style}
          {' '}
          <span className="zTool-foo" style={colorBoxStyle(el.border.left.color)}/>
          {targetColorStringToHex(el.border.left.color)}
      </span>
      </div>

      <div className="zTool-foo" key={'border-top' + index}>
        <span className="zTool-css-key">border-top:</span>
        <span className="zTool-css-value">
          {el.border.top.width}
          {' '}
          {el.border.top.style}
          {' '}
          <span className="zTool-foo" style={colorBoxStyle(el.border.top.color)}/>
          {targetColorStringToHex(el.border.top.color)}
        </span>
      </div>

      <div className="zTool-foo" key={'border-bottom' + index}>
        <span className="zTool-css-key">border-bottom:</span>
        <span className="zTool-css-value">
          {el.border.bottom.width}
          {' '}
          {el.border.bottom.style}
          {' '}
          <span className="zTool-foo" style={colorBoxStyle(el.border.bottom.color)}/>
          {targetColorStringToHex(el.border.bottom.color)}
      </span>
      </div>
    </span>
  )
}

const HoverSelectedInfo = ({ userAction }) => {
  const [activeTab, setActiveTab] = useState(0);

  const selectedElement = DomNodeManager.getStyleByNode("selectedElement", styleRulesList);
  const hoverElement = DomNodeManager.getStyleByNode("hoverElement", styleRulesList);
  const hoverElementRender = Object.keys(hoverElement).filter((key) => hoverElement[key])
  const selectedElementRender = Object.keys(selectedElement).filter((key) => selectedElement[key])

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
          {hoverElementRender && hoverElementRender.map((key) => {
              const index = key + "selectedElement";

              if (key === 'border' && hoverElement[key]) {
                return <Border el={hoverElement} index={index}/>
              }

              return (
                <div className="zTool-foo" key={index}>
                  <span className="zTool-css-key">{key}</span>
                  <span className="zTool-css-value">{hoverElement[key]}</span>
                </div>
              )
            })}
        </div>
        <div className={cx('zToolSettingTabContainer', { '--active': activeTab })}>
          {selectedElementRender && selectedElementRender.map((key) => {
              const index = key + "selectedElement";

              if (key === 'border' && selectedElement[key]) {
                return <Border el={selectedElement} index={index}/>
              }

              return (
                <div className="zTool-foo" key={index}>
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