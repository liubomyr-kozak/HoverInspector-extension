import React, { useCallback, useEffect, useRef, useState } from "react";
import { renderNoteMarkup } from "../utils/noteMarkup";
import { useDispatch } from "react-redux";
import { findMatchingLocation } from "@entrypoints/background/services/notes.ts";
import { updateNote } from "@entrypoints/background/store/notesActionsSlice.ts";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal";
import styled from "styled-components";
import { Note as NoteType, NoteLocationCoordinates, NoteViewType } from "@entrypoints/shared/types/notes.ts";
import { triggerRefresh } from "@entrypoints/content/store/notes/notes.slice.ts";
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH, getDefaultNotePosition } from "./notePosition";

const NoteTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
`;

const NoteContentText = styled.div`
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
`;

const NoteMeta = styled.div`
  font-size: 11px;
  color: #9ca3af;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 8px;
`;

// Dark or white text, whichever has the higher WCAG contrast on the note colour. The old brightness cut-off
// (> 186) put white text on the default blue (3.7:1) and on every other theme colour.
const relativeLuminance = (hex: string) => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.replace(/./g, "$&$&") : clean.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = (parseInt(full.substring(i, i + 2), 16) || 0) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const DARK_TEXT = "#111827";
const getContrastTextColor = (hex: string) => {
  const l = relativeLuminance(hex);
  const onWhite = 1.05 / (l + 0.05);
  const onDark = (l + 0.05) / (relativeLuminance(DARK_TEXT) + 0.05);
  return onDark >= onWhite ? DARK_TEXT : "#FFFFFF";
};

const CloseButton = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.12);
  color: inherit;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;

  .visible-note-view:hover & {
    opacity: 1;
  }
`;

const NOTE_VIEW_STYLE: React.CSSProperties = {
  height: "100%",
  position: "relative",
  boxSizing: "border-box",
  padding: "8px 24px 8px 10px",
  overflow: "auto",
};

const VisibleNoteView = ({ note, noteColorPalettes, onClose }) => {
  const noteColor = noteColorPalettes.find((color) => color.id === note.colorId)?.value || "#fef3c7";

  const textColor = getContrastTextColor(noteColor);

  const closeButton = (
    <CloseButton
      type="button"
      title="Hide this note (show it again from the Page Notes list)"
      aria-label="Hide note"
      // Keep the drag handle from starting a drag
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      ×
    </CloseButton>
  );

  if (note.viewType === NoteViewType.CHIP) {
    return (
      <div
        className="modal-drag-handle visible-note-view"
        style={{ ...NOTE_VIEW_STYLE, background: noteColor, color: textColor }}
      >
        {<NoteTitle>{note.title || note.content}</NoteTitle>}
        {closeButton}
      </div>
    );
  }

  return (
    <div
      className="modal-drag-handle visible-note-view"
      style={{ ...NOTE_VIEW_STYLE, minHeight: "100px", background: noteColor, color: textColor }}
    >
      {note.title && <NoteTitle>{note.title}</NoteTitle>}
      <NoteContentText>{note.content ? renderNoteMarkup(note.content) : "No content"}</NoteContentText>
      {closeButton}
    </div>
  );
};

interface VisibleNoteProps {
  note: NoteType;
  highlightOverlay: any;
  noteColorPalettes: any[];
  currentUrl: string;
}

type NoteRect = { x: number; y: number; width: number; height: number };

const DEFAULT_WIDTH = DEFAULT_NOTE_WIDTH;
const DEFAULT_HEIGHT = DEFAULT_NOTE_HEIGHT;
const MIN_SIZE = 50;
const ELEMENT_GAP = 5;
// How often an element note re-measures its element (it may render late, move or be replaced)
const ELEMENT_FOLLOW_INTERVAL = 500;

// Whether a mouse button / finger is down anywhere (a drag or resize may be in progress)
let pointerDown = false;
let pointerTrackingInstalled = false;
const isPointerDown = () => {
  if (!pointerTrackingInstalled) {
    pointerTrackingInstalled = true;
    window.addEventListener("pointerdown", () => (pointerDown = true), true);
    window.addEventListener("pointerup", () => (pointerDown = false), true);
    window.addEventListener("pointercancel", () => (pointerDown = false), true);
  }
  return pointerDown;
};
// Resizing reports every frame: persist only once the user stops
const SAVE_DELAY = 400;

const getElementPageRect = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    bottom: rect.bottom + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
};

// Keeps a note inside the document (never negative or past the right edge)
const clampToPage = ({ x, y, width, height }: NoteRect): NoteRect => {
  const pageWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
  return {
    x: Math.max(0, Math.min(x, pageWidth - Math.min(width, pageWidth))),
    y: Math.max(0, y),
    width,
    height,
  };
};

const getSize = (coords?: NoteLocationCoordinates) => ({
  width: coords?.width && coords.width >= MIN_SIZE ? coords.width : DEFAULT_WIDTH,
  height: coords?.height && coords.height >= MIN_SIZE ? coords.height : DEFAULT_HEIGHT,
});

export const VisibleNoteContainer: React.FC<VisibleNoteProps> = ({
  note,
  highlightOverlay,
  noteColorPalettes,
  currentUrl,
}) => {
  const dispatch = useDispatch();
  const [position, setPosition] = useState<NoteRect | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<NoteRect | null>(null);
  const noteRef = useRef(note);
  // A position saved from here is newer than the note prop until the notes are reloaded: don't
  // let a re-render put the old coordinates back (the note would jump back on the next follow tick)
  if (note.id !== noteRef.current.id || note.updatedAt >= noteRef.current.updatedAt) noteRef.current = note;

  const isChip = note.viewType === NoteViewType.CHIP;

  // Last drag/resize of this note: until it is saved, its stored position is out of date
  const lastInteractionRef = useRef(0);

  // Position from the saved coordinates, or next to the element the note is attached to. Element notes are
  // re-measured while shown, so they follow their element when the page layout changes or it renders late.
  useEffect(() => {
    isPointerDown(); // start tracking drags before the first follow tick
    let lastKey = "";
    const apply = (rect: NoteRect) => {
      const key = `${Math.round(rect.x)}:${Math.round(rect.y)}:${Math.round(rect.width)}:${Math.round(rect.height)}`;
      if (key === lastKey) return;
      lastKey = key;
      setPosition(rect);
    };

    const findElement = (xpath: string): Element | null => {
      try {
        return highlightOverlay.getElementByXPath(xpath);
      } catch (error) {
        console.error("Failed to position note by xpath:", error);
        return null;
      }
    };

    const getElementXPath = () => {
      const current = noteRef.current;
      const location = findMatchingLocation(current, window.location.hostname, window.location.href);
      return location?.elementXPath || (current as any).elementXPath;
    };

    const compute = (): NoteRect => {
      const current = noteRef.current;
      const matchingLocation = findMatchingLocation(current, window.location.hostname, window.location.href);
      const coords = matchingLocation?.coordinates;
      const { width, height } = getSize(coords);
      const elementXPath = matchingLocation?.elementXPath || (current as any).elementXPath;

      const fallback = (): NoteRect =>
        coords && !coords.relativeToElement
          ? clampToPage({ x: coords.x, y: coords.y, width, height })
          : clampToPage({ ...getDefaultNotePosition(current.id, width), width, height });

      const element = elementXPath ? findElement(elementXPath) : null;
      if (!element) return fallback();

      const rect = getElementPageRect(element);
      // A hidden element (display: none) has no box to stick to
      if (rect.width === 0 && rect.height === 0) return fallback();

      // A saved offset keeps the note where the user dragged it, relative to the element
      if (coords?.relativeToElement) {
        return clampToPage({ x: rect.left + coords.x, y: rect.top + coords.y, width, height });
      }

      // Above the element, or below it when there is no room above
      const above = rect.top - ELEMENT_GAP - height;
      return clampToPage({ x: rect.left, y: above >= 0 ? above : rect.bottom + ELEMENT_GAP, width, height });
    };

    apply(compute());

    if (!getElementXPath()) return;

    const follow = () => {
      // Not while the user drags or resizes it, or before that change is saved
      if (isPointerDown() || Date.now() - lastInteractionRef.current < SAVE_DELAY + 300) return;
      apply(compute());
    };
    const timer = setInterval(follow, ELEMENT_FOLLOW_INTERVAL);
    window.addEventListener("resize", follow);

    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", follow);
    };
  }, [note.locations, highlightOverlay, currentUrl]);

  const savePosition = useCallback(async () => {
    const newState = pendingStateRef.current;
    pendingStateRef.current = null;
    if (!newState) return;

    const currentNote = noteRef.current;

    try {
      // Use centralized function to find matching location
      const matchingLocation = findMatchingLocation(currentNote, window.location.hostname, window.location.href);

      if (!matchingLocation) {
        console.warn("No matching location found to save coordinates");
        return;
      }

      const elementXPath = matchingLocation.elementXPath;
      const element = elementXPath ? highlightOverlay.getElementByXPath(elementXPath) : null;
      const previous = matchingLocation.coordinates;

      // Chips have a fixed size; keep the note's saved size for them
      const size = isChip
        ? { width: previous?.width, height: previous?.height }
        : { width: Math.round(newState.width), height: Math.round(newState.height) };

      let coordinates: NoteLocationCoordinates;
      if (element) {
        // Keep the element anchoring: store the offset from the element
        const rect = getElementPageRect(element);
        coordinates = {
          x: Math.round(newState.x - rect.left),
          y: Math.round(newState.y - rect.top),
          ...size,
          relativeToElement: true,
        };
      } else if (elementXPath && previous?.relativeToElement) {
        // Element is not on the page right now: keep the saved offset, only update the size
        coordinates = { ...previous, ...size };
      } else {
        coordinates = { x: Math.round(newState.x), y: Math.round(newState.y), ...size };
      }

      const updatedLocations = currentNote.locations?.map((loc) =>
        loc === matchingLocation ? { ...loc, coordinates } : loc,
      );

      const updatedNote = await updateNote({
        id: currentNote.id,
        updates: {
          locations: updatedLocations,
        },
      });
      if (updatedNote) noteRef.current = updatedNote;
    } catch (error) {
      console.error("Failed to save note position:", error);
    }
  }, [highlightOverlay, isChip]);

  // Save pending position on unmount
  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      savePosition();
    },
    [savePosition],
  );

  // Handle position changes and save to storage once dragging/resizing stops
  const handleModalStateChange = (newState: NoteRect) => {
    lastInteractionRef.current = Date.now();
    pendingStateRef.current = newState;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      savePosition();
    }, SAVE_DELAY);
  };

  const handleClose = async () => {
    try {
      // Hide the note by setting isVisible to false
      await updateNote({
        id: note.id,
        updates: {
          isVisible: false,
        },
      });
      dispatch(triggerRefresh());
    } catch (error) {
      console.error("Failed to close note:", error);
    }
  };

  if (!position) return null;

  return (
    <FloatingModal
      // Re-mount when the computed position changes (the modal only reads its initial position)
      key={`${Math.round(position.x)}:${Math.round(position.y)}`}
      open={true}
      title={null}
      onCancel={handleClose}
      initialX={position.x}
      initialY={position.y}
      initialWidth={isChip ? 80 : position.width}
      initialHeight={isChip ? 30 : position.height}
      onModalStateChange={handleModalStateChange}
      footer={null}
      position="absolute"
      viewSourceType="note"
    >
      <VisibleNoteView note={note} noteColorPalettes={noteColorPalettes} onClose={handleClose} />
    </FloatingModal>
  );
};
