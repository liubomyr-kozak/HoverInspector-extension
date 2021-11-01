import React, { useEffect } from 'react';
import { connect } from "react-redux";
import PopupSettingModel from "../core/Models/PopupSettingModel";
import {
  USER_EVENT_HOVER,
  USER_EVENT_SCROLL,
  USER_EVENT_SCROLL_CONFIRM,
  USER_EVENT_SELECT
} from "../store/app.constant";
import DomNodeManager from "../core/DomNodeManager";

let preNodeTarget = null

function hasAppClass(node) {
  return (typeof node.className === 'string') && node.className.includes('zTool');
}

const onInputMove = (e) => dispatch => {
  const candidateToHoverElement = e.target;

  // in SVG className is Object
  const isHoveredNotTarget = preNodeTarget !== candidateToHoverElement;

  if (isHoveredNotTarget) {
    preNodeTarget = candidateToHoverElement;
  } else {
    return;
  }

  if (hasAppClass(candidateToHoverElement)) {
    return;
  }

  DomNodeManager.update({ candidateToHoverElement });
  return dispatch({ type: USER_EVENT_HOVER });
}

const onScroll = (e) => (dispatch) => {
  return dispatch({ type: USER_EVENT_SCROLL_CONFIRM });
}

const onClick = (e) => () => {
  if (PopupSettingModel.preventDefault && !hasAppClass(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}
const onMouseUp = (e) => () => {
  if (PopupSettingModel.preventDefault && !hasAppClass(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}

const onMouseDown = (e) => (dispatch) => {
  if (PopupSettingModel.preventDefault && !hasAppClass(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  const candidateToSelectedElement = e.target;

  // in SVG className is Object
  if (hasAppClass(e.target)) {
    return true;
  }

  DomNodeManager.update({ candidateToSelectedElement });

  return dispatch({ type: USER_EVENT_SELECT })
}


const EventListenerProvider = ({ children, onMouseDown, onInputMove, onScroll, appIsActive, onMouseUp, onClick }) => {
  useEffect(() => {
    if (appIsActive) {
      window.addEventListener('mousemove', onInputMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('click', onClick);
      window.addEventListener('scroll', onScroll);
    }

    return () => {
      window.removeEventListener('mousemove', onInputMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
    }
  }, [appIsActive])

  return (<>{children}</>)
}


const mapStateToProps = (state) => ({
  appIsActive: state.app.isActive
})


const mapDispatchToProps = (dispatch) => ({
  onMouseUp: (data) => dispatch(onMouseUp(data)),
  onClick: (data) => dispatch(onClick(data)),
  onInputMove: (data) => dispatch(onInputMove(data)),
  onMouseDown: (data) => dispatch(onMouseDown(data)),
  onScroll: (data) => dispatch(onScroll(data)),
})

export default connect(mapStateToProps, mapDispatchToProps)(EventListenerProvider)