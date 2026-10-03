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
