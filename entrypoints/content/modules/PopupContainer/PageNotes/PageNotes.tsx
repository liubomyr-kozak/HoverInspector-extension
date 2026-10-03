import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { NotesList } from "./components/NotesList";
import { Note, NoteGroup, NotesState } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import {
  getAllNotes,
  updateNote,
  deleteNote,
  importNotes,
  updateNotesSearchQuery,
  createNoteGroup,
  updateNoteGroup,
  setSelectedNote,
} from "@entrypoints/background/store/notesActionsSlice.ts";
import { isNoteOnPage } from "@entrypoints/background/services/notes.ts";
import { openNoteForm, triggerRefresh } from "@entrypoints/content/store/notes/notes.slice";
import { useCurrentUrl } from "./VisibleNotesProvider/useCurrentUrl";
import { onToggleFeatureMinimized } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "../AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
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

  // Note Visibility & Attachment filter (header buttons)
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<"global" | "route" | "element" | null>(null);
  const [showVisibilitySection, setShowVisibilitySection] = useState(false);

  // Show only this page's notes unless "All pages" is selected
  const [showAllPages, setShowAllPages] = useState(false);
  const currentUrl = useCurrentUrl();
  const importInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpdateNote = useCallback(
    async (noteId: string, updates: Partial<Note>) => {
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
          // Let the sticky notes on the page pick up the change
          dispatch(triggerRefresh());
        }
      } catch (err) {
        console.error("Failed to update note:", err);
        toast.error("Failed to update note");
      }
    },
    [dispatch],
  );

  const handleToggleVisibility = useCallback(
    (noteId: string) => {
      const note = notesState.notes.find((n) => n.id === noteId);
      if (note) handleUpdateNote(noteId, { isVisible: note.isVisible === false });
    },
    [notesState.notes, handleUpdateNote],
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        await deleteNote(noteId);

        setNotesState((prev) => ({
          ...prev,
          notes: prev.notes.filter((note) => note.id !== noteId),
          selectedNoteId: prev.selectedNoteId === noteId ? undefined : prev.selectedNoteId,
        }));
        // Remove the sticky note from the page as well
        dispatch(triggerRefresh());
      } catch (err) {
        console.error("Failed to delete note:", err);
        toast.error("Failed to delete note");
      }
    },
    [dispatch],
  );

  const handleExportNotes = useCallback(() => {
    try {
      const data = {
        type: "hover-inspector-notes",
        version: 1,
        exportedAt: new Date().toISOString(),
        notes: notesState.notes,
        groups: notesState.groups,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `page-notes-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to export notes:", err);
      toast.error("Failed to export notes");
    }
  }, [notesState.notes, notesState.groups]);

  const handleImportFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      try {
        let parsed: any;
        try {
          parsed = JSON.parse(await file.text());
        } catch {
          throw new Error(`${file.name} is not a notes export (not a JSON file)`);
        }
        const notes = Array.isArray(parsed) ? parsed : parsed?.notes;
        if (!Array.isArray(notes)) throw new Error(`No notes found in ${file.name}`);

        // Notes with an id that is already stored replace that note instead of adding a copy
        const { added, updated } = await importNotes({ data: { notes, groups: parsed?.groups || [] } });
        const plural = (count: number) => `${count} note${count === 1 ? "" : "s"}`;
        const alreadyHere = `${updated === 1 ? "that was" : "that were"} already here`;
        if (added + updated === 0) toast.info("The file has no notes to import");
        else if (updated === 0) toast.success(`Imported ${plural(added)}`);
        else if (added === 0) toast.success(`Updated ${plural(updated)} ${alreadyHere}`);
        else toast.success(`Imported ${plural(added)}, updated ${plural(updated)} ${alreadyHere}`);
        await loadNotesData();
        dispatch(triggerRefresh());
      } catch (err) {
        console.error("Failed to import notes:", err);
        toast.error(`Failed to import notes: ${(err as Error)?.message || err}`);
      }
    },
    [loadNotesData, dispatch],
  );

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
    // Update the input right away; persisting the query can lag behind
    setNotesState((prev) => ({
      ...prev,
      searchQuery: query,
    }));

    try {
      await updateNotesSearchQuery(query);
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

  // Notes for the selected scope (this page / all pages) and header attachment filter.
  // Search filtering happens in NotesList.
  const filteredNotes = useMemo(() => {
    if (!notesState.notes) return [];

    return notesState.notes.filter((note) => {
      const locations = note.locations || [];

      if (!showAllPages && !isNoteOnPage(note, window.location.hostname, currentUrl)) {
        return false;
      }

      switch (selectedAttachmentType) {
        case "global":
          return locations.some((location) => location.attachmentType === AttachmentTypeEnum.GLOBAL);
        case "route":
          return locations.some(
            (location) =>
              location.attachmentType === AttachmentTypeEnum.ROUTE ||
              location.attachmentType === AttachmentTypeEnum.DOMAIN,
          );
        case "element":
          return locations.some((location) => !!location.elementXPath);
        default:
          return true;
      }
    });
  }, [notesState.notes, showAllPages, currentUrl, selectedAttachmentType]);

  if (!isActive) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <PortalModalHeader portalId={HeaderPortalId.PAGE_NOTES}>
          <FeatureTitle>
            <FeatureIcon icon={PAGE_NOTES.icon} />
            <FeatureTitleText title={PAGE_NOTES.title}>{PAGE_NOTES.title}</FeatureTitleText>
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
            <FeatureTitleText title={PAGE_NOTES.title}>{PAGE_NOTES.title}</FeatureTitleText>
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
          <FeatureTitleText title={PAGE_NOTES.title}>{PAGE_NOTES.title}</FeatureTitleText>
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
                title="Filter: notes shown on all pages"
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
                title="Filter: notes attached to routes or domains"
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
                title="Filter: notes attached to page elements"
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
              title="Clear filter"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-blue-700">
            {selectedAttachmentType === "global" && "Showing notes that are visible on all pages."}
            {selectedAttachmentType === "route" && "Showing notes attached to specific routes or domains."}
            {selectedAttachmentType === "element" && "Showing notes attached to page elements."}{" "}
            ({filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"})
          </div>
        </div>
      )}

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />

      <NotesList
        notesState={{ ...notesState, notes: filteredNotes }}
        totalNotesCount={notesState.notes.length}
        showAllPages={showAllPages}
        onShowAllPagesChange={setShowAllPages}
        onToggleVisibility={handleToggleVisibility}
        onCreateNote={handleCreateNote}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onSelectNote={handleSelectNote}
        onUpdateSearchQuery={handleUpdateSearchQuery}
        onToggleGroup={handleToggleGroup}
        onImportNotes={() => importInputRef.current?.click()}
        onExportNotes={handleExportNotes}
      />
    </div>
  );
};
