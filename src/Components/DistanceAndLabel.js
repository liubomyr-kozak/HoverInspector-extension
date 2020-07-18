import {useStateValue} from "../core/appState";
import React, {useEffect} from "react";
import {
    calculateDistance,
    dispatchDistanceLineAndLabel,
    toggleLinesAndLabels,
    use4SideNodeRef
} from "../core/utils";

import {DOMModule} from "../core/dom";

const dnStyle = {
    display: "none"
}

export const DistanceAndLabel = () => {
    const sideNodeRef = use4SideNodeRef()
    const [state, dispatch] = useStateValue();
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

    useEffect(() => {
        DOMModule.onStateChange(state);

        if (state.type === 'hover') {
            let distance = calculateDistance(
                state.clientRectHoveredNode,
                state.clientRectSelectedNode
            );

            if (distance) {
                dispatchDistanceLineAndLabel(sideNodeRef, distance);
                dispatch({type: "labelRendered"})
            }
        }

        if (state.type === 'select') {
            toggleLinesAndLabels([topRef, bottomRef, leftRef, rightRef], 'hide');
        }


        if (state.type === 'scroll' || state.type === 'scrollWithoutSelected') {
            if (!state.clientRectHoveredNode) {
                return;
            }

            let distance = calculateDistance(
                state.clientRectHoveredNode,
                state.clientRectSelectedNode
            );

            if (distance) {
                dispatchDistanceLineAndLabel(sideNodeRef, distance);
                dispatch({type: "labelRendered"})
            }
        }
    }, [state]);

    return (<>
            <div style={dnStyle} ref={topRef} className='zToolDistanceLine top'>
                <span className="zToolDistanceLineLabel"/>
            </div>
            <div style={dnStyle} ref={bottomRef} className='zToolDistanceLine bottom'>
                <span className="zToolDistanceLineLabel"/>
            </div>
            <div style={dnStyle} ref={leftRef} className='zToolDistanceLine left'>
                <span className="zToolDistanceLineLabel"/>
            </div>
            <div style={dnStyle} ref={rightRef} className='zToolDistanceLine right'>
                <span className="zToolDistanceLineLabel"/>
            </div>
        </>
    )
}