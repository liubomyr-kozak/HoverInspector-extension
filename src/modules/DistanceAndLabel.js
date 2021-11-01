import React, { useEffect } from "react";
import { connect } from "react-redux";

import { calculateDistance, dispatchDistanceLineAndLabel, toggleLinesAndLabels, use4SideNodeRef } from "../core/utils";
import DomNodeManager from "../core/DomNodeManager";
import { USER_EVENT_HOVER_CONFIRM, USER_EVENT_SCROLL_CONFIRM, USER_EVENT_SELECT_CONFIRM } from "../store/app.constant";


const DistanceAndLabel = ({ userAction }) => {
  const sideNodeRef = use4SideNodeRef()
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef

  useEffect(() => {
    if (userAction.type === USER_EVENT_HOVER_CONFIRM) {
      const clientRectSelectedNode = DomNodeManager.getBoundingClientRec('selectedElement');
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec('hoverElement');

      if (clientRectHoveredNode && clientRectSelectedNode) {
        const distance = calculateDistance(
          clientRectHoveredNode,
          clientRectSelectedNode
        );

        if (distance) {
          dispatchDistanceLineAndLabel(sideNodeRef, distance);
        }
      }
    }

    if (userAction.type === USER_EVENT_SELECT_CONFIRM) {
      toggleLinesAndLabels([topRef, bottomRef, leftRef, rightRef], 'hide');
    }


    if (userAction.type === USER_EVENT_SCROLL_CONFIRM) {
      const clientRectSelectedNode = DomNodeManager.getBoundingClientRec("selectedElement");
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

      if (!clientRectHoveredNode) {
        return;
      }

      const distance = calculateDistance(
        clientRectHoveredNode,
        clientRectSelectedNode
      );

      if (distance) {
        dispatchDistanceLineAndLabel(sideNodeRef, distance);
      }
    }
  }, [userAction]);

  return (<>
      <div ref={topRef} className='zToolDistanceLine top'>
        <span className="zToolDistanceLineLabel"/>
      </div>
      <div ref={bottomRef} className='zToolDistanceLine bottom'>
        <span className="zToolDistanceLineLabel"/>
      </div>
      <div ref={leftRef} className='zToolDistanceLine left'>
        <span className="zToolDistanceLineLabel"/>
      </div>
      <div ref={rightRef} className='zToolDistanceLine right'>
        <span className="zToolDistanceLineLabel"/>
      </div>
    </>
  )
}

const mapStateToProps = (state) => ({
  userAction: state.app.userAction || {}
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(DistanceAndLabel)