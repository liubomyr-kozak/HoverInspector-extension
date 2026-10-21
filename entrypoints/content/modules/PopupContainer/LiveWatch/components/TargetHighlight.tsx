import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { findElementByXPaths } from "../utils/dom";

interface TargetHighlightProps {
  xpath: string;
  alternativeXpaths?: string[];
  /** Scroll the element into view when it is outside the viewport */
  scrollIntoView?: boolean;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Re-measures now and then: the page may move the element without scrolling (animations, late content) */
const REMEASURE_MS = 500;
const PADDING = 3;

const Frame = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 1099;
  border: 2px solid ${tokens.color.primary};
  border-radius: ${tokens.radius.md}px;
  background: rgba(37, 99, 235, 0.08);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.18);
  transition:
    top 0.12s ease,
    left 0.12s ease,
    width 0.12s ease,
    height 0.12s ease;
`;

/**
 * Outlines a page element from inside the shadow root, without touching the page's DOM or styles
 */
export const TargetHighlight: React.FC<TargetHighlightProps> = ({ xpath, alternativeXpaths, scrollIntoView }) => {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const element = findElementByXPaths(xpath, alternativeXpaths);
      if (!element) {
        setBox(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setBox((previous) =>
        previous &&
        previous.top === rect.top &&
        previous.left === rect.left &&
        previous.width === rect.width &&
        previous.height === rect.height
          ? previous
          : { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    if (scrollIntoView) {
      const element = findElementByXPaths(xpath, alternativeXpaths);
      const rect = element?.getBoundingClientRect();
      if (element && rect && (rect.bottom < 0 || rect.top > window.innerHeight)) {
        element.scrollIntoView({ block: "center", inline: "nearest" });
      }
    }
    measure();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const timer = window.setInterval(schedule, REMEASURE_MS);
    return () => {
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.clearInterval(timer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [xpath, alternativeXpaths, scrollIntoView]);

  if (!box) return null;
  return (
    <Frame
      aria-hidden="true"
      style={{
        top: box.top - PADDING,
        left: box.left - PADDING,
        width: box.width + PADDING * 2,
        height: box.height + PADDING * 2,
      }}
    />
  );
};
