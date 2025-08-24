import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { closeNoteForm } from "@entrypoints/content/store/notes/notes.slice";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal/FloatingModal";
import { NoteFormData } from "@entrypoints/shared/types/notes";
import { createNote, updateNote } from "@entrypoints/background/features/backgroundSlice";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager";
import { NoteForm } from "./NoteForm";

// Tailwind refactor: Removed styled-components in favor of utility classes

// шляпа зі стилями.. він не шарить що в мене shadow DOM
import NoteFormPopupStyles from "./NoteFormPopup.css?inline";
import { ButtonsContainer } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";

export const NoteFormPopup: React.FC = () => {
  const dispatch = useDispatch();
  const notesState = useSelector((s: RootState) => s.notes);

  // Default position and size
  const defaultPosition = {
    x: window.innerWidth - 460,
    y: 100,
    width: 420,
    height: 500,
  };

  // State for panel position and size
  const [panelPosition, setPanelPosition] = useState(defaultPosition);
  const [isPositionLoaded, setIsPositionLoaded] = useState(false);

  // Form submission state
  const [showTitleField, setShowTitleField] = useState(false);

  // Load saved position on mount
  useEffect(() => {
    const loadPosition = async () => {
      try {
        // Use ExtensionStorageManager for NoteForm panel persistence
        const savedPosition = await ExtensionStorageManager.getNoteFormPanelPosition();
        if (savedPosition) {
          if (
            savedPosition &&
            typeof savedPosition.x === "number" &&
            typeof savedPosition.y === "number" &&
            typeof savedPosition.width === "number" &&
            typeof savedPosition.height === "number"
          ) {
            setPanelPosition(savedPosition);
          }
        }
      } catch (error) {
        console.error("Failed to load NoteForm panel position:", error);
      } finally {
        setIsPositionLoaded(true);
      }
    };

    loadPosition();
  }, []);

  // Handle position/size changes
  const handleModalStateChange = async (newState: { x: number; y: number; width: number; height: number }) => {
    setPanelPosition(newState);
    try {
      await ExtensionStorageManager.saveNoteFormPanelPosition(newState);
    } catch (error) {
      console.error("Failed to save NoteForm panel position:", error);
    }
  };

  const handleCancel = () => {
    dispatch(closeNoteForm());
  };

  if (!notesState.isFormOpen || !isPositionLoaded) return null;

  const formId = "hoverInspector-note-form";

  return (
    <FloatingModal
      open={notesState.isFormOpen}
      title={notesState.editingNote ? "Edit Note" : "Create Note"}
      onCancel={handleCancel}
      initialWidth={panelPosition.width}
      initialHeight={panelPosition.height}
      initialX={panelPosition.x}
      initialY={panelPosition.y}
      onModalStateChange={handleModalStateChange}
      footer={<ButtonsContainer id="hover-inspector-popup-footer-note" />}
    >
      <style>{NoteFormPopupStyles}</style>
      <NoteForm
        editingNote={notesState.editingNote}
        initialFormData={notesState.initialFormData}
        formId={formId}
        onCancel={handleCancel}
        showTitleField={showTitleField}
        onShowTitleFieldChange={setShowTitleField}
      />
    </FloatingModal>
  );
};
