import React, { useState } from "react";
import cx from 'classnames';
import { connect } from "react-redux";

import HoverIcon from '../../../dist/images/new_logo2/zTool-32-active.png';
import SettingIcon from './setting.png';
import { ReactComponent as DiscordIcon } from './discord.svg'
import { ReactComponent as GoogleFormIcon } from './forms-icon.svg'
import { ReactComponent as CloseIcon } from './close.svg'
import EmailIcon from './email.png'
import "./SettingsIconBox.scss";
import { closeSettingPopup, updatePopupSetting } from "../../store/app.action";

// превент на в стор і в локал стор
const SettingsIconBox = ({preventDefault, updatePopupSetting}) => {
  const [isOpen, setIsOpen] = useState(false)

  return <div
    className={cx('zTool-SettingsIconBox', { "--open": isOpen })}>
    <div className="zTool-SettingsIconBox-close-icon" onClick={() => {
      setIsOpen(false);
    }}>
      <CloseIcon/>
    </div>
    <div
      className={cx('zTool-SettingsIconBox-icon', { "--close": isOpen })}
      onClick={() => setIsOpen(true)}
    >
      <img className="zTool-SettingsIconBox-main-icon" src={HoverIcon}/>
      <img className="zTool-SettingsIconBox-sub-icon" src={SettingIcon}/>
    </div>

    <div className={cx('zTool-SettingsIconBox-setting', {
      "--open": isOpen
    })}>
      <div className="zTool-SettingsIconBox-setting-title">
        <span className="zTool-SettingsIconBox-setting-icon">
          <img className="zTool-SettingsIconBox-sub-icon" src={SettingIcon}/>
        </span>
        HoverInspector settings
      </div>

      <div className="zTool-SettingsIconBox-setting-body">
        <div className="zTool-title">Settings:</div>
        <div className="zTool-item" onClick={() => {
          updatePopupSetting({
            preventDefault: !preventDefault
          });
        }}>
          Prevent Default
          <span className='zTool-switcher-btn'>
            <span className={cx({ "--active": preventDefault })}>Yes</span>
            <span>No</span>
          </span>
        </div>
        {/*<div className="zTool-title">History:</div>*/}
        <div className="zTool-title">Give Feedback:</div>
        <a target="_blank" href="https://discord.gg/Skh3tnYKB7" className="zTool-feedback-btn"><DiscordIcon/></a>
        <a target="_blank" href="https://forms.gle/kaZFbYjP9zd4x6Re6"
           className="zTool-feedback-btn"><GoogleFormIcon/></a>
        <a target="_blank" href="https://forms.gle/kaZFbYjP9zd4x6Re6" className="zTool-feedback-btn">
          <img src={EmailIcon} alt=""/>
        </a>
      </div>
    </div>
  </div>
}


const mapStateToProps = (state) => ({
  preventDefault: state.app?.settings?.preventDefault
})

const mapDispatchToProps = {
  closeSettingPopup,
  updatePopupSetting,
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsIconBox)