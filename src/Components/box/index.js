import {useStateValue} from "../../appState";
import React, {useEffect, useRef} from "react";
import {setMargin, setPadding} from "./utils";
import {Selected} from "./components/Selected";
import {Hovered} from "./components/Hovered";
import {DistanceAndLebel} from "./components/DistanceAndLebel";

export const Box = () => {
    const [state] = useStateValue();
    const paddingRef = useRef();
    const marginRef = useRef();


    useEffect(() => {
        if (state.type === "hover") {
            setPadding(paddingRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
            setMargin(marginRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
        }
    }, [state]);

    return (
        <>
            <Selected/>
            <Hovered/>
            <DistanceAndLebel/>
            <div ref={paddingRef} className="zToolTooltipPadding"/>
            <div ref={marginRef} className="zToolTooltipMargin"/>
        </>
    )
}