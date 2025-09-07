import React, { useEffect, useState } from "react";
import { findMatchingLocation } from "@entrypoints/background/services/notes.ts";
import { updateNote } from "@entrypoints/background/store/notesActionsSlice.ts";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal";
import styled from "styled-components";
import { Note as NoteType, NoteViewType } from "@entrypoints/shared/types/notes.ts";

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

const VisibleNoteView = ({ note, noteColorPalettes }) => {
  const noteColor = noteColorPalettes.find((color) => color.id === note.colorId)?.value || "#fef3c7";

  const textColor = getContrastTextColor(noteColor);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (note.viewType === NoteViewType.CHIP) {
    return (
      <div
        className="modal-drag-handle"
        style={{ background: noteColor, color: textColor, minHeight: "100px", height: "100%" }}
      >
        {<NoteTitle>{note.title || note.content}</NoteTitle>}
      </div>
    );
  }

  return (
    <div className="modal-drag-handle" style={{ background: noteColor, minHeight: "100px", height: "100%" }}>
      {note.title && <NoteTitle>{note.title}</NoteTitle>}
      <NoteContentText>{note.content || "No content"}</NoteContentText>
    </div>
  );
};

interface VisibleNoteProps {
  note: NoteType;
  highlightOverlay: any;
  noteColorPalettes: any[];
}

export const VisibleNoteContainer: React.FC<VisibleNoteProps> = ({ note, highlightOverlay, noteColorPalettes }) => {
  const [position, setPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Helper function to convert hex to rgba with opacity

  // Calculate initial position for xpath-attached notes or use saved coordinates
  useEffect(() => {
    const currentDomain = window.location.hostname;
    const currentUrl = window.location.href;

    // централізовано шукаємо location
    const matchingLocation = findMatchingLocation(note, currentDomain, currentUrl);

    // функція для fallback позиції
    const getFallbackPosition = () => ({
      x: 100,
      y: 100,
      width: 250,
      height: 150,
    });

    // функція для позиції з координат
    const getCoordinatesPosition = (coords: any) => {
      const width = coords?.width >= 50 ? coords.width : 250;
      const height = coords?.height >= 50 ? coords.height : 150;
      return {
        x: coords.x,
        y: coords.y,
        width,
        height,
      };
    };

    // функція для позиції по XPath
    const getXPathPosition = (xpath: string, coords: any) => {
      const width = coords?.width >= 50 ? coords.width : 250;
      const height = coords?.height >= 50 ? coords.height : 150;

      try {
        const element = highlightOverlay.getElementByXPath(xpath);
        if (!element) return getFallbackPosition();

        const rect = element.getBoundingClientRect();

        return {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY - 5 - height, // невеликий офсет
          width,
          height,
        };
      } catch (error) {
        console.error("Failed to position note by xpath:", error);
        return getFallbackPosition();
      }
    };

    // головна логіка визначення позиції
    if (matchingLocation?.coordinates) {
      setPosition(getCoordinatesPosition(matchingLocation.coordinates));
    } else {
      const elementXPath = matchingLocation?.elementXPath || (note as any).elementXPath;

      setPosition(elementXPath ? getXPathPosition(elementXPath, matchingLocation.coordinates) : getFallbackPosition());
    }
  }, [note.locations, highlightOverlay]);

  // Handle position changes and save to storage
  const handleModalStateChange = async (newState: { x: number; y: number; width: number; height: number }) => {
    setPosition(newState);

    try {
      // Use centralized function to find matching location
      const currentDomain = window.location.hostname;
      const currentUrl = window.location.href;

      const matchingLocation = findMatchingLocation(note, currentDomain, currentUrl);

      if (matchingLocation) {
        // Update coordinates in the matching location
        const updatedLocations = note.locations?.map((loc) => {
          if (loc === matchingLocation) {
            return {
              ...loc,
              coordinates: { x: newState.x, y: newState.y },
              elementXPath: undefined, // Clear elementXPath to avoid conflicts with manual positioning
            };
          }
          return loc;
        });

        await updateNote({
          id: note.id,
          updates: {
            locations: updatedLocations,
          },
        });
      } else {
        console.warn("No matching location found to save coordinates");
      }
    } catch (error) {
      console.error("Failed to save note position:", error);
    }
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
    } catch (error) {
      console.error("Failed to close note:", error);
    }
  };

  // Position logging removed - console.log removed\n

  if (!position) return null;

  console.log("🌟🌟🌟 ::VisibleNote -> note", note);

  return (
    <FloatingModal
      open={true}
      title={null}
      // title={note.title || "Note"}
      onCancel={handleClose}
      initialX={position.x}
      initialY={position.y}
      initialWidth={NoteViewType.CHIP == note.viewType ? 80 : position.width}
      initialHeight={NoteViewType.CHIP == note.viewType ? 30 : position.height}
      onModalStateChange={handleModalStateChange}
      footer={null}
      position="absolute"
      viewSourceType="note"
    >
      <VisibleNoteView note={note} noteColorPalettes={noteColorPalettes} />
    </FloatingModal>
  );
};
