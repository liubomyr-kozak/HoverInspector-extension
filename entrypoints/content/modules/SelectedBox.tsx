import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { setParamsToNode, use4SideNodeRef } from "@entrypoints/core/utils";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { isActionTypeScroll } from "@entrypoints/content/store/app/app.slice";

const dnStyle = {
  display: "none",
};

const SelectedBox = () => {
  const userAction = useSelector((state) => (state as any).app.userAction) || {};
  const sideNodeRef = use4SideNodeRef();

  const { topRef, bottomRef, leftRef, rightRef } = sideNodeRef;

  useEffect(() => {
    const clientRectSelectedNode = DomNodeManager.getBoundingClientRec("selectedElement");

    if (!clientRectSelectedNode) return;

    // if (isActionTypeSelect(userAction.type)) {
    if (!clientRectSelectedNode) {
      setParamsToNode(sideNodeRef, { top: 0, bottom: 0, right: 0, left: 0, height: 0, width: 0 });
      return;
    }

    setParamsToNode(sideNodeRef, clientRectSelectedNode);
    // return;
    // }

    if (isActionTypeScroll(userAction.type)) {
      setParamsToNode(sideNodeRef, clientRectSelectedNode);
    }
  }, [userAction]);

  return (
    <>
      <div ref={topRef} style={dnStyle} className="zToolBoxBoxSelected zTool_top" />
      <div ref={bottomRef} style={dnStyle} className="zToolBoxBoxSelected zTool_bottom" />
      <div ref={leftRef} style={dnStyle} className="zToolBoxBoxSelected zTool_left" />
      <div ref={rightRef} style={dnStyle} className="zToolBoxBoxSelected zTool_right" />
    </>
  );
};

export default SelectedBox;
