import {useStateValue} from "../core/appState";
import React, {useEffect} from "react";
import {setParamsToNode, use4SideNodeRef} from "../core/utils";

const dnStyle = {
    display: "none"
}

export const HoveredLinesArea = () => {
    const sideNodeRef = use4SideNodeRef()
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

    const [state] = useStateValue();

    useEffect(() => {
        if (!state.type) return

        setParamsToNode(
            sideNodeRef,
            state.clientRectHoveredNode
        );
    }, [state]);

    return (<>
            <div ref={topRef} style={dnStyle} className='zToolBoxBoxHover top'/>
            <div ref={bottomRef} style={dnStyle}  className='zToolBoxBoxHover bottom'/>
            <div ref={leftRef} style={dnStyle} className='zToolBoxBoxHover left'/>
            <div ref={rightRef} style={dnStyle}  className='zToolBoxBoxHover right'/>
        </>
    )
}

