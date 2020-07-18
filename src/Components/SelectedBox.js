import React, {useEffect} from "react";
import {useStateValue} from "../core/appState";
import {setParamsToNode, use4SideNodeRef} from "../core/utils";

const dnStyle = {
    display: "none"
}

export const SelectedBox = () => {
    const sideNodeRef = use4SideNodeRef()
    const [state] = useStateValue();
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

    useEffect(() => {
        if (state.type === 'scroll') {
            setParamsToNode(sideNodeRef, state.clientRectSelectedNode);
        }

        if (state.type === "select") {
            setParamsToNode(sideNodeRef, state.clientRectSelectedNode);
        }

        if ((state.type === 'scroll' || state.type === 'scrollWithoutSelected') && state.clientRectSelectedNode) {
            setParamsToNode(sideNodeRef, state.clientRectSelectedNode);
        }
    }, [state]);

    return (<>
            <div ref={topRef} style={dnStyle} className='zToolBoxBoxSelected top'/>
            <div ref={bottomRef} style={dnStyle} className='zToolBoxBoxSelected bottom'/>
            <div ref={leftRef} style={dnStyle} className='zToolBoxBoxSelected left'/>
            <div ref={rightRef} style={dnStyle} className='zToolBoxBoxSelected right'/>
        </>
    )
}
