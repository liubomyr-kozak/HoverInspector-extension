import {useStateValue} from "../../../appState";
import React, {useEffect} from "react";
import {setParamsToNode, use4SideNodeRef} from "../utils";

export const Selected = () => {
    const sideNodeRef = use4SideNodeRef()
    const [state] = useStateValue();
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

    useEffect(() => {
        if (state.type === "select") {
            setParamsToNode(sideNodeRef, state.clientRectNode);
        }
    }, [state]);

    return (<>
            <div ref={topRef} className='zToolBoxBoxSelected top'/>
            <div ref={bottomRef} className='zToolBoxBoxSelected bottom'/>
            <div ref={leftRef} className='zToolBoxBoxSelected left'/>
            <div ref={rightRef} className='zToolBoxBoxSelected right'/>
        </>
    )
}
