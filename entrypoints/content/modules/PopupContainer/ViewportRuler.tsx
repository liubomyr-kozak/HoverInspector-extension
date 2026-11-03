import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { ZINDEX_RULER_WRAPPER, ZINDEX_RULER_WRAPPER_LABEL } from "@entrypoints/shared/constant/zIndex.ts";

export const breakpoints = [
  { label: "📱 Small phone (240px)", value: 240 }, // Start of the scale
  { label: "📱 Phone (320px)", value: 320 }, // Matches the first major tick
  { label: "📱 Phone (360px)", value: 360 }, // Common Android baseline
  { label: "📱 Large phone (425px)", value: 425 }, // Modern large phones
  { label: "📱📟 Foldable / Small tablet (600px)", value: 600 }, // Marked on the scale
  { label: "📟 Tablet (768px)", value: 768 }, // Very common value
  { label: "💻 Small laptop (1024px)", value: 1024 }, // Smallest laptops
  { label: "💻 Laptop (1280px)", value: 1280 }, // Common desktop breakpoint
  { label: "💻 Large desktop (1366px)", value: 1366 }, // Common laptop resolution
  { label: "🖥️ Desktop HD (1600px)", value: 1600 }, // End of the scale in the image
  // Extra sizes beyond the image:
  { label: "🖥️ Full HD (1920px)", value: 1920 },
  { label: "🖥️ WQHD / 2K (2560px)", value: 2560 },
];

/**
 * Asks the background to resize the browser window so the page gets `width` px, and resolves with the width
 * the page actually ends up with: Chrome won't make a window narrower than about 500px or wider than the screen.
 */
export const resizeViewportTo = async (width: number): Promise<number> => {
  await ExtensionStorageManager.changeCurrentWindowSize(width);
  await new Promise((resolve) => setTimeout(resolve, 700));
  return window.innerWidth;
};

export const describeResizeMiss = (requested: number, actual: number) =>
  Math.abs(actual - requested) <= 2
    ? ""
    : `Asked for ${requested}px, but the page is ${actual}px wide: Chrome can't make the window that ${
        requested < actual ? "narrow" : "wide"
      }.${requested < actual ? " For phone sizes use DevTools device mode (Ctrl+Shift+M)." : ""}`;

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

const TooltipLabel = styled.button<{ $x: number }>`
  position: absolute;
  border: none;
  margin: 0;
  font-family: inherit;
  line-height: normal;
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
    border-color: transparent transparent #000 transparent; /* coloured bottom edge */
    transition: border-color 0.2s ease;
  }

  &:hover,
  &:focus-visible {
    background-color: #2563eb;
    z-index: ${ZINDEX_RULER_WRAPPER_LABEL};
  }

  &:hover::before,
  &:focus-visible::before {
    border-color: transparent transparent #2563eb transparent;
  }

  &:hover ${TooltipLabelSizeLabel}, &:focus-visible ${TooltipLabelSizeLabel} {
    display: block;
  }

  &:hover ${TooltipLabelSize}, &:focus-visible ${TooltipLabelSize} {
    display: none;
  }
`;

// Top right, clear of the feature panel that usually sits on the left
const ResizeMissLabel = styled.div`
  position: fixed;
  top: 27px;
  right: 8px;
  max-width: 420px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  background: #fff7e6;
  color: #874d00;
  border: 1px solid #ffd591;
  border-radius: 0 0 4px 4px;
  z-index: ${ZINDEX_RULER_WRAPPER};
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

  const [resizeMiss, setResizeMiss] = useState("");

  useEffect(() => {
    if (!resizeMiss) return;
    const timer = setTimeout(() => setResizeMiss(""), 6000);
    return () => clearTimeout(timer);
  }, [resizeMiss]);

  const handleLabelClick = async (width: number) => {
    try {
      const actual = await resizeViewportTo(width);
      setResizeMiss(describeResizeMiss(width, actual));
    } catch (e) {
      setResizeMiss("The window could not be resized.");
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
          <TooltipLabel
            key={value}
            type="button"
            $x={value}
            onClick={() => handleLabelClick(value)}
            aria-label={`Resize the window to ${value}px (${label.replace(/^[^A-Za-z]+/, "").replace(/\s*\(.*\)$/, "")})`}
          >
            <TooltipLabelSizeLabel> {label}</TooltipLabelSizeLabel>
            <TooltipLabelSize>{value}px</TooltipLabelSize>
          </TooltipLabel>
        ))}
      </RulerWrapper>
      <CurrentSizeLabel>Current: {windowWidth}px</CurrentSizeLabel>
      {resizeMiss && <ResizeMissLabel role="status">{resizeMiss}</ResizeMissLabel>}
    </>
  );
};
