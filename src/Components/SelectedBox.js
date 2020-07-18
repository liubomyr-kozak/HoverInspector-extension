import React, {useEffect} from "react";
import {useStateValue} from "../core/appState";
import {setParamsToNode, use4SideNodeRef} from "../core/utils";

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
            <div ref={topRef} className='zToolBoxBoxSelected top'/>
            <div ref={bottomRef} className='zToolBoxBoxSelected bottom'/>
            <div ref={leftRef} className='zToolBoxBoxSelected left'/>
            <div ref={rightRef} className='zToolBoxBoxSelected right'/>
        </>
    )
}
