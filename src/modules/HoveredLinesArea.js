import React, { useEffect } from "react";
import { connect } from "react-redux";

import { setMargin, setPadding, setParamsToNode, use4SideNodeRef } from "../core/utils";
import DomNodeManager from "../core/DomNodeManager";

const HoveredLinesArea = ({ userAction }) => {
  const sideNodeRef = use4SideNodeRef();
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef

  useEffect(() => {
    if (!userAction.type) return;

    const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

    if (!clientRectHoveredNode) return;

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
}

export default connect(mapStateToProps, mapDispatchToProps)(HoveredLinesArea)