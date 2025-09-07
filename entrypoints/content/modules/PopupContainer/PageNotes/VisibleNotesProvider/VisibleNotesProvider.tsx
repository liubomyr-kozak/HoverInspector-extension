import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Note as NoteType, ColorPalette } from "@entrypoints/shared/types/notes.ts";
import { getAllNotes } from "@entrypoints/background/store/notesActionsSlice.ts";
import { getVisibleNotesForPage } from "@entrypoints/background/services/notes.ts";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext.tsx";
import { VisibleNoteContainer } from "./VisibleNote";

// // Default color palette with IDs
// const DEFAULT_COLORS: ColorPalette[] = [
//   { id: "blue", name: "Blue", value: "#3B82F6", isDefault: true, createdAt: Date.now() },
//   { id: "red", name: "Red", value: "#EF4444", isDefault: true, createdAt: Date.now() },
//   { id: "green", name: "Green", value: "#10B981", isDefault: true, createdAt: Date.now() },
//   { id: "yellow", name: "Yellow", value: "#F59E0B", isDefault: true, createdAt: Date.now() },
//   { id: "purple", name: "Purple", value: "#8B5CF6", isDefault: true, createdAt: Date.now() },
//   { id: "orange", name: "Orange", value: "#F97316", isDefault: true, createdAt: Date.now() },
//   { id: "pink", name: "Pink", value: "#EC4899", isDefault: true, createdAt: Date.now() },
//   { id: "cyan", name: "Cyan", value: "#06B6D4", isDefault: true, createdAt: Date.now() },
// ];

export const VisibleNotesProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [visibleNotes, setVisibleNotes] = useState<NoteType[]>([]);
  const { refreshTrigger } = useSelector((state: any) => state?.notes || { refreshTrigger: 0 });
  const highlightOverlay = useHighlightOverlay();
  const [noteColorPalettes, setNoteColorPalettes] = useState<any>([]);

  useEffect(() => {
    const loadVisibleNotes = async () => {
      try {
        const notesData = await getAllNotes();
        const currentDomain = window.location.hostname;
        const currentUrl = window.location.href;

        setNoteColorPalettes(notesData.colorPalettes || []);

        // Use centralized function to filter visible notes for current page
        const visibleNotes = getVisibleNotesForPage(notesData.notes, currentDomain, currentUrl, notesData.groups);

        setVisibleNotes(visibleNotes);
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

          // refreshTrigger
          // Use centralized function to filter visible notes for current page
          const visibleNotes = getVisibleNotesForPage(notesData.notes, currentDomain, currentUrl, notesData.groups);

          setVisibleNotes(visibleNotes);
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
      <div className="hover-inspector-visible-note">
        {visibleNotes.map((note) => (
          <VisibleNoteContainer
            key={note.id}
            note={note}
            highlightOverlay={highlightOverlay}
            noteColorPalettes={noteColorPalettes}
          />
        ))}
      </div>
    </>
  );
};
