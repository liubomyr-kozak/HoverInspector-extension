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

const getContrastTextColor = (hex: string) => {
  // прибираємо "#"
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // формула для яскравості
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

  return brightness > 186 ? "#000000" : "#FFFFFF";
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
// An anchored element may render after the note (SPA): retry finding it for a while
const ELEMENT_RETRY_INTERVAL = 500;
const ELEMENT_RETRY_COUNT = 10;
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
  noteRef.current = note;

  const isChip = note.viewType === NoteViewType.CHIP;

  // Calculate position for xpath-attached notes or use saved coordinates
  useEffect(() => {
    let retryTimer: ReturnType<typeof setInterval> | null = null;

    // централізовано шукаємо location
    const matchingLocation = findMatchingLocation(note, window.location.hostname, window.location.href);
    const coords = matchingLocation?.coordinates;
    const { width, height } = getSize(coords);
    const elementXPath = matchingLocation?.elementXPath || (note as any).elementXPath;

    // функція для fallback позиції
    const getFallbackPosition = (): NoteRect =>
      coords && !coords.relativeToElement
        ? clampToPage({ x: coords.x, y: coords.y, width, height })
        : clampToPage({ ...getDefaultNotePosition(note.id, width), width, height });

    // функція для позиції по XPath
    const getXPathPosition = (element: Element): NoteRect => {
      const rect = getElementPageRect(element);

      // A saved offset keeps the note where the user dragged it, relative to the element
      if (coords?.relativeToElement) {
        return clampToPage({ x: rect.left + coords.x, y: rect.top + coords.y, width, height });
      }

      // Above the element, or below it when there is no room above
      const above = rect.top - ELEMENT_GAP - height;
      return clampToPage({
        x: rect.left,
        y: above >= 0 ? above : rect.bottom + ELEMENT_GAP,
        width,
        height,
      });
    };

    const findElement = (): Element | null => {
      try {
        return elementXPath ? highlightOverlay.getElementByXPath(elementXPath) : null;
      } catch (error) {
        console.error("Failed to position note by xpath:", error);
        return null;
      }
    };

    // головна логіка визначення позиції
    if (!elementXPath) {
      setPosition(getFallbackPosition());
    } else {
      const element = findElement();
      if (element) {
        setPosition(getXPathPosition(element));
      } else {
        setPosition(getFallbackPosition());
        let attempts = 0;
        retryTimer = setInterval(() => {
          attempts += 1;
          const found = findElement();
          if (found) setPosition(getXPathPosition(found));
          if (found || attempts >= ELEMENT_RETRY_COUNT) {
            clearInterval(retryTimer!);
            retryTimer = null;
          }
        }, ELEMENT_RETRY_INTERVAL);
      }
    }

    return () => {
      if (retryTimer) clearInterval(retryTimer);
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
