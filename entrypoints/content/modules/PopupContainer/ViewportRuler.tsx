import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { ZINDEX_RULER_WRAPPER, ZINDEX_RULER_WRAPPER_LABEL } from "@entrypoints/shared/constant/zIndex.ts";

export const breakpoints = [
  { label: "📱 Small phone (240px)", value: 240 }, // Початок шкали
  { label: "📱 Phone (320px)", value: 320 }, // Відповідає першій великій мітці
  { label: "📱 Phone (360px)", value: 360 }, // Часто використовується як стандарт Android
  { label: "📱 Large phone (425px)", value: 425 }, // Сучасні великі телефони
  { label: "📱📟 Foldable / Small tablet (600px)", value: 600 }, // Помітка є на шкалі
  { label: "📟 Tablet (768px)", value: 768 }, // Дуже розповсюджене значення
  { label: "💻 Small laptop (1024px)", value: 1024 }, // Початок ноутбуків
  { label: "💻 Laptop (1280px)", value: 1280 }, // Частий breakpoint для десктопів
  { label: "💻 Large desktop (1366px)", value: 1366 }, // Часта роздільна здатність ноутбуків
  { label: "🖥️ Desktop HD (1600px)", value: 1600 }, // Закінчується шкала на зображенні
  // Додаткові, які виходять за межі зображення:
  { label: "🖥️ Full HD (1920px)", value: 1920 },
  { label: "🖥️ WQHD / 2K (2560px)", value: 2560 },
];

const RulerWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 27px;
  width: 100%;
  background: #f0f0f0;
  border-bottom: 1px solid #ccc;
  z-index: ${ZINDEX_RULER_WRAPPER};
  font-family: monospace;
`;

const Tick = styled.div<{ $x: number; $height: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: 0;
  width: 1px;
  height: ${({ $height }) => $height}px;
  background-color: #444;
`;

const TooltipLabelSizeLabel = styled.div`
  display: none;
`;

const TooltipLabelSize = styled.div`
  display: block;
`;

const TooltipLabel = styled.div<{ $x: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: 22px;
  transform: translateX(-50%);
  padding: 4px 6px;
  background-color: #000;
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  user-select: none;
  text-align: center;
  transition: background-color 0.2s ease;

  &::before {
    content: "";
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: transparent transparent #000 transparent; /* нижній край кольоровий */
    transition: border-color 0.2s ease;
  }

  &:hover {
    background-color: #007bff;
    z-index: ${ZINDEX_RULER_WRAPPER_LABEL};
  }

  &:hover::before {
    border-color: transparent transparent #007bff transparent;
  }

  &:hover ${TooltipLabelSizeLabel} {
    display: block;
  }

  &:hover ${TooltipLabelSize} {
    display: none;
  }
`;

const CurrentSizeLabel = styled.div`
  position: fixed;
  top: 0;
  left: 8px;
  padding: 4px 8px;
  font-size: 12px;
  background: #333;
  color: #fff;
  border-radius: 0px 0px 4px 4px;
  z-index: ${ZINDEX_RULER_WRAPPER};
  user-select: none;
`;

export const ViewportRuler = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLabelClick = (width: number) => {
    try {
      // Працює тільки у відкритих popup-вікнах
      // window.resizeTo(width, window.innerHeight);

      ExtensionStorageManager.changeCurrentWindowSize(width);
    } catch (e) {
      console.warn("window.resizeTo is not available in this context");
    }
  };

  const ticks = Array.from({ length: windowWidth }, (_, i) => i).filter((i) => i % 5 === 0);

  return (
    <>
      <RulerWrapper>
        {ticks.map((x) => {
          let height = 6;
          if (x % 100 === 0) height = 16;
          else if (x % 50 === 0) height = 12;
          else if (x % 10 === 0) height = 8;
          return <Tick key={x} $x={x} $height={height} />;
        })}
        {breakpoints.map(({ label, value }) => (
          <TooltipLabel key={value} $x={value} onClick={() => handleLabelClick(value)}>
            <TooltipLabelSizeLabel> {label}</TooltipLabelSizeLabel>
            <TooltipLabelSize>{value}px</TooltipLabelSize>
          </TooltipLabel>
        ))}
      </RulerWrapper>
      <CurrentSizeLabel>Current: {windowWidth}px</CurrentSizeLabel>
    </>
  );
};
