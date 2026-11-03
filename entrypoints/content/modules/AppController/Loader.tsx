// Loader.tsx
import React from "react";
import styled, { keyframes } from "styled-components";

// Bar bounce animation
const bounce = keyframes`
    0%, 100% {
        transform: scaleY(1);
    }
    50% {
        transform: scaleY(1.4);
    }
`;

// Colour change animation (blue → yellow → black → red)
const colorChange = keyframes`
    0% {
        background: #1890ff;
    }
    40% {
        background: #ffe066;
    }
    50% {
        background: #000000;
    }
    70% {
        background: #ff3b3b;
    }
    100% {
        background: #1890ff;
    }
`;


const BarsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
`;

const Bar = styled.div<{ delay: number }>`
    width: 8px;
    height: 100%;
    margin: 0 4px;
    border-radius: 4px;
    // Two animations: bounce and colorChange
    animation: ${bounce} 0.4s infinite, // bounce, repeats quickly
    ${colorChange} 1.5s infinite; // colour change, 1.5 s cycle
    animation-delay: ${props => props.delay}s, // per-bar delay for bounce, so the wave looks alive
    ${props => props.delay * 1.4}s; // longer delay for colorChange, so the colours don't line up
`;

const Loader: React.FC = () => (
    <BarsWrapper>
        <Bar delay={0}/>
        <Bar delay={0.08}/>
        <Bar delay={0.16}/>
        <Bar delay={0.32}/>
        <Bar delay={0.48}/>
    </BarsWrapper>
);

export default Loader;
