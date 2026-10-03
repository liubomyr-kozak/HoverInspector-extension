import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import DomNodeManager, { useDomNodeObserver } from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { clipOverlayTo, setElementBorder } from "@entrypoints/core/utils";

import { isActionTypeHover, isActionTypeScroll } from "@entrypoints/content/store/app/app.slice";
import styled from "styled-components";
import { getNodeComputedStyle } from "@entrypoints/shared/frameAgent/remoteNode";
import { ZINDEX_HOVERED_ELEMENT_BORDER } from "@entrypoints/shared/constant/zIndex.ts";

const HoveredElementBorder = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: ${ZINDEX_HOVERED_ELEMENT_BORDER};
  border: 3px dotted #ff5e2f;
`;

const AnyHoveredElementBox = () => {
  const anyHoveredElementRef = useRef<HTMLDivElement | null>(null);
  const userAction = useSelector((state) => (state as any).app.userAction) || {};

  const anyHoveredElement = useDomNodeObserver("anyHoveredElement");

  useEffect(() => {
    if (isActionTypeHover(userAction.type) || isActionTypeScroll(userAction.type)) {
      const anyHoveredElement = DomNodeManager.get("anyHoveredElement");
      if (!anyHoveredElement) return;

      const clientRectHoveredNode = DomNodeManager.getBoundingClientRec(anyHoveredElement);
      const borderRadius = getNodeComputedStyle(anyHoveredElement).borderRadius;

      setElementBorder(anyHoveredElementRef.current, {
        borderRadius,
        top: clientRectHoveredNode.top,
        left: clientRectHoveredNode.left,
        width: clientRectHoveredNode.width,
        height: clientRectHoveredNode.height,
      });
      // Inside an iframe, stop at the frame's edges like the element does
      clipOverlayTo(anyHoveredElementRef.current, DomNodeManager.getOverlayClipRect(anyHoveredElement));
    }
  }, [userAction, anyHoveredElement]);

  return <HoveredElementBorder ref={anyHoveredElementRef} />;
};

export default AnyHoveredElementBox;
