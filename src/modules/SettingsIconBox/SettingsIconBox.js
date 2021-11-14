import React, { useState } from "react";
import cx from 'classnames';
import { connect } from "react-redux";

import HoverIcon from '../../../dist/images/new_logo2/zTool-32-active.png';
import { closeSettingPopup, updatePopupSetting } from "../../store/app.action";

import SettingIcon from './icons/setting.png';
import { ReactComponent as DiscordIcon } from './icons/discord.svg'
import GoogleFormIcon  from './icons/google-forms.png'
import CloseIcon from './icons/close.svg'
import EmailIcon from './icons/email.png'
import HoverSelectedInfo from "./HoverSelectedInfo";

import "./SettingsIconBox.scss";

// function useDragging() {
//   const [isDragging, setIsDragging] = useState(false);
//   const [pos, setPos] = useState({ x: 0, y: 0 });
//   const ref = useRef(null);
//
//   function onMouseMove(e) {
//     if (!isDragging) return;
//     setPos({
//       x: e.x - ref.current.offsetWidth / 2,
//       y: e.y - ref.current.offsetHeight / 2,
//     });
//     e.stopPropagation();
//     e.preventDefault();
//   }
//
//   function onMouseUp(e) {
//     setIsDragging(false);
//     e.stopPropagation();
//     e.preventDefault();
//   }
//
//   function onMouseDown(e) {
//     if (e.button !== 0) return;
//     setIsDragging(true);
//
//     setPos({
//       x: e.x - ref.current.offsetWidth / 2,
//       y: e.y - ref.current.offsetHeight / 2,
//     });
//
//     e.stopPropagation();
//     e.preventDefault();
//   }
//
//   // When the element mounts, attach an mousedown listener
//   useEffect(() => {
//     ref.current.addEventListener("mousedown", onMouseDown);
//
//     return () => {
//       ref.current.removeEventListener("mousedown", onMouseDown);
//     };
//   }, [ref.current]);
//
//   // Everytime the isDragging state changes, assign or remove
//   // the corresponding mousemove and mouseup handlers
//   useEffect(() => {
//     if (isDragging) {
//       document.addEventListener("mouseup", onMouseUp);
//       document.addEventListener("mousemove", onMouseMove);
//     } else {
//       document.removeEventListener("mouseup", onMouseUp);
//       document.removeEventListener("mousemove", onMouseMove);
//     }
//     return () => {
//       document.removeEventListener("mouseup", onMouseUp);
//       document.removeEventListener("mousemove", onMouseMove);
//     };
//   }, [isDragging]);
//
//   return [ref, pos.x, pos.y, isDragging];
// }

// превент на в стор і в локал стор
const SettingsIconBox = ({ preventDefault, updatePopupSetting }) => {
  const [isOpen, setIsOpen] = useState(false);

  return <div className={cx('zTool-SettingsIconBox', { "--open": isOpen })}>
    <div className="zTool-SettingsIconBox-close-icon" onClick={() => {
      setIsOpen(false);
    }}>
      <img className="zTool-foo" src={CloseIcon} alt="CloseIcon"/>
    </div>
    <div
      className={cx('zTool-SettingsIconBox-icon', { "--close": isOpen })}
      onClick={() => setIsOpen(true)}
    >
      <img className="zTool-SettingsIconBox-main-icon" src={HoverIcon} alt="HoverIcon"/>
      <img className="zTool-SettingsIconBox-sub-icon" src={SettingIcon} alt="SettingIcon"/>
    </div>

    <div className={cx('zTool-SettingsIconBox-setting', {
      "--open": isOpen
    })}>
      <div className="zTool-SettingsIconBox-setting-title">
        <span className="zTool-SettingsIconBox-setting-icon">
          <img className="zTool-SettingsIconBox-sub-icon" src={SettingIcon} alt="SettingIcon"/>
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
            <span className="zTool-foo">No</span>
          </span>
        </div>
        {/*<div className="zTool-title">History:</div>*/}
        <div className="zTool-title">hover-selected info:</div>
        <HoverSelectedInfo/>
        <div className="zTool-title">Give Feedback:</div>
        <div>
          <a target="_blank" href="https://discord.gg/Skh3tnYKB7" className="zTool-feedback-btn">
            <DiscordIcon/>
          </a>
          <a target="_blank" href="https://forms.gle/kaZFbYjP9zd4x6Re6"
             className="zTool-feedback-btn">
            <img className="zTool-foo" src={GoogleFormIcon} alt="GoogleFormIcon"/>
          </a>
          <a target="_blank" href="https://forms.gle/kaZFbYjP9zd4x6Re6" className="zTool-feedback-btn">
            <img className="zTool-foo" src={EmailIcon} alt="EmailIcon"/>
          </a>
        </div>
      </div>
    </div>
  </div>
}


const mapStateToProps = (state) => ({
  preventDefault: state.app && state.app.settings && state.app.settings.preventDefault
})

const mapDispatchToProps = {
  closeSettingPopup,
  updatePopupSetting,
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsIconBox)