interface Position {
  x: number;
  y: number;
}

interface BoundaryCheckOptions {
  containerWidth?: number;
  containerHeight?: number;
  windowWidth?: number;
  windowHeight?: number;
}

/**
 * Apply boundary checking to ensure the position stays within window bounds
 */
export const applyBoundaryCheck = (
  position: Position,
  options: BoundaryCheckOptions = {}
): Position => {
  const {
    containerWidth = 120,
    containerHeight = 40,
    windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,
  } = options;

  const adjustedX = Math.max(0, Math.min(position.x, windowWidth - containerWidth));
  const adjustedY = Math.max(0, Math.min(position.y, windowHeight - containerHeight));

  return {
    x: adjustedX,
    y: adjustedY,
  };
};

/**
 * Calculate new position based on delta movement
 */
export const calculateNewPosition = (
  currentPosition: Position,
  delta: Position
): Position => {
  return {
    x: currentPosition.x + delta.x,
    y: currentPosition.y + delta.y,
  };
};