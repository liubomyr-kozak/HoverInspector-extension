export const DEFAULT_NOTE_WIDTH = 250;
export const DEFAULT_NOTE_HEIGHT = 150;

// Small offset derived from the note id so notes without a saved position don't stack exactly
const getStagger = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 6) * 24;
};

/**
 * Default page position for a note: top right of the visible area, away from the extension panel
 */
export const getDefaultNotePosition = (seed: string, width = DEFAULT_NOTE_WIDTH) => {
  const stagger = getStagger(seed);
  return {
    x: Math.max(0, window.scrollX + window.innerWidth - width - 40 - stagger),
    y: window.scrollY + 120 + stagger,
  };
};

type Rect = { x: number; y: number; width: number; height: number };

const NOTE_GAP = 12;
const SCAN_STEP = 24;

/** Page rects of the sticky notes currently shown on the page. */
export const getVisibleNoteRects = (): Rect[] => {
  const root = document.querySelector("hover-inspector")?.shadowRoot;
  if (!root) return [];
  return [...root.querySelectorAll(".hover-inspector-visible-note .visible-note-view")]
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({ x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height }));
};

/**
 * Page position for a new sticky note: the first spot in the visible area, scanning from the top right
 * (away from the extension panel) down and then leftwards, that doesn't overlap a note already shown.
 * When the visible area is full, falls back to a cascade below/left of the default spot.
 */
export const getFreeNotePosition = (
  width = DEFAULT_NOTE_WIDTH,
  height = DEFAULT_NOTE_HEIGHT,
  occupied: Rect[] = getVisibleNoteRects(),
) => {
  const left = window.scrollX + 16;
  const right = Math.max(left, window.scrollX + window.innerWidth - width - 40);
  const top = window.scrollY + 120;
  const bottom = Math.max(top, window.scrollY + window.innerHeight - height - 16);

  const overlaps = (x: number, y: number) =>
    occupied.some(
      (r) =>
        x < r.x + r.width + NOTE_GAP &&
        x + width + NOTE_GAP > r.x &&
        y < r.y + r.height + NOTE_GAP &&
        y + height + NOTE_GAP > r.y,
    );

  for (let x = right; x >= left; x -= width + NOTE_GAP) {
    for (let y = top; y <= bottom; y += SCAN_STEP) {
      if (!overlaps(x, y)) return { x: Math.max(0, Math.round(x)), y: Math.round(y) };
    }
  }

  const step = (occupied.length % 8) * SCAN_STEP;
  return { x: Math.max(0, Math.round(right - step)), y: Math.round(top + step) };
};
