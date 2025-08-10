import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import {
  calculateDistance,
  dispatchDistanceLineAndLabel,
  toggleLinesAndLabels,
  use4SideNodeRef,
} from "@entrypoints/core/utils";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { isActionTypeHover, isActionTypeScroll, isActionTypeSelect } from "@entrypoints/content/store/app/app.slice";

const DistanceAndLabel = () => {
  const userAction = useSelector((state) => (state as any).app.userAction) || {};

  const sideNodeRef = use4SideNodeRef();
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef;

  useEffect(() => {
    if (isActionTypeHover(userAction.type)) {
      const clientRectSelectedNode = DomNodeManager.getBoundingClientRec("selectedElement");
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

      if (clientRectHoveredNode && clientRectSelectedNode) {
        const distance = calculateDistance(clientRectHoveredNode, clientRectSelectedNode);

        if (distance) {
          dispatchDistanceLineAndLabel(sideNodeRef, distance);
        }
      }
    }

    if (isActionTypeSelect(userAction.type)) {
      toggleLinesAndLabels([topRef, bottomRef, leftRef, rightRef], "hide");
    }

    if (isActionTypeScroll(userAction.type)) {
      const clientRectSelectedNode = DomNodeManager.getBoundingClientRec("selectedElement");
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

      if (!clientRectHoveredNode) {
        return;
      }

      const distance = calculateDistance(clientRectHoveredNode, clientRectSelectedNode);

      if (distance) {
        dispatchDistanceLineAndLabel(sideNodeRef, distance);
      }
    }
  }, [userAction]);

  return (
    <>
      <div ref={topRef} className="hover-inspector-distance-line hover-inspector-top">
        <span className="hover-inspector-distance-line-label" />
      </div>
      <div ref={bottomRef} className="hover-inspector-distance-line hover-inspector-bottom">
        <span className="hover-inspector-distance-line-label" />
      </div>
      <div ref={leftRef} className="hover-inspector-distance-line hover-inspector-left">
        <span className="hover-inspector-distance-line-label" />
      </div>
      <div ref={rightRef} className="hover-inspector-distance-line hover-inspector-right">
        <span className="hover-inspector-distance-line-label" />
      </div>
    </>
  );
};

export default DistanceAndLabel;
