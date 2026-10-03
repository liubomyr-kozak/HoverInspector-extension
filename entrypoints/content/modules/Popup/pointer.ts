/** Last pointer position in the top viewport, for elements too tall to put the tooltip above or below them */
export const lastPointer = { x: -1, y: -1 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "mousemove",
    (e) => {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    },
    { capture: true, passive: true },
  );
}

/** For pointer moves inside iframes, which the top window's listener never sees (already mapped to the top viewport) */
export function setLastPointer(x: number, y: number) {
  lastPointer.x = x;
  lastPointer.y = y;
}
