import React from "react";
import styled, { keyframes } from "styled-components";

// Генеруємо box-shadow зі 1000+ точок для кожного шару зірок
const generateBoxShadows = (count) => {
  const shadows = Array.from({ length: count })
    .map(() => `${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`)
    .join(", ");
  return shadows;
};

const animStar = keyframes`
    from {
        transform: translateY(0px);
    }
    to {
        transform: translateY(-2000px);
    }
`;

const StarLayer = styled.div<{
  shadows: string;
  duration: number;
  style?: React.CSSProperties;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: ${(props) => props.shadows};
  animation: ${animStar} ${(props) => props.duration}s linear infinite;

  &::after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: inherit;
    height: inherit;
    background: transparent;
    box-shadow: ${(props) => props.shadows};
  }
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  z-index: 0;
`;

const StarFieldBackground = () => {
  const smallShadows = generateBoxShadows(700);
  const mediumShadows = generateBoxShadows(200);
  const bigShadows = generateBoxShadows(100);

  return (
    <Background>
      <StarLayer shadows={smallShadows} duration={50} style={{ width: "1px", height: "1px" }} />
      <StarLayer shadows={mediumShadows} duration={100} style={{ width: "2px", height: "2px" }} />
      <StarLayer shadows={bigShadows} duration={150} style={{ width: "3px", height: "3px" }} />
    </Background>
  );
};

export default StarFieldBackground;
