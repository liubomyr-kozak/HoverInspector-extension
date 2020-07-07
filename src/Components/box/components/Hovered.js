import {useStateValue} from "../../../appState";
import React, {useEffect} from "react";
import {setParamsToNode, use4SideNodeRef} from "../utils";


export const Hovered = () => {
    const sideNodeRef = use4SideNodeRef()
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

    const [state] = useStateValue();

    useEffect(() => {
        if (state.type === "hover") {
            setParamsToNode(
                sideNodeRef,
                state.clientRectHoveredNode
            );
        }
    }, [state]);

    return (<>
            <div ref={topRef} className='zToolBoxBoxHover top'/>
            <div ref={bottomRef} className='zToolBoxBoxHover bottom'/>
            <div ref={leftRef} className='zToolBoxBoxHover left'/>
            <div ref={rightRef} className='zToolBoxBoxHover right'/>
        </>
    )
}

