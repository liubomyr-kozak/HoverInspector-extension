import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { CSSSnapshot, SnapshotNode } from "./types";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";

/**
 * Interface for element position information
 */
interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  position: string;
  display: string;
}

interface PhantomOverlayProps {
  snapshotA: CSSSnapshot;
  snapshotB: CSSSnapshot;
  visible: boolean;
  onElementSelect?: (elementPath: string) => void;
}

// Styled components for the overlay
const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 2147483645; // Just below the extension UI
  transform: translateZ(0); // Force hardware acceleration
  will-change: transform; // Optimize for animations
  contain: layout paint style; // Improve performance
`;

const PhantomBlock = styled.div<{
  changeType: "added" | "removed" | "moved-from" | "moved-to";
}>`
  position: absolute;
  border: 2px dashed;
  border-color: ${(props) =>
    props.changeType === "added"
      ? "#137333"
      : props.changeType === "removed"
        ? "#c5221f"
        : props.changeType === "moved-from"
          ? "#ea8600"
          : "#1a73e8"};
  background-color: ${(props) =>
    props.changeType === "added"
      ? "rgba(19, 115, 51, 0.1)"
      : props.changeType === "removed"
        ? "rgba(197, 34, 31, 0.1)"
        : props.changeType === "moved-from"
          ? "rgba(234, 134, 0, 0.1)"
          : "rgba(26, 115, 232, 0.1)"};
  pointer-events: auto;
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: ${(props) =>
    props.changeType === "added"
      ? "#137333"
      : props.changeType === "removed"
        ? "#c5221f"
        : props.changeType === "moved-from"
          ? "#ea8600"
          : "#1a73e8"};
`;

const WarningBlock = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  z-index: 2147483646;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border-left: 4px solid #f4b400;
`;

const MovementArrow = styled.div<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}>`
  position: absolute;
  left: ${(props) => props.fromX}px;
  top: ${(props) => props.fromY}px;
  width: ${(props) => Math.max(20, Math.abs(props.toX - props.fromX))}px;
  height: ${(props) => Math.max(20, Math.abs(props.toY - props.fromY))}px;
  pointer-events: none;
  z-index: 2147483645;

  &::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-top: 2px dashed #1a73e8;
    opacity: 0.7;
    transform: ${(props) => {
      const angle = (Math.atan2(props.toY - props.fromY, props.toX - props.fromX) * 180) / Math.PI;
      return `rotate(${angle}deg)`;
    }};
    transform-origin: left center;
  }

  &::after {
    content: "";
    position: absolute;
    right: -5px;
    top: 50%;
    width: 10px;
    height: 10px;
    border-right: 3px solid #1a73e8;
    border-top: 3px solid #1a73e8;
    opacity: 0.9;
    transform: ${(props) => {
      const angle = (Math.atan2(props.toY - props.fromY, props.toX - props.fromX) * 180) / Math.PI;
      return `translateY(-50%) rotate(${angle + 45}deg)`;
    }};
  }
`;

const InfoLabel = styled.div`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
`;

export const PhantomOverlay: React.FC<PhantomOverlayProps> = ({ snapshotA, snapshotB, visible, onElementSelect }) => {
  const [phantomElements, setPhantomElements] = useState<
    Array<{
      path: string;
      type: "added" | "removed" | "moved-from" | "moved-to";
      position: ElementPosition;
      label?: string;
    }>
  >([]);

  const [movementArrows, setMovementArrows] = useState<
    Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }>
  >([]);

  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Create a ref for the portal container
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  // Create a portal container in the document body on mount
  useEffect(() => {
    // Check if the portal container already exists

    // @ts-ignore
    const body = (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!;

    let container = body.querySelector("#phantom-overlay-portal");

    if (!container) {
      // Create a new container if it doesn't exist
      container = document.createElement("div");
      container.id = "phantom-overlay-portal";
      body.appendChild(container);
    }

    portalContainerRef.current = container as HTMLDivElement;

    // Clean up on unmount
    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // Toggle visibility of the portal container
  useEffect(() => {
    if (portalContainerRef.current) {
      portalContainerRef.current.style.display = visible ? "block" : "none";
    }
  }, [visible]);

  // Helper function to get positions from snapshot
  const getPositionsFromSnapshot = (snapshot: CSSSnapshot): Record<string, ElementPosition> | undefined => {
    // For backward compatibility
    if ((snapshot as any).positions) {
      return (snapshot as any).positions;
    }
    
    // Generate positions from snapshot.root
    if (snapshot.root) {
      const result: Record<string, ElementPosition> = {};
      
      const processNode = (node: SnapshotNode, path: string[] = []) => {
        const currentPath = path.join(' > ');
        
        result[currentPath] = {
          top: node.bounds.top,
          left: node.bounds.left,
          width: node.bounds.width,
          height: node.bounds.height,
          zIndex: parseInt(node.styles['z-index'] || '0'),
          position: node.styles['position'] || 'static',
          display: node.styles['display'] || 'block'
        };
        
        // Process children
        for (const child of node.children) {
          processNode(child, [...path, child.id]);
        }
      };
      
      processNode(snapshot.root, [snapshot.root.id]);
      return result;
    }
    
    return undefined;
  };

  // Calculate phantom elements when snapshots or visibility changes
  useEffect(() => {
    const positionsA = getPositionsFromSnapshot(snapshotA);
    const positionsB = getPositionsFromSnapshot(snapshotB);
    
    if (!visible || !snapshotA || !snapshotB || !positionsA || !positionsB) {
      setPhantomElements([]);
      setMovementArrows([]);
      return;
    }

    const newPhantomElements: Array<{
      path: string;
      type: "added" | "removed" | "moved-from" | "moved-to";
      position: ElementPosition;
      label?: string;
    }> = [];

    const newMovementArrows: Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }> = [];

    // Get all unique element paths from both snapshots
    const allPaths = new Set([...Object.keys(positionsA), ...Object.keys(positionsB)]);

    // Limit the number of elements to process to prevent performance issues
    const MAX_PHANTOM_ELEMENTS = 1535;

    // Convert to array and prioritize elements
    const pathsArray = Array.from(allPaths);

    // Sort paths to prioritize important elements (larger elements first)
    const sortedPaths = pathsArray.sort((pathA, pathB) => {
      const posA = positionsA[pathA] || positionsB[pathA];
      const posB = positionsA[pathB] || positionsB[pathB];

      if (!posA || !posB) return 0;

      // Calculate element area as a priority metric
      const areaA = posA.width * posA.height;
      const areaB = posB.width * posB.height;

      // Sort by area (larger elements first)
      return areaB - areaA;
    });

    // Process each element (limit to MAX_PHANTOM_ELEMENTS)
    // Only show differences between snapshots
    sortedPaths.slice(0, MAX_PHANTOM_ELEMENTS).forEach((path) => {
      const positionA = positionsA[path];
      const positionB = positionsB[path];

      // Element exists only in snapshot A (removed)
      if (positionA && !positionB) {
        // Skip elements with zero dimensions or display:none
        if (positionA.width > 0 && positionA.height > 0 && positionA.display !== "none") {
          newPhantomElements.push({
            path,
            type: "removed",
            position: positionA,
            label: "Removed",
          });
        }
      }
      // Element exists only in snapshot B (added)
      else if (!positionA && positionB) {
        // Skip elements with zero dimensions or display:none
        if (positionB.width > 0 && positionB.height > 0 && positionB.display !== "none") {
          newPhantomElements.push({
            path,
            type: "added",
            position: positionB,
            label: "Added",
          });
        }
      }
      // Element exists in both snapshots, check if it moved
      else if (positionA && positionB) {
        // Skip elements with zero dimensions or display:none
        if (
          positionA.width > 0 &&
          positionA.height > 0 &&
          positionA.display !== "none" &&
          positionB.width > 0 &&
          positionB.height > 0 &&
          positionB.display !== "none"
        ) {
          const topDiff = positionB.top - positionA.top;
          const leftDiff = positionB.left - positionA.left;
          const widthDiff = positionB.width - positionA.width;
          const heightDiff = positionB.height - positionA.height;

          // Calculate total change significance
          const positionChange = Math.sqrt(Math.pow(topDiff, 2) + Math.pow(leftDiff, 2));
          const sizeChange = Math.sqrt(Math.pow(widthDiff, 2) + Math.pow(heightDiff, 2));

          // Check if position or size changed significantly
          // For very small elements, we need a higher threshold to avoid noise
          const minSize = Math.min(positionA.width, positionA.height, positionB.width, positionB.height);
          const positionThreshold = minSize < 20 ? 3 : 1; // Higher threshold for small elements

          // Only show elements with significant changes
          if (
            positionChange > positionThreshold ||
            sizeChange > 1 ||
            // Always show if the change is proportionally significant
            positionChange / minSize > 0.1 || // Position changed by more than 10% of element size
            Math.abs(widthDiff) / positionA.width > 0.1 || // Width changed by more than 10%
            Math.abs(heightDiff) / positionA.height > 0.1 // Height changed by more than 10%
          ) {
            // Calculate distance moved
            const distance = Math.sqrt(Math.pow(leftDiff, 2) + Math.pow(topDiff, 2));
            const distanceFormatted = Math.round(distance);

            // Calculate size change percentage
            const areaA = positionA.width * positionA.height;
            const areaB = positionB.width * positionB.height;
            const areaChange = ((areaB - areaA) / areaA) * 100;
            const areaChangeFormatted = Math.round(areaChange);

            // Direction of movement
            const directionH = leftDiff > 0 ? "right" : leftDiff < 0 ? "left" : "";
            const directionV = topDiff > 0 ? "down" : topDiff < 0 ? "up" : "";
            const direction =
              directionH && directionV ? `${directionV}-${directionH}` : directionH || directionV || "same position";

            // Add phantom for original position
            newPhantomElements.push({
              path,
              type: "moved-from",
              position: positionA,
              label: `Original position (moved ${distanceFormatted}px ${direction})`,
            });

            // Add phantom for new position
            newPhantomElements.push({
              path,
              type: "moved-to",
              position: positionB,
              label: `New position (size ${areaChangeFormatted > 0 ? "+" : ""}${areaChangeFormatted}%)`,
            });

            // Add movement arrow
            newMovementArrows.push({
              id: path,
              fromX: positionA.left + positionA.width / 2,
              fromY: positionA.top + positionA.height / 2,
              toX: positionB.left + positionB.width / 2,
              toY: positionB.top + positionB.height / 2,
            });
          }
        }
      }
    });

    // Set warning state if we hit the element limit
    if (allPaths.size > MAX_PHANTOM_ELEMENTS) {
      setShowWarning(true);
      setWarningMessage(
        `Warning: Only showing ${MAX_PHANTOM_ELEMENTS} of ${allPaths.size} changed elements (prioritizing larger elements)`,
      );
    } else {
      setShowWarning(false);
      setWarningMessage("");
    }

    setPhantomElements(newPhantomElements);
    setMovementArrows(newMovementArrows);
  }, [snapshotA, snapshotB, visible]);

  if (!visible || !portalContainerRef.current) {
    return null;
  }

  // Use createPortal to render the overlay in the root DOM
  return createPortal(
    <OverlayContainer>
      {/* Render phantom blocks */}
      {phantomElements.map((element, index) => (
        <Tooltip key={`${element.path}-${element.type}-${index}`} content={`${element.label}: ${element.path}`}>
          <PhantomBlock
            changeType={element.type}
            style={{
              left: `${element.position.left}px`,
              top: `${element.position.top}px`,
              width: `${element.position.width}px`,
              height: `${element.position.height}px`,
              zIndex: element.position.zIndex,
            }}
            onClick={() => onElementSelect && onElementSelect(element.path)}
          >
            {element.type === "added" && "+"}
            {element.type === "removed" && "−"}
            {element.type === "moved-from" && "◯"}
            {element.type === "moved-to" && "●"}
          </PhantomBlock>
        </Tooltip>
      ))}

      {/* Render movement arrows */}
      {movementArrows.map((arrow, index) => (
        <MovementArrow
          key={`arrow-${arrow.id}-${index}`}
          fromX={arrow.fromX}
          fromY={arrow.fromY}
          toX={arrow.toX}
          toY={arrow.toY}
        />
      ))}

      {/* Render warning if needed */}
      {showWarning && <WarningBlock>⚠️ {warningMessage}</WarningBlock>}
    </OverlayContainer>,
    portalContainerRef.current,
  );
};
