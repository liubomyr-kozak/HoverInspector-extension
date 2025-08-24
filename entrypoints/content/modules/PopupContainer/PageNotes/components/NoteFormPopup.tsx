import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HexColorPicker } from "react-colorful";
import { Popover } from "antd";
import { RootState } from "@entrypoints/content/store/createStore";
import { closeNoteForm } from "@entrypoints/content/store/notes/notes.slice";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal/FloatingModal";
import { NotesState, NoteFormData, ColorPalette } from "@entrypoints/shared/types/notes";
import { getAllNotes, createNote, updateNote, createNoteGroup } from "@entrypoints/background/features/backgroundSlice";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager";

// Tailwind refactor: Removed styled-components in favor of utility classes

// шляпа зі стилями.. він не шарить що в мене shadow DOM
import NoteFormPopupStyles from "./NoteFormPopup.css?inline";

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

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groupId, setGroupId] = useState<string | undefined>();
  const [selectedColorId, setSelectedColorId] = useState<string>("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTitleField, setShowTitleField] = useState(false);

  // Color management state
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(DEFAULT_COLORS);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState("#2D3748");

  // Notes data state
  const [notesData, setNotesData] = useState<NotesState>({
    notes: [],
    groups: [],
    searchQuery: "",
    showOnlyCurrentDomain: false,
    selectedNoteId: undefined,
  });

  // Load saved position on mount and initialize form
  useEffect(() => {
    const loadPosition = async () => {
      try {
        // Local persistence for NoteForm panel (no background API available)
        const raw = localStorage.getItem("hoverInspector.noteForm.panelState");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed.x === "number" &&
            typeof parsed.y === "number" &&
            typeof parsed.width === "number" &&
            typeof parsed.height === "number"
          ) {
            setPanelPosition(parsed);
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

  // Load notes data when form opens and initialize form
  useEffect(() => {
    if (notesState.isFormOpen) {
      loadNotesData();

      // Initialize form with editing note data or initial data
      const initialData = notesState.editingNote
        ? {
            title: notesState.editingNote.title,
            content: notesState.editingNote.content,
            groupId: notesState.editingNote.groupId,
            colorId: notesState.editingNote.colorId,
          }
        : notesState.initialFormData;

      setTitle(initialData?.title || "");
      setContent(initialData?.content || "");
      setGroupId(initialData?.groupId);

      const initialColorId = initialData?.colorId || "blue";
      setSelectedColorId(initialColorId);

      // Show title field if editing note or if title exists
      setShowTitleField(!!notesState.editingNote || !!initialData?.title);
    }
  }, [notesState.isFormOpen, notesState.editingNote, notesState.initialFormData]);

  const loadNotesData = useCallback(async () => {
    try {
      const data = await getAllNotes();
      setNotesData(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const formData: NoteFormData = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        colorId: selectedColorId,
      };

      if (notesState.editingNote) {
        // Update existing note
        await updateNote({
          data: {
            id: notesState.editingNote.id,
            updates: formData,
          },
        });
      } else {
        // Create new note with current domain and URL
        await createNote({
          data: {
            ...formData,
            domain: window.location.hostname,
            url: window.location.href,
          },
        });
      }
      dispatch(closeNoteForm());
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async (name: string, color: string) => {
    try {
      const newGroup = await createNoteGroup({
        data: { name, color },
      });
      // Reload notes data to get updated groups
      await loadNotesData();
      return newGroup;
    } catch (error) {
      console.error("Failed to create group:", error);
      throw error;
    }
  };

  // Handle position/size changes
  const handleModalStateChange = async (newState: { x: number; y: number; width: number; height: number }) => {
    setPanelPosition(newState);
    try {
      localStorage.setItem("hoverInspector.noteForm.panelState", JSON.stringify(newState));
    } catch (error) {
      console.error("Failed to save NoteForm panel position:", error);
    }
  };

  const handleCancel = () => {
    dispatch(closeNoteForm());
  };

  // Color management functions
  const handleSelectColor = (colorId: string) => {
    setSelectedColorId(colorId);
  };

  const openColorPopover = (colorId: string | "new") => {
    if (colorId === "new") {
      setTempColor("#2D3748"); // Default dark color as requested
    } else {
      const color = colorPalettes.find((c) => c.id === colorId);
      if (color) {
        setTempColor(color.value);
      }
    }
    setActivePopoverId(colorId);
  };

  const closeColorPopover = () => {
    setActivePopoverId(null);
  };

  const handleDeleteColor = (colorId: string) => {
    setColorPalettes((prev) => prev.filter((c) => c.id !== colorId));
    if (selectedColorId === colorId) {
      setSelectedColorId("blue"); // Default to blue
    }
    closeColorPopover();
  };

  const handleSaveColor = () => {
    if (activePopoverId === "new") {
      // Add new color
      const newColor: ColorPalette = {
        id: `custom-${Date.now()}`,
        name: `Custom ${tempColor}`,
        value: tempColor,
        isDefault: false,
        createdAt: Date.now(),
      };
      setColorPalettes((prev) => [...prev, newColor]);
      setSelectedColorId(newColor.id);
    } else if (activePopoverId) {
      // Update existing color
      setColorPalettes((prev) =>
        prev.map((c) => (c.id === activePopoverId ? { ...c, value: tempColor, name: `Custom ${tempColor}` } : c)),
      );
    }
    closeColorPopover();
  };

  // Create popover content for color picker
  const createColorPickerContent = (colorId: string | "new") => {
    const isEditing = colorId !== "new";
    const color = isEditing ? colorPalettes.find((c) => c.id === colorId) : null;
    const isDefaultColor = color?.isDefault;

    return (
      <div className="w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 m-0">{isEditing ? "Edit Color" : "Add New Color"}</h4>
        </div>

        <div className="my-3">
          <HexColorPicker color={tempColor} onChange={setTempColor} />
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleSaveColor}
            className="px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isEditing ? "Update" : "Add"}
          </button>
        </div>
      </div>
    );
  };

  if (!notesState.isFormOpen || !isPositionLoaded) return null;

  const formId = "hoverInspector-note-form";

  // For UI clarity, show the current selected color name and swatch
  const selectedColor = colorPalettes.find((c) => c.id === selectedColorId);

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
      footer={
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : notesState.editingNote ? "Update Note" : "Create Note"}
          </button>
        </div>
      }
    >
      <style>{NoteFormPopupStyles}</style>
      <form id={formId} onSubmit={handleSubmit}>
        <div className="p-5 overflow-y-auto flex-1">
          {!showTitleField ? (
            <button
              type="button"
              onClick={() => setShowTitleField(true)}
              className="w-full mb-4 flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-md bg-slate-50 text-slate-600 text-sm hover:bg-slate-100 hover:border-slate-400"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[12px] font-bold">
                +
              </span>
              Add title
            </button>
          ) : (
            <div className="mb-4">
              <label htmlFor="title" className="block mb-1 font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="content" className="block mb-1 font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
              className="block w-full min-h-[120px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-sm"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="group" className="block mb-1 font-medium text-gray-700">
              Group
            </label>
            <select
              id="group"
              value={groupId || ""}
              onChange={(e) => setGroupId(e.target.value || undefined)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-sm bg-white"
            >
              <option value="">No group</option>
              {notesData.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="color" className="block mb-1 font-medium text-gray-700">
              Color
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colorPalettes.map((colorPalette) => (
                <div key={colorPalette.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSelectColor(colorPalette.id)}
                    className={`w-[35px] h-[35px] rounded border-2 transition-transform hover:scale-110 ${
                      selectedColorId === colorPalette.id ? "border-indigo-500" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: colorPalette.value }}
                    aria-label={`Select ${colorPalette.name}`}
                  />

                  {selectedColorId === colorPalette.id && (
                    <span className="absolute -bottom-1 -right-1 text-[10px] leading-none bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow">
                      ✓
                    </span>
                  )}

                  <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover
                      content={createColorPickerContent(colorPalette.id)}
                      trigger="click"
                      placement="top"
                      open={activePopoverId === colorPalette.id}
                      // @ts-ignore
                      getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
                      onOpenChange={(visible) => {
                        if (visible) {
                          openColorPopover(colorPalette.id);
                        } else {
                          closeColorPopover();
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openColorPopover(colorPalette.id);
                        }}
                        className="w-5 h-5 rounded-full bg-white/90 hover:bg-white text-gray-700 border border-gray-200 shadow flex items-center justify-center text-[10px]"
                        aria-label={`Edit ${colorPalette.name}`}
                        title="Edit color"
                      >
                        ✎
                      </button>
                    </Popover>
                    {!colorPalette.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteColor(colorPalette.id);
                        }}
                        className="w-5 h-5 rounded-full bg-white/90 hover:bg-white text-red-600 border border-gray-200 shadow flex items-center justify-center text-[11px]"
                        aria-label={`Delete ${colorPalette.name}`}
                        title="Delete color"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <Popover
                content={createColorPickerContent("new")}
                trigger="click"
                placement="top"
                open={activePopoverId === "new"}
                // @ts-ignore
                getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
                onOpenChange={(visible) => {
                  if (visible) {
                    openColorPopover("new");
                  } else {
                    closeColorPopover();
                  }
                }}
              >
                <button
                  type="button"
                  className="w-8 h-8 rounded border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 flex items-center justify-center text-base font-bold hover:bg-slate-100 hover:border-slate-400"
                  aria-label="Add color"
                >
                  +
                </button>
              </Popover>
            </div>
          </div>
        </div>
      </form>
    </FloatingModal>
  );
};
