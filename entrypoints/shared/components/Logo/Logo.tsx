import React from "react";
import styled from "styled-components";

import HoverIcon from "./64.png";

export const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    gap: 6px;
    margin-right: 12px;

    img {
        width: 20px;
        height: 20px;
        margin-right: 5px;
    }
`;


export const Logo = () => {
    return (
        <LogoContainer>
            <img src={HoverIcon} alt=""/>
            Inspector
        </LogoContainer>
    )
}