import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { NotesList } from "./components/NotesList";
import { Note, NoteGroup, NotesState } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  updateNotesSearchQuery,
  createNoteGroup,
  updateNoteGroup,
  deleteNoteGroup,
  setSelectedNote,
} from "@entrypoints/background/store/notesActionsSlice.ts";
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
import { FiGlobe, FiMap, FiTarget, FiX } from "react-icons/fi";
import { AttachmentTypeEnum } from "@entrypoints/shared/types/notes";

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
  const { refreshTrigger } = useSelector((state: any) => state?.notes || { refreshTrigger: 0 });
  const isActive = React.useMemo(() => activeIcons.includes("pageNotes"), [activeIcons]);

  const [notesState, setNotesState] = useState<NotesState>({
    notes: [],
    groups: [],
    searchQuery: "",
    selectedNoteId: undefined,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note Visibility & Attachment state
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<"global" | "route" | "element" | null>(null);
  const [showVisibilitySection, setShowVisibilitySection] = useState(false);

  const handleToggleFeatureMinimized = (featureKey: string) => {
    dispatch(onToggleFeatureMinimized.getPayload({ featureKey }));
  };

  // Note Visibility & Attachment handlers
  const handleAttachmentTypeClick = (type: "global" | "route" | "element") => {
    if (selectedAttachmentType === type) {
      setSelectedAttachmentType(null);
      setShowVisibilitySection(false);
    } else {
      setSelectedAttachmentType(type);
      setShowVisibilitySection(true);
    }
  };

  const handleCloseVisibilitySection = () => {
    setSelectedAttachmentType(null);
    setShowVisibilitySection(false);
  };

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

  // Load notes data on component mount
  useEffect(() => {
    loadNotesData();
  }, [loadNotesData]);

  // Listen for refresh trigger and reload data
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadNotesData();
    }
  }, [refreshTrigger, loadNotesData]);

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
        id: noteId,
        updates,
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
      await deleteNote(noteId);

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
      await setSelectedNote(noteId);

      setNotesState((prev) => ({
        ...prev,
        selectedNoteId: noteId,
      }));
    } catch (err) {
      console.error("Failed to select note:", err);
    }
  }, []);

  const handleUpdateSearchQuery = useCallback(async (query: string) => {
    try {
      await updateNotesSearchQuery(query);

      setNotesState((prev) => ({
        ...prev,
        searchQuery: query,
      }));
    } catch (err) {
      console.error("Failed to update search query:", err);
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

  // Add helper function to check if note should be visible on current page
  const isNoteVisibleOnCurrentPage = (note: Note): boolean => {
    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;
    const currentPathname = window.location.pathname;

    // If note has locations array, use new filtering logic
    if (note.locations && note.locations.length > 0) {
      return note.locations.some((location) => {
        // Global attachment - always visible
        if (location.attachmentType === AttachmentTypeEnum.GLOBAL) {
          return true;
        }

        // Domain attachment - visible on same domain
        if (location.attachmentType === "domain") {
          return location.domain === currentHostname || location.routePattern === currentHostname;
        }

        // Route attachment - check route pattern
        if (location.attachmentType === AttachmentTypeEnum.ROUTE) {
          if (!location.routePattern) return false;

          if (location.patternType === "regex") {
            try {
              const regex = new RegExp(location.routePattern);
              return regex.test(currentPathname) || regex.test(currentUrl);
            } catch (e) {
              console.warn("Invalid regex pattern:", location.routePattern);
              return false;
            }
          } else {
            // URL pattern matching
            const pattern = location.routePattern;

            // Simple wildcard matching
            if (pattern.includes("*")) {
              const regexPattern = pattern.replace(/\*/g, ".*");
              try {
                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(currentPathname);
              } catch (e) {
                return false;
              }
            }

            // Exact match or starts with match
            return currentPathname === pattern || currentPathname.startsWith(pattern);
          }
        }

        // Element attachment - check if element exists on page
        if (location.attachmentType === "element" && location.elementXPath) {
          try {
            const result = document.evaluate(
              location.elementXPath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null,
            );
            return result.singleNodeValue !== null;
          } catch (e) {
            console.warn("Invalid XPath:", location.elementXPath);
            return false;
          }
        }

        return false;
      });
    }

    // Legacy fallback - support old note structure
    if (note.attachmentType === AttachmentTypeEnum.GLOBAL) {
      return true;
    }

    if (note.attachmentType === AttachmentTypeEnum.ROUTE) {
      if (!note.routePattern) return false;
      return currentPathname === note.routePattern || currentPathname.startsWith(note.routePattern);
    }

    if (note.elementXPath) {
      try {
        const result = document.evaluate(note.elementXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue !== null;
      } catch (e) {
        return false;
      }
    }

    // Default to showing note if no specific rules
    return true;
  };

  // Update the notes filtering logic in your component
  const filteredNotes = useMemo(() => {
    if (!notesState.notes) return [];

    return notesState.notes.filter((note) => {
      // Apply search filter
      const matchesSearch =
        !notesState.searchQuery ||
        note.title?.toLowerCase().includes(notesState.searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(notesState.searchQuery.toLowerCase());

      // Apply visibility filter
      const isVisible = isNoteVisibleOnCurrentPage(note);

      return matchesSearch && isVisible;
    });
  }, [notesState.notes, notesState.searchQuery]);

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
            {/* Note Visibility & Attachment buttons */}
            <div className="flex items-center gap-1 mr-2">
              <button
                className={`cursor-pointer p-1.5 rounded-md transition-colors duration-200 flex items-center justify-center ${
                  selectedAttachmentType === "global"
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
                onClick={() => handleAttachmentTypeClick("global")}
                title="Global - Show on all pages"
              >
                <FiGlobe className="w-4 h-4" />
              </button>
              <button
                className={`cursor-pointer p-1.5 rounded-md transition-colors duration-200 flex items-center justify-center ${
                  selectedAttachmentType === "route"
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
                onClick={() => handleAttachmentTypeClick("route")}
                title="Route - Show on specific routes"
              >
                <FiMap className="w-4 h-4" />
              </button>
              <button
                className={`cursor-pointer p-1.5 rounded-md transition-colors duration-200 flex items-center justify-center ${
                  selectedAttachmentType === "element"
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
                onClick={() => handleAttachmentTypeClick("element")}
                title="Element - Attach to page element"
              >
                <FiTarget className="w-4 h-4" />
              </button>
            </div>

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

      {/* Note Visibility & Attachment Section */}
      {showVisibilitySection && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              {selectedAttachmentType === "global" && (
                <>
                  <FiGlobe className="w-4 h-4" /> Global Visibility
                </>
              )}
              {selectedAttachmentType === "route" && (
                <>
                  <FiMap className="w-4 h-4" /> Route Visibility
                </>
              )}
              {selectedAttachmentType === "element" && (
                <>
                  <FiTarget className="w-4 h-4" /> Element Attachment
                </>
              )}
            </h3>
            <button
              onClick={handleCloseVisibilitySection}
              className="p-1 rounded-md hover:bg-blue-200 text-blue-600 transition-colors duration-200"
              title="Close visibility section"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-blue-700">
            {selectedAttachmentType === "global" && "Notes will be visible on all pages across all domains."}
            {selectedAttachmentType === "route" && "Notes will be visible on specific routes or domains only."}
            {selectedAttachmentType === "element" && "Notes will be attached to specific page elements."}
          </div>
        </div>
      )}

      <NotesList
        notesState={notesState}
        onCreateNote={handleCreateNote}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onSelectNote={handleSelectNote}
        onUpdateSearchQuery={handleUpdateSearchQuery}
        onToggleGroup={handleToggleGroup}
      />
    </div>
  );
};
