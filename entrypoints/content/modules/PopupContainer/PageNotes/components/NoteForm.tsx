import React, { useState, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover } from "antd";
import { NotesState, NoteFormData, ColorPalette, NoteViewType } from "@entrypoints/shared/types/notes";
import {
  getAllNotes,
  createNote,
  updateNote,
  createNoteGroup,
  getColorPalettes,
  createColorPalette,
  updateColorPalette,
  deleteColorPalette,
} from "@entrypoints/background/features/notesActionsSlice.ts";
import {
  PortalId,
  ScenarioPortalFooterButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { closeNoteForm, triggerRefresh } from "@entrypoints/content/store/notes/notes.slice.ts";
import { useDispatch } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { useDebouncedCallback } from "@entrypoints/shared/utils/useDebouncedCallback.ts";

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

interface NoteFormProps {
  editingNote?: any;
  initialFormData?: NoteFormData;
  formId: string;
  onCancel: () => void;
  showTitleField: boolean;
  onShowTitleFieldChange: (show: boolean) => void;
}

export const NoteForm: React.FC<NoteFormProps> = ({
  editingNote,
  initialFormData,
  formId,
  onCancel,
  showTitleField,
  onShowTitleFieldChange,
}) => {
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groupId, setGroupId] = useState<string | undefined>();
  const [selectedColorId, setSelectedColorId] = useState<string>("blue");
  const [elementXPath, setElementXPath] = useState<string | undefined>();
  const [attachmentType, setAttachmentType] = useState<"element" | "route" | "domain" | "global">("global");
  const [routePattern, setRoutePattern] = useState<string>("");
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [viewType, setViewType] = useState<NoteViewType>(NoteViewType.NOTE);
  const dispatch = useDispatch();
  const highlightOverlay = useHighlightOverlay();

  // Color management state
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(DEFAULT_COLORS);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  // Notes data state
  const [notesData, setNotesData] = useState<NotesState>({
    notes: [],
    groups: [],
    searchQuery: "",
    showOnlyCurrentDomain: false,
    selectedNoteId: undefined,
  });

  // Initialize form data
  useEffect(() => {
    loadNotesData();
    loadColorPalettes();

    // Initialize form with editing note data or initial data
    const initialData = editingNote
      ? {
          title: editingNote.title,
          content: editingNote.content,
          groupId: editingNote.groupId,
          colorId: editingNote.colorId,
          elementXPath: editingNote.elementXPath,
          attachmentType: editingNote.attachmentType,
          routePattern: editingNote.routePattern,
        }
      : initialFormData;

    setTitle(initialData?.title || "");
    setContent(initialData?.content || "");
    setGroupId(initialData?.groupId);
    setElementXPath(initialData?.elementXPath);
    setAttachmentType(initialData?.attachmentType || "global");
    setRoutePattern(initialData?.routePattern || "");

    const initialColorId = initialData?.colorId || "blue";
    setSelectedColorId(initialColorId);

    // Show title field if editing note or if title exists
    onShowTitleFieldChange(!!editingNote || !!initialData?.title);
  }, [editingNote, initialFormData]);

  const loadNotesData = useCallback(async () => {
    try {
      const data = await getAllNotes();
      setNotesData(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }, []);

  const loadColorPalettes = useCallback(async () => {
    try {
      const savedColors = await getColorPalettes();
      if (savedColors.length > 0) {
        setColorPalettes(savedColors);
      } else {
        // Initialize with default colors if none exist
        setColorPalettes(DEFAULT_COLORS);
        // Save default colors to localStorage
        for (const color of DEFAULT_COLORS) {
          await createColorPalette({ data: color });
        }
      }
    } catch (err) {
      console.error("Failed to load color palettes:", err);
      setColorPalettes(DEFAULT_COLORS);
    }
  }, []);

  const handleElementSelection = useCallback(() => {
    if (isSelectingElement) {
      // Cancel selection
      setIsSelectingElement(false);
      highlightOverlay.stopSelectionMode();
      return;
    }

    setIsSelectingElement(true);
    const subscription = highlightOverlay.streamSelectionMode().subscribe({
      next: (event) => {
        if (event.type === "selected") {
          // Generate XPath for the selected element
          const xpath = highlightOverlay.generateXPath(event.element);
          setElementXPath(xpath);
          setIsSelectingElement(false);
          subscription.unsubscribe();
        }
      },
      error: (err) => {
        console.error("Element selection failed:", err);
        setIsSelectingElement(false);
        subscription.unsubscribe();
      },
    });

    // Auto-cancel after 10 seconds
    setTimeout(() => {
      if (!subscription.closed) {
        setIsSelectingElement(false);
        subscription.unsubscribe();
      }
    }, 10000);
  }, [isSelectingElement, highlightOverlay]);

  const handleClearElementAttachment = useCallback(() => {
    setElementXPath(undefined);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setSubmitError("Content is required");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formData: NoteFormData = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        colorId: selectedColorId,
        elementXPath,
        attachmentType,
        routePattern: routePattern.trim() || undefined,
      };

      if (editingNote) {
        // Update existing note
        await updateNote({
          id: editingNote.id,
          updates: formData,
        });
      } else {
        // Create new note with current domain and URL
        await createNote({
          ...formData,
          domain: window.location.hostname,
          url: window.location.href,
        });
      }

      // Trigger refresh in other components
      dispatch(triggerRefresh());
      dispatch(closeNoteForm());
    } catch (error) {
      console.error("Failed to save note:", error);
      setSubmitError("Failed to save note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isSubmitting && content.trim()) {
        handleSubmit(e as any);
      }
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

  // Color management functions
  const handleSelectColor = (colorId: string) => {
    setSelectedColorId(colorId);
  };

  const openColorPopover = (colorId: string | "new") => {
    setActivePopoverId(colorId);
  };

  const closeColorPopover = () => {
    setActivePopoverId(null);
  };

  const handleDeleteColor = async (colorId: string) => {
    try {
      await deleteColorPalette({ data: colorId });
      if (selectedColorId === colorId) {
        setSelectedColorId("blue"); // Default to blue
      }
      closeColorPopover();
      // Reload colors from localStorage
      await loadColorPalettes();
    } catch (error) {
      console.error("Failed to delete color palette:", error);
    }
  };

  const handleColorChange = useDebouncedCallback(async (colorId: string | "new", newColor: string) => {
    try {
      if (colorId === "new") {
        const newColorPalette: ColorPalette = {
          id: `custom-${Date.now()}`,
          name: `Custom ${newColor}`,
          value: newColor,
          isDefault: false,
          createdAt: Date.now(),
        };
        await createColorPalette({ data: newColorPalette });
        setSelectedColorId(newColorPalette.id);
        openColorPopover(newColorPalette.id);
        // Reload colors from localStorage
        await loadColorPalettes();
      } else if (colorId) {
        // Update existing color directly
        await updateColorPalette({
          data: {
            id: colorId,
            updates: {
              value: newColor,
              name: `Custom ${newColor}`,
            },
          },
        });
        // Reload colors from localStorage
        await loadColorPalettes();
      }
    } catch (error) {
      console.error("Failed to save color palette:", error);
    }
  }, 200);

  const createColorPickerContent = (colorId: string | "new") => {
    // Get the current color value directly from the palette or use default
    const currentColor =
      colorId === "new" ? "#2D3748" : colorPalettes.find((c) => c.id === colorId)?.value || "#2D3748";

    return <HexColorPicker color={currentColor} onChange={(newColor) => handleColorChange(colorId, newColor)} />;
  };

  return (
    <form id={formId} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <div className="overflow-y-auto flex-1 flex flex-col gap-2">
        {/* Error message display */}
        {submitError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-red-700 font-medium">{submitError}</p>
            </div>
          </div>
        )}
        {/* Title Section with improved styling */}
        {!showTitleField ? (
          <button
            type="button"
            onClick={() => onShowTitleFieldChange(true)}
            className="group w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-indigo-200 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 text-sm font-medium hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all duration-200"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 text-sm font-bold transition-colors duration-200">
              +
            </span>
            <span>Add a title to organize your note</span>
          </button>
        ) : (
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-800">
              Note Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your note a descriptive title..."
              className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 text-sm transition-all duration-200 hover:border-gray-300"
            />
          </div>
        )}

        {/* Content Section with improved styling */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-semibold text-gray-800">
            Content <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here... You can add detailed information, links, or any important details you want to remember."
              className="block w-full min-h-[140px] rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 text-sm transition-all duration-200 hover:border-gray-300 resize-none"
              required
            />
            {content.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {content.length} characters
              </div>
            )}
          </div>
        </div>

        {/* Group Selection with improved styling */}
        <div className="space-y-2">
          <label htmlFor="group" className="block text-sm font-semibold text-gray-800">
            Organization
          </label>
          <div className="relative">
            <select
              id="group"
              value={groupId || ""}
              onChange={(e) => setGroupId(e.target.value || undefined)}
              className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 text-sm bg-white transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
            >
              <option value="">📝 No group (standalone note)</option>
              {notesData.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  📁 {group.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500">Group your notes by topic or project for better organization</p>
        </div>

        {/* View Type Selection with improved styling */}
        <div className="space-y-2">
          <label htmlFor="viewType" className="block text-sm font-semibold text-gray-800">
            Display Type
          </label>
          <div className="relative">
            <select
              id="viewType"
              value={viewType}
              onChange={(e) => setViewType(e.target.value as NoteViewType)}
              className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 text-sm bg-white transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
            >
              <option value={NoteViewType.NOTE}>📝 Note View (detailed card)</option>
              <option value={NoteViewType.CHIP}>🏷️ Chip View (compact badge)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500">Choose how this note will be displayed in the notes list</p>
        </div>

        {/* Element Attachment with improved styling */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">Page Element Connection</label>
          <div className="space-y-3">
            {elementXPath ? (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Successfully attached to page element</p>
                  <p className="text-xs text-green-600">This note will highlight the connected element when viewed</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearElementAttachment}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md bg-white hover:bg-red-50 transition-colors duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleElementSelection}
                disabled={isSelectingElement}
                className={`group w-full p-4 rounded-lg border-2 border-dashed text-sm font-medium transition-all duration-200 ${
                  isSelectingElement
                    ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 text-amber-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300 hover:text-indigo-700"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                      isSelectingElement ? "bg-amber-100" : "bg-gray-200 group-hover:bg-indigo-100"
                    }`}
                  >
                    {isSelectingElement ? (
                      <svg
                        className="w-4 h-4 text-amber-600 animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 group-hover:text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    )}
                  </div>
                  <span>
                    {isSelectingElement ? "Click on any element on the page..." : "Connect to a page element"}
                  </span>
                </div>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Connect your note to a specific element on this page to create contextual annotations
          </p>
        </div>

        {/* Attachment Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">Note Visibility & Attachment</label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { value: "global", label: "🌐 Global", desc: "Show on all pages" },
                { value: "domain", label: "🏠 Domain", desc: "Show on this domain only" },
                { value: "route", label: "🛣️ Route", desc: "Show on specific routes" },
                { value: "element", label: "🎯 Element", desc: "Attach to page element" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAttachmentType(option.value as any)}
                  className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                    attachmentType === option.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-75 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>

            {attachmentType === "route" && (
              <div className="space-y-2">
                <label htmlFor="routePattern" className="block text-sm font-medium text-gray-700">
                  Route Pattern
                </label>
                <input
                  id="routePattern"
                  type="text"
                  value={routePattern}
                  onChange={(e) => setRoutePattern(e.target.value)}
                  placeholder="/user/*, /product/:id, /dashboard/settings"
                  className="block w-full rounded-md border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm transition-all duration-200 hover:border-gray-300"
                />
                <p className="text-xs text-gray-500">
                  Use * for wildcards, :param for parameters (e.g., /user/*, /product/:id)
                </p>
              </div>
            )}

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Current:</strong>{" "}
                {attachmentType === "global"
                  ? "This note will appear on all pages"
                  : attachmentType === "domain"
                    ? `This note will only appear on ${window.location.hostname}`
                    : attachmentType === "route"
                      ? `This note will appear on routes matching: ${routePattern || "pattern not set"}`
                      : "This note will be attached to the selected page element"}
              </p>
            </div>
          </div>
        </div>

        {/* Color Selection with improved styling */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">Note Color Theme</label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-3 mb-3">
              {colorPalettes.map((colorPalette) => (
                <div key={colorPalette.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSelectColor(colorPalette.id)}
                    className={`w-10 h-10 rounded-lg border-3 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                      selectedColorId === colorPalette.id
                        ? "border-indigo-500 shadow-lg ring-2 ring-indigo-200"
                        : "border-white shadow-sm hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: colorPalette.value }}
                    aria-label={`Select ${colorPalette.name}`}
                    title={colorPalette.name}
                  />

                  {selectedColorId === colorPalette.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                        className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md flex items-center justify-center text-xs transition-all duration-200"
                        aria-label={`Edit ${colorPalette.name}`}
                        title="Customize color"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </Popover>
                    {!colorPalette.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${colorPalette.name}" color?`)) {
                            handleDeleteColor(colorPalette.id);
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-white hover:bg-red-50 text-red-500 hover:text-red-600 border border-red-300 hover:border-red-400 shadow-sm hover:shadow-md flex items-center justify-center text-xs transition-all duration-200"
                        aria-label={`Delete ${colorPalette.name}`}
                        title="Delete custom color"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add new color button */}
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
                  className="w-10 h-10 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-400 flex items-center justify-center text-lg font-bold transition-all duration-200 hover:scale-105"
                  aria-label="Add custom color"
                  title="Create custom color"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </Popover>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">
                Selected:{" "}
                <span
                  className="font-medium"
                  style={{ color: colorPalettes.find((c) => c.id === selectedColorId)?.value }}
                >
                  {colorPalettes.find((c) => c.id === selectedColorId)?.name}
                </span>
              </p>
              <p className="text-xs text-gray-500">Choose a color to help categorize and identify your note</p>
            </div>
          </div>
        </div>
      </div>

      <ScenarioPortalFooterButtons portalId={PortalId.FUNCTIONS_TAB} containerId="hover-inspector-popup-footer-note">
        <div className="flex justify-between items-center gap-4 p-6 border-t border-gray-200 bg-gray-50">
          {/* Helper text */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Press Ctrl+Enter to save quickly</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 transition-all duration-200 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              disabled={!content.trim() || isSubmitting}
              className="group px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : editingNote ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Update Note
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Note
                </>
              )}
            </button>
          </div>
        </div>
      </ScenarioPortalFooterButtons>
    </form>
  );
};
