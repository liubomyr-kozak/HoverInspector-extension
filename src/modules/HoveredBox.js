import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";

import DomNodeManager from "../core/DomNodeManager";
import { setMargin, setPadding } from "../core/utils";
import { USER_EVENT_HOVER_CONFIRM, USER_EVENT_SCROLL_CONFIRM } from "../store/app.constant";
import { renderStatus } from "../store/app.action";
import { markAsRendered, markAsReRendered } from "../shared/helpers";

const HoveredBox = ({ userAction, renderStatus }) => {
  const paddingRef = useRef();
  const marginRef = useRef();

  useEffect(() => {
    if (userAction.type === USER_EVENT_HOVER_CONFIRM) {
      const hoverNodeParams = DomNodeManager.getStyleByNode('hoverElement');
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec('hoverElement');

      setPadding(paddingRef.current, clientRectHoveredNode, hoverNodeParams);
      setMargin(marginRef.current, clientRectHoveredNode, hoverNodeParams);
      renderStatus(markAsRendered('hoveredBox'));
    }

    if (userAction.type === USER_EVENT_SCROLL_CONFIRM) {
      const hoverNodeParams = DomNodeManager.getStyleByNode('hoverElement');
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec('hoverElement');

      setPadding(paddingRef.current, clientRectHoveredNode, hoverNodeParams);
      setMargin(marginRef.current, clientRectHoveredNode, hoverNodeParams);
      renderStatus(markAsReRendered('hoveredBox'));
    }
  }, [userAction]);

  return (
    <>
      <div ref={paddingRef} className="zToolTooltipPadding"/>
      <div ref={marginRef} className="zToolTooltipMargin"/>
    </>
  )
}

export const mapStateToProps = (state) => ({
  userAction: state.app.userAction || {}
})

const mapDispatchToProps = {
  renderStatus
}

export default connect(mapStateToProps, mapDispatchToProps)(HoveredBox)