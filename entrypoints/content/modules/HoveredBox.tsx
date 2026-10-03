import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { clipOverlayTo, setMargin, setPadding } from "@entrypoints/core/utils";

import { isActionTypeHover, isActionTypeScroll } from "@entrypoints/content/store/app/app.slice";

const HoveredBox = () => {
  const paddingRef = useRef<HTMLDivElement | null>(null);
  const marginRef = useRef<HTMLDivElement | null>(null);
  const userAction = useSelector((state) => (state as any).app.userAction) || {};

  const drawBoxModel = (hoverElement) => {
    const hoverNodeParams = DomNodeManager.getStyleByNode(hoverElement);
    const clientRectHoveredNode = DomNodeManager.getBoundingClientRec(hoverElement);
    // CSS zoom and the scale of the iframes the element is in
    const scale = DomNodeManager.getOverlayScale(hoverElement);

    setPadding(paddingRef.current, clientRectHoveredNode, hoverNodeParams, scale);
    setMargin(marginRef.current, clientRectHoveredNode, hoverNodeParams, scale);

    // Inside an iframe, the margin/padding boxes stop at the frame's edges like the element does
    const clip = DomNodeManager.getOverlayClipRect(hoverElement);
    clipOverlayTo(paddingRef.current, clip);
    clipOverlayTo(marginRef.current, clip);
  };

  useEffect(() => {
    if (isActionTypeHover(userAction.type)) {
      const hoverElement = DomNodeManager.get("hoverElement");
      if (!hoverElement) return;
      drawBoxModel(hoverElement);
    }

    if (isActionTypeScroll(userAction.type)) {
      const hoverElement = DomNodeManager.get("hoverElement");
      if (!hoverElement) return;
      drawBoxModel(hoverElement);
    }
  }, [userAction]);

  return (
    <>
      <div ref={paddingRef} className="hover-inspector-tooltip-padding" />
      <div ref={marginRef} className="hover-inspector-tooltip-margin" />
    </>
  );
};

export default HoveredBox;
