import {useStateValue} from "./core/appState";
import React, {useEffect, useRef} from "react";
import {setMargin, setPadding} from "./core/utils";
import {SelectedBox} from "./Components/SelectedBox";
import {HoveredLinesArea} from "./Components/HoveredLinesArea";
import {DistanceAndLebel} from "./Components/DistanceAndLebel";
import {Popup} from "./Components/Popup";

export const MainLayer = () => {
    const [state] = useStateValue();
    const paddingRef = useRef();
    const marginRef = useRef();


    useEffect(() => {
        if (state.type === "hover") {
            setPadding(paddingRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
            setMargin(marginRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
        }


        if (state.type === "scrollWithoutSelected") {
            setPadding(paddingRef.current, state.clientRectSelectedNode, state.hoverNodeParams);
            setMargin(marginRef.current, state.clientRectSelectedNode, state.hoverNodeParams);
        }

        if (state.type === "scroll") {
            setPadding(paddingRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
            setMargin(marginRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
        }
    }, [state]);

    return (
        <>
            <SelectedBox/>
            <HoveredLinesArea/>
            <DistanceAndLebel/>
            <Popup/>
            <div ref={paddingRef} className="zToolTooltipPadding"/>
            <div ref={marginRef} className="zToolTooltipMargin"/>
        </>
    )
}