import React, { useEffect } from "react";
import { connect } from "react-redux";
import { setParamsToNode, use4SideNodeRef } from "../core/utils";
import DomNodeManager from "../core/DomNodeManager";
import { USER_EVENT_SCROLL_CONFIRM, USER_EVENT_SELECT_CONFIRM } from "../store/app.constant";

const dnStyle = {
  display: "none"
}

const SelectedBox = ({ userAction }) => {
  const sideNodeRef = use4SideNodeRef();
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef;

  useEffect(() => {
    const clientRectSelectedNode = DomNodeManager.getBoundingClientRec("selectedElement");

    if (!clientRectSelectedNode) return;

    if (userAction.type === USER_EVENT_SELECT_CONFIRM) {
      if (!clientRectSelectedNode) {
        setParamsToNode(sideNodeRef, { top: 0, bottom: 0, right: 0, left: 0, height: 0, width: 0 })
        return;
      }

      setParamsToNode(sideNodeRef, clientRectSelectedNode);
      return;
    }

    if (userAction.type === USER_EVENT_SCROLL_CONFIRM) {
      setParamsToNode(sideNodeRef, clientRectSelectedNode);
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

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(SelectedBox)