import {useStateValue} from "../../../appState";
import React, {useEffect} from "react";
import {
    calculateDistance,
    dispatchDistanceLineAndLabel,
    toggleLinesAndLabels,
    use4SideNodeRef
} from "../utils";

import {DOMModule} from "../../dom";

export const DistanceAndLebel = () => {
    const sideNodeRef = use4SideNodeRef()
    const [state] = useStateValue();
    const {topRef, bottomRef, leftRef, rightRef} = sideNodeRef

    useEffect(() => {
        DOMModule.onStateChange(state);

        if (state.type === 'hover') {
            let distance = calculateDistance(
                DOMModule.getBoundingElRect('hovered'),
                DOMModule.getBoundingElRect('selected')
            );

            if (distance) {
                dispatchDistanceLineAndLabel(sideNodeRef, distance);
            }
        }

        if (state.type === 'select') {
            toggleLinesAndLabels([topRef, bottomRef, leftRef, rightRef], 'hide');
        }


        if (state.type === 'scroll') {
            if (!DOMModule.getBoundingElRect('hovered')) {
                return;
            }

            let distance = calculateDistance(
                DOMModule.getBoundingElRect('hovered'),
                DOMModule.getBoundingElRect('selected')
            );

            if (distance) {
                dispatchDistanceLineAndLabel(sideNodeRef, distance);
            }
        }
    }, [state]);

    return (<>
            <div ref={topRef} className='zToolDistanceLine top'>
                <span className="zToolDistanceLineLabel"/>
            </div>
            <div ref={bottomRef} className='zToolDistanceLine bottom'>
                <span className="zToolDistanceLineLabel"/>
            </div>
            <div ref={leftRef} className='zToolDistanceLine left'>
                <span className="zToolDistanceLineLabel"/>
            </div>
            <div ref={rightRef} className='zToolDistanceLine right'>
                <span className="zToolDistanceLineLabel"/>
            </div>
        </>
    )
}