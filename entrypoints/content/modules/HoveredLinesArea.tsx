import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { setParamsToNode, use4SideNodeRef } from "@entrypoints/core/utils";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";

const HoveredLinesArea = () => {
  const userAction = useSelector((state) => (state as any).app.userAction) || {};
  const sideNodeRef = use4SideNodeRef();
  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef;

  useEffect(() => {
    if (!userAction.type) return;

    const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");

    if (!clientRectHoveredNode) return;

    setParamsToNode(sideNodeRef, clientRectHoveredNode);
  }, [userAction]);

  return (
    <>
      <div ref={topRef} className="hover-inspector-box-box-hover hover-inspector-top" />
      <div ref={bottomRef} className="hover-inspector-box-box-hover hover-inspector-bottom" />
      <div ref={leftRef} className="hover-inspector-box-box-hover hover-inspector-left" />
      <div ref={rightRef} className="hover-inspector-box-box-hover hover-inspector-right" />
    </>
  );
};

export default HoveredLinesArea;
