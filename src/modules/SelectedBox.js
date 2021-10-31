import React, { useEffect } from "react";
import { connect } from "react-redux";
import { setParamsToNode, use4SideNodeRef } from "../core/utils";
import DomNodeManager from "../core/DomNodeManager";
import { USER_EVENT_SCROLL_CONFIRM, USER_EVENT_SELECT_CONFIRM } from "../store/app.constant";
import { renderStatus } from "../store/app.action";
import { markAsRendered, markAsReRendered } from "../shared/helpers";

const dnStyle = {
  display: "none"
}

const SelectedBox = ({ userAction, renderStatus }) => {
  const sideNodeRef = use4SideNodeRef()
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef

  useEffect(() => {
    const clientRectSelectedNode =  DomNodeManager.getBoundingClientRec("selectedElement");

    if (!clientRectSelectedNode) return;

    if (userAction.type === USER_EVENT_SELECT_CONFIRM) {
      setParamsToNode(sideNodeRef, clientRectSelectedNode);
      renderStatus(markAsRendered('selectedBox'));
      return;
    }

    if (userAction.type === USER_EVENT_SCROLL_CONFIRM) {
      setParamsToNode(sideNodeRef, clientRectSelectedNode);
      renderStatus(markAsReRendered('selectedBox'));
    }
  }, [userAction]);

  return (<>
      <div ref={topRef} style={dnStyle} className='zToolBoxBoxSelected top'/>
      <div ref={bottomRef} style={dnStyle} className='zToolBoxBoxSelected bottom'/>
      <div ref={leftRef} style={dnStyle} className='zToolBoxBoxSelected left'/>
      <div ref={rightRef} style={dnStyle} className='zToolBoxBoxSelected right'/>
    </>
  )
}

const mapStateToProps = (state) => ({
  userAction: state.app.userAction || {}
})

const mapDispatchToProps = {
  renderStatus
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectedBox)