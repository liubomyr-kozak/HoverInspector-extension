import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { setMargin, setPadding } from "@entrypoints/core/utils";

import { isActionTypeHover, isActionTypeScroll } from "@entrypoints/content/store/app/app.slice";

const HoveredBox = () => {
  const paddingRef = useRef<HTMLDivElement | null>(null);
  const marginRef = useRef<HTMLDivElement | null>(null);
  const userAction = useSelector((state) => (state as any).app.userAction) || {};

  useEffect(() => {
    if (isActionTypeHover(userAction.type)) {
      const hoverElement = DomNodeManager.get("hoverElement");
      if (!hoverElement) return;
      const hoverNodeParams = DomNodeManager.getStyleByNode(hoverElement);
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec(hoverElement);

      setPadding(paddingRef.current, clientRectHoveredNode, hoverNodeParams);
      setMargin(marginRef.current, clientRectHoveredNode, hoverNodeParams);
    }

    if (isActionTypeScroll(userAction.type)) {
      const hoverElement = DomNodeManager.get("hoverElement");
      if (!hoverElement) return;
      const hoverNodeParams = DomNodeManager.getStyleByNode(hoverElement);
      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec(hoverElement);

      setPadding(paddingRef.current, clientRectHoveredNode, hoverNodeParams);
      setMargin(marginRef.current, clientRectHoveredNode, hoverNodeParams);
    }
  }, [userAction]);

  return (
    <>
      <div ref={paddingRef} className="zToolTooltipPadding" />
      <div ref={marginRef} className="zToolTooltipMargin" />
    </>
  );
};

export default HoveredBox;
