import React, {useEffect} from "react";
import {connect, useSelector} from "react-redux";

import {setParamsToNode, use4SideNodeRef} from "@/entrypoints/core/utils";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";

const HoveredLinesArea = () => {
    const userAction = useSelector(state => (state as any).app.userAction) || {}
    const sideNodeRef = use4SideNodeRef();
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

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
            <div ref={topRef} className='zToolBoxBoxHover zTool_top'/>
            <div ref={bottomRef} className='zToolBoxBoxHover zTool_bottom'/>
            <div ref={leftRef} className='zToolBoxBoxHover zTool_left'/>
            <div ref={rightRef} className='zToolBoxBoxHover zTool_right'/>
        </>
    )
}


export default HoveredLinesArea