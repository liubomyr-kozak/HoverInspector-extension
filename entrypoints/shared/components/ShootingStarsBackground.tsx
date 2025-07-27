import React from "react";
import styled, { keyframes } from "styled-components";

const tail = keyframes`
    0% {
        width: 0;
    }
    30% {
        width: 100px;
    }
    100% {
        width: 0;
    }
`;

const shining = keyframes`
    0% {
        width: 0;
    }
    50% {
        width: 30px;
    }
    100% {
        width: 0;
    }
`;

const shooting = keyframes`
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(300px);
    }
`;

const Background = styled.div`
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Anton", sans-serif;
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
`;

const Night = styled.div`
  position: relative;
  width: 80%;
  height: 500%;
  transform: rotateZ(45deg);
`;

const ShootingStar = styled.div`
  position: absolute;
  height: 2px;
  background: linear-gradient(-45deg, rgba(95, 145, 255, 1), rgba(0, 0, 255, 0));
  border-radius: 999px;
  filter: drop-shadow(0 0 6px rgba(105, 155, 255, 1));
  animation:
    ${tail} 3s ease-in-out infinite,
    ${shooting} 3s ease-in-out infinite;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: calc(50% - 1px);
    right: 0;
    height: 2px;
    background: linear-gradient(-45deg, rgba(0, 0, 255, 0), rgba(95, 145, 255, 1), rgba(0, 0, 255, 0));
    border-radius: 100%;
    animation: ${shining} 3s ease-in-out infinite;
  }

  &::after {
    transform: translateX(50%) rotateZ(-45deg);
  }

  &::before {
    transform: translateX(50%) rotateZ(45deg);
  }
`;

const generateStars = (count = 20) => {
  return Array.from({ length: count }, (_, i) => {
    // const delay = Math.random() * 10 + 's';
    // const top = 50 - (Math.random() * 400 - 200) / window.innerHeight * 100 + '%';
    // const left = 50 - (Math.random() * 300) / window.innerWidth * 100 + '%';

    const delay = Math.random() * 10 + "s";
    const top = `${Math.random() * 60 + 20}%`; // тільки 20%-80%
    const left = `${Math.random() * 50}%`; // тільки зліва

    return (
      <ShootingStar
        key={i}
        style={{
          top,
          left,
          animationDelay: delay,
        }}
      />
    );
  });
};

const ShootingStarsBackground = () => {
  return (
    <Background>
      <Night>{generateStars(20)}</Night>
    </Background>
  );
};

export default ShootingStarsBackground;
