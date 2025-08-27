import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Note as NoteType, ColorPalette } from "@entrypoints/shared/types/notes";
import { getAllNotes, updateNote } from "@entrypoints/background/features/backgroundSlice";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal/FloatingModal";
import { BodyPortal } from "@entrypoints/shared/components/BodyPortal";

// Default color palette with IDs
const DEFAULT_COLORS: ColorPalette[] = [
  { id: "blue", name: "Blue", value: "#3B82F6", isDefault: true, createdAt: Date.now() },
  { id: "red", name: "Red", value: "#EF4444", isDefault: true, createdAt: Date.now() },
  { id: "green", name: "Green", value: "#10B981", isDefault: true, createdAt: Date.now() },
  { id: "yellow", name: "Yellow", value: "#F59E0B", isDefault: true, createdAt: Date.now() },
  { id: "purple", name: "Purple", value: "#8B5CF6", isDefault: true, createdAt: Date.now() },
  { id: "orange", name: "Orange", value: "#F97316", isDefault: true, createdAt: Date.now() },
  { id: "pink", name: "Pink", value: "#EC4899", isDefault: true, createdAt: Date.now() },
  { id: "cyan", name: "Cyan", value: "#06B6D4", isDefault: true, createdAt: Date.now() },
];

const NoteTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const NoteContentText = styled.div`
  color: #4b5563;
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

interface VisibleNoteProps {
  note: NoteType;
  colorPalette: ColorPalette[];
  highlightOverlay: any;
}

const VisibleNote: React.FC<VisibleNoteProps> = ({ note, colorPalette, highlightOverlay }) => {
  const [position, setPosition] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 100,
    y: 100,
    width: 250,
    height: 150,
  });

  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number = 0.85): string => {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse r, g, b values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const hexColor = colorPalette.find((color) => color.id === note.colorId)?.value || "#fef3c7";
  const noteColor = hexToRgba(hexColor, 0.5);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate initial position for xpath-attached notes or use saved coordinates
  useEffect(() => {
    if (note.coordinates) {
      // Use saved coordinates with default size if not provided
      setPosition({
        x: note.coordinates.x,
        y: note.coordinates.y,
        width: 250,
        height: 150,
      });
    } else if (note.elementXPath) {
      try {
        const element = highlightOverlay.getElementByXPath(note.elementXPath);
        if (element) {
          const rect = element.getBoundingClientRect();
          setPosition({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY - 10, // Offset slightly above the element
            width: 250,
            height: 150,
          });
        } else {
          // Element not found, use fallback position
          setPosition({
            x: 100,
            y: 100,
            width: 250,
            height: 150,
          });
        }
      } catch (error) {
        console.error("Failed to position note by xpath:", error);
        setPosition({
          x: 100,
          y: 100,
          width: 250,
          height: 150,
        });
      }
    }
  }, [note.elementXPath, note.coordinates, highlightOverlay]);

  // Handle position changes and save to storage
  const handleModalStateChange = async (newState: { x: number; y: number; width: number; height: number }) => {
    setPosition(newState);

    try {
      // Update note coordinates in storage
      await updateNote({
        data: {
          id: note.id,
          updates: {
            coordinates: { x: newState.x, y: newState.y },
            // Clear elementXPath when manually positioning to avoid conflicts
            elementXPath: undefined,
          },
        },
      });
    } catch (error) {
      console.error("Failed to save note position:", error);
    }
  };

  const handleClose = async () => {
    try {
      // Hide the note by setting isVisible to false
      await updateNote({
        data: {
          id: note.id,
          updates: {
            isVisible: false,
          },
        },
      });
    } catch (error) {
      console.error("Failed to close note:", error);
    }
  };

  // Position logging removed - console.log removed\n

  return (
    <FloatingModal
      open={true}
      title={note.title || "Note"}
      onCancel={handleClose}
      initialX={position.x}
      initialY={position.y}
      initialWidth={position.width}
      initialHeight={position.height}
      onModalStateChange={handleModalStateChange}
      footer={null}
      style={{
        background: noteColor,
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div style={{ background: noteColor, minHeight: "100px", height: "100%" }}>
        {note.title && <NoteTitle>{note.title}</NoteTitle>}
        <NoteContentText>{note.content || "No content"}</NoteContentText>
        <NoteMeta>
          {note.domain} • {formatDate(note.updatedAt)}
        </NoteMeta>
      </div>
    </FloatingModal>
  );
};

export const VisibleNotesProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [visibleNotes, setVisibleNotes] = useState<NoteType[]>([]);
  const { refreshTrigger } = useSelector((state: any) => state?.notes || { refreshTrigger: 0 });
  const highlightOverlay = useHighlightOverlay();

  useEffect(() => {
    const loadVisibleNotes = async () => {
      try {
        const notesData = await getAllNotes();
        const currentDomain = window.location.hostname;
        const currentUrl = window.location.href;

        // Filter notes that are visible and match current domain/URL or group
        const visible = notesData.notes.filter((note: NoteType) => {
          // Note must be visible and have positioning data
          if (!note.isVisible || (!note.coordinates && !note.elementXPath)) {
            return false;
          }

          // Check if note matches current page route/URL
          const matchesRoute = note.domain === currentDomain || note.url === currentUrl;

          // Check if note belongs to a group that should be visible on this page
          let matchesGroup = false;
          if (note.groupId) {
            const group = notesData.groups.find((g) => g.id === note.groupId);
            if (group) {
              // Groups can be visible across domains/routes (implement group visibility logic here if needed)
              matchesGroup = true;
            }
          }

          return matchesRoute || matchesGroup;
        });

        setVisibleNotes(visible);
      } catch (error) {
        console.error("Failed to load visible notes:", error);
      }
    };

    loadVisibleNotes();

    // Reload notes when location changes
    const handleLocationChange = () => {
      loadVisibleNotes();
    };

    // Listen for navigation changes
    window.addEventListener("popstate", handleLocationChange);

    // Also listen for pushState/replaceState changes (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      handleLocationChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Listen for refresh trigger and reload visible notes
  useEffect(() => {
    if (refreshTrigger > 0) {
      const loadVisibleNotes = async () => {
        try {
          const notesData = await getAllNotes();
          const currentDomain = window.location.hostname;
          const currentUrl = window.location.href;

          // Filter notes that are visible and match current domain/URL or group
          const visible = notesData.notes.filter((note: NoteType) => {
            // Note must be visible and have positioning data
            if (!note.isVisible || (!note.coordinates && !note.elementXPath)) {
              return false;
            }

            // Check if note matches current page route/URL
            const matchesRoute = note.domain === currentDomain || note.url === currentUrl;

            // Check if note belongs to a group that should be visible on this page
            let matchesGroup = false;
            if (note.groupId) {
              const group = notesData.groups.find((g) => g.id === note.groupId);
              if (group) {
                // Groups can be visible across domains/routes (implement group visibility logic here if needed)
                matchesGroup = true;
              }
            }

            return matchesRoute || matchesGroup;
          });

          setVisibleNotes(visible);
        } catch (error) {
          console.error("Failed to load visible notes:", error);
        }
      };

      loadVisibleNotes();
    }
  }, [refreshTrigger]);

  return (
    <>
      {children}

      <BodyPortal containerId="hover-inspector-porta-visible-note">
        <div className="hover-inspector-visible-note">
          {visibleNotes.map((note) => (
            <VisibleNote key={note.id} note={note} colorPalette={DEFAULT_COLORS} highlightOverlay={highlightOverlay} />
          ))}
        </div>
      </BodyPortal>
    </>
  );
};
