import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { NotesList } from "./components/NotesList";
import { Note, NoteGroup, NotesState, NoteFormData } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  updateNotesSearchQuery,
  toggleNotesShowOnlyCurrentDomain,
  createNoteGroup,
  updateNoteGroup,
  deleteNoteGroup,
  setSelectedNote,
} from "@entrypoints/background/features/backgroundSlice";
import { openNoteForm } from "@entrypoints/content/store/notes/notes.slice";
import { onToggleFeatureMinimized } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "../AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { PAGE_NOTES } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { TbWindowMinimize } from "react-icons/tb";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #9ca3af;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ef4444;
  text-align: center;
`;

export const PageNotes: React.FC = () => {
  const dispatch = useDispatch();
  const highlightOverlay = useHighlightOverlay();

  const { activeIcons = [], iconOrder = [] } = useSelector((state: any) => state?.app.launcher);
  const isActive = React.useMemo(() => activeIcons.includes("pageNotes"), [activeIcons]);

  const [notesState, setNotesState] = useState<NotesState>({
    notes: [],
    groups: [],
    searchQuery: "",
    showOnlyCurrentDomain: false,
    selectedNoteId: undefined,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFeatureMinimized = (featureKey: string) => {
    dispatch(onToggleFeatureMinimized.getPayload({ featureKey }));
  };

  // Load notes data on component mount
  useEffect(() => {
    loadNotesData();
  }, []);

  const loadNotesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllNotes();
      setNotesState(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
      setError("Failed to load notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateNote = useCallback(() => {
    dispatch(openNoteForm({ editingNote: null }));
  }, [dispatch]);

  const handleEditNote = useCallback(
    (noteId: string) => {
      const note = notesState.notes.find((n) => n.id === noteId);
      if (note) {
        dispatch(openNoteForm({ editingNote: note }));
      }
    },
    [notesState.notes, dispatch],
  );

  const handleUpdateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await updateNote({
        data: { id: noteId, updates },
      });

      if (updatedNote) {
        setNotesState((prev) => ({
          ...prev,
          notes: prev.notes.map((note) => (note.id === noteId ? updatedNote : note)),
        }));
      }
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteNote({ data: noteId });

      setNotesState((prev) => ({
        ...prev,
        notes: prev.notes.filter((note) => note.id !== noteId),
        selectedNoteId: prev.selectedNoteId === noteId ? undefined : prev.selectedNoteId,
      }));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }, []);

  const handleSelectNote = useCallback(async (noteId: string) => {
    try {
      await setSelectedNote({ data: noteId });

      setNotesState((prev) => ({
        ...prev,
        selectedNoteId: noteId,
      }));
    } catch (err) {
      console.error("Failed to select note:", err);
    }
  }, []);

  const handlePinNote = useCallback(
    async (noteId: string) => {
      const note = notesState.notes.find((n) => n.id === noteId);
      if (!note) return;

      try {
        if (note.elementXPath || note.coordinates) {
          // Unpin note
          await handleUpdateNote(noteId, {
            elementXPath: undefined,
            coordinates: undefined,
          });
        } else {
          // Pin note - start element selection mode
          const subscription = highlightOverlay.streamSelectionMode().subscribe({
            next: (event) => {
              if (event.type === "elementSelected") {
                // Generate XPath for the selected element
                const xpath = highlightOverlay.generateXPath(event.element);

                // Update note with element XPath
                handleUpdateNote(noteId, {
                  elementXPath: xpath,
                  coordinates: undefined, // Clear coordinates if set
                });

                subscription.unsubscribe();
              }
            },
            error: (err) => {
              console.error("Element selection failed:", err);
              subscription.unsubscribe();
            },
          });

          // Fallback: if user doesn't select an element, pin to center after 10 seconds
          setTimeout(() => {
            if (!subscription.closed) {
              const coordinates = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              };

              handleUpdateNote(noteId, { coordinates });
              subscription.unsubscribe();
            }
          }, 10000);
        }
      } catch (err) {
        console.error("Failed to pin/unpin note:", err);
      }
    },
    [notesState.notes, handleUpdateNote, highlightOverlay],
  );

  const handleUpdateSearchQuery = useCallback(async (query: string) => {
    try {
      await updateNotesSearchQuery({ data: query });

      setNotesState((prev) => ({
        ...prev,
        searchQuery: query,
      }));
    } catch (err) {
      console.error("Failed to update search query:", err);
    }
  }, []);

  const handleToggleShowOnlyCurrentDomain = useCallback(async (show: boolean) => {
    try {
      await toggleNotesShowOnlyCurrentDomain({ data: show });

      setNotesState((prev) => ({
        ...prev,
        showOnlyCurrentDomain: show,
      }));
    } catch (err) {
      console.error("Failed to toggle domain filter:", err);
    }
  }, []);

  const handleToggleGroup = useCallback(
    async (groupId: string) => {
      const group = notesState.groups.find((g) => g.id === groupId);
      if (!group) return;

      try {
        const updatedGroup = await updateNoteGroup({
          data: {
            id: groupId,
            updates: { isExpanded: !group.isExpanded },
          },
        });

        if (updatedGroup) {
          setNotesState((prev) => ({
            ...prev,
            groups: prev.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
          }));
        }
      } catch (err) {
        console.error("Failed to toggle group:", err);
      }
    },
    [notesState.groups],
  );

  const handleCreateGroup = useCallback(async (name: string, color: string): Promise<NoteGroup> => {
    try {
      const newGroup = await createNoteGroup({
        data: { name, color },
      });

      setNotesState((prev) => ({
        ...prev,
        groups: [...prev.groups, newGroup],
      }));

      return newGroup;
    } catch (err) {
      console.error("Failed to create group:", err);
      throw err;
    }
  }, []);

  if (!isActive) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <PortalModalHeader portalId={HeaderPortalId.PAGE_NOTES}>
          <FeatureTitle>
            <FeatureIcon icon={PAGE_NOTES.icon} />
            {PAGE_NOTES.title}
            <PortalModalHeaderButtons>
              <div
                className="ml-auto cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                onClick={() => {
                  handleToggleFeatureMinimized("pageNotes");
                }}
                title={`Minimize Page Notes`}
              >
                <TbWindowMinimize className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
              </div>
            </PortalModalHeaderButtons>
          </FeatureTitle>
        </PortalModalHeader>
        <Container>
          <LoadingState>Loading notes...</LoadingState>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <PortalModalHeader portalId={HeaderPortalId.PAGE_NOTES}>
          <FeatureTitle>
            <FeatureIcon icon={PAGE_NOTES.icon} />
            {PAGE_NOTES.title}
            <PortalModalHeaderButtons>
              <div
                className="ml-auto cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                onClick={() => {
                  handleToggleFeatureMinimized("pageNotes");
                }}
                title={`Minimize Page Notes`}
              >
                <TbWindowMinimize className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
              </div>
            </PortalModalHeaderButtons>
          </FeatureTitle>
        </PortalModalHeader>
        <Container>
          <ErrorState>
            <p>{error}</p>
            <button
              onClick={loadNotesData}
              style={{
                padding: "8px 16px",
                border: "1px solid #ef4444",
                background: "transparent",
                color: "#ef4444",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "12px",
              }}
            >
              Retry
            </button>
          </ErrorState>
        </Container>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.PAGE_NOTES}>
        <FeatureTitle>
          <FeatureIcon icon={PAGE_NOTES.icon} />
          {PAGE_NOTES.title}
          <PortalModalHeaderButtons>
            <div
              className="ml-auto cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              onClick={() => {
                handleToggleFeatureMinimized("pageNotes");
              }}
              title={`Minimize Page Notes`}
            >
              <TbWindowMinimize className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
            </div>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>

      <NotesList
        notesState={notesState}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onSelectNote={handleSelectNote}
        onPinNote={handlePinNote}
        onUpdateSearchQuery={handleUpdateSearchQuery}
        onToggleShowOnlyCurrentDomain={handleToggleShowOnlyCurrentDomain}
        onToggleGroup={handleToggleGroup}
      />
    </div>
  );
};
