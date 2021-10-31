import React, { useEffect } from "react";
import { connect } from "react-redux";

import { setMargin, setPadding, setParamsToNode, use4SideNodeRef } from "../core/utils";
import DomNodeManager from "../core/DomNodeManager";
import { renderStatus } from "../store/app.action";
import { markAsRendered, markAsReRendered } from "../shared/helpers";
import { USER_EVENT_HOVER_CONFIRM, USER_EVENT_SCROLL_CONFIRM } from "../store/app.constant";

const HoveredLinesArea = ({ userAction, renderStatus }) => {
  const sideNodeRef = use4SideNodeRef();
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef

  useEffect(() => {
    if (!userAction.type) return;

    const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

    if (!clientRectHoveredNode) return;

    if (userAction.type === USER_EVENT_HOVER_CONFIRM) {
      renderStatus(markAsRendered('hoveredLinesArea'));
    }

    if (userAction.type === USER_EVENT_SCROLL_CONFIRM) {
      renderStatus(markAsReRendered('hoveredLinesArea'));
    }

    setParamsToNode(
      sideNodeRef,
      clientRectHoveredNode
    );
  }, [userAction]);

  return (<>
      <div ref={topRef} className='zToolBoxBoxHover top'/>
      <div ref={bottomRef} className='zToolBoxBoxHover bottom'/>
      <div ref={leftRef} className='zToolBoxBoxHover left'/>
      <div ref={rightRef} className='zToolBoxBoxHover right'/>
    </>
  )
}


const mapStateToProps = (state) => ({
  userAction: state.app.userAction || {}
})

const mapDispatchToProps = {
  renderStatus
}

export default connect(mapStateToProps, mapDispatchToProps)(HoveredLinesArea)