import React, { useState, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Button, Input, Popover, Select, Space } from "antd";
import {
  NotesState,
  NoteFormData,
  ColorPalette,
  NoteViewType,
  ExtendedNoteFormData,
  AttachmentType,
  RouteInputMode,
} from "@entrypoints/shared/types/notes";
import {
  getAllNotes,
  createNote,
  updateNote,
  createNoteGroup,
  getColorPalettes,
  createColorPalette,
  updateColorPalette,
  deleteColorPalette,
  notesActionsSlice,
} from "@entrypoints/background/store/notesActionsSlice.ts";
import {
  PortalId,
  ScenarioPortalFooterButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { closeNoteForm, triggerRefresh } from "@entrypoints/content/store/notes/notes.slice.ts";
import { useDispatch } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { useDebouncedCallback } from "@entrypoints/shared/utils/useDebouncedCallback.ts";
import {
  FiChevronDown,
  FiFileText,
  FiTag,
  FiGlobe,
  FiMap,
  FiTarget,
  FiEdit2,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiCode,
  FiType,
} from "react-icons/fi";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { AimOutlined, SelectOutlined } from "@ant-design/icons";
import { IconRegex, IconWorldWww } from "@tabler/icons-react";

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
  const [attachmentType, setAttachmentType] = useState<AttachmentType>("route");
  const [routePattern, setRoutePattern] = useState<string>("");
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [viewType, setViewType] = useState<NoteViewType>(NoteViewType.NOTE);
  // Multi-location support
  const [addToExistingNote, setAddToExistingNote] = useState<boolean>(false);
  const [existingNoteId, setExistingNoteId] = useState<string | undefined>();
  // New UI states
  const [elementPaths, setElementPaths] = useState<string[]>([]);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [routeInputMode, setRouteInputMode] = useState<RouteInputMode>("string");
  const [routeInputValue, setRouteInputValue] = useState<string>("");

  // State for regex mode and domain validation (from TriggerForm)
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [domainValidationError, setDomainValidationError] = useState<string | null>(null);

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
    const normalizedAttachmentType =
      initialData?.attachmentType === "domain" ? "route" : initialData?.attachmentType || "global";
    const normalizedRoutePattern = initialData?.attachmentType === "domain" ? "" : initialData?.routePattern || "";
    setAttachmentType(normalizedAttachmentType as any);
    setRoutePattern(normalizedRoutePattern);

    // Initialize buffers for new UI
    setRouteInputValue(normalizedRoutePattern);
    setElementPaths(initialData?.elementXPath ? [initialData.elementXPath] : []);

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
          // Add to list and keep legacy field for first path
          setElementPaths((prev) => [...prev, xpath]);
          setElementXPath((prev) => prev || xpath);

          setIsSelectingElement(false);
          subscription.unsubscribe();
          highlightOverlay.stopMouseMoveHighlight();
        }
      },
      error: (err) => {
        console.error("Element selection failed:", err);
        setIsSelectingElement(false);
        subscription.unsubscribe();
        highlightOverlay.stopMouseMoveHighlight();
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

  // Helpers for selectors list
  const handleRemoveSelector = (index: number) => setElementPaths((prev) => prev.filter((_, i) => i !== index));

  // Scope toggle helpers
  const toggleToPageOnly = () => {
    setAttachmentType("route");
    if (!routePattern) setRoutePattern(window.location.pathname);
  };
  const toggleToGlobal = () => setAttachmentType("global");

  // Route edit helpers
  const startEditRoute = () => {
    // open combined domain+route editor
    const currentRouteDisplay = routePattern
      ? `${window.location.hostname}${routePattern}`
      : `${window.location.hostname}/`;
    setRouteInputValue(currentRouteDisplay);
    setIsEditingRoute(true);
  };
  const cancelEditRoute = () => {
    // discard changes
    setIsEditingRoute(false);
    setRouteInputValue(routePattern ? `${window.location.hostname}${routePattern}` : `${window.location.hostname}/`);
  };
  const saveRouteEdit = () => {
    // Parse combined input into routePattern (keep domain as current hostname)
    const v = routeInputValue.trim();
    let newRoute = v;

    try {
      if (!v) {
        newRoute = "";
      } else if (v.startsWith("/")) {
        // user entered a path only
        newRoute = v;
      } else if (v.startsWith("http://") || v.startsWith("https://")) {
        // full URL — extract pathname + search
        const url = new URL(v);
        newRoute = url.pathname + (url.search || "");
      } else if (v.startsWith(window.location.hostname)) {
        // input starts with hostname — strip it
        newRoute = v.slice(window.location.hostname.length) || "/";
        if (!newRoute.startsWith("/")) newRoute = "/" + newRoute;
      } else if (v.includes("/")) {
        // user typed something like "domain/path" or "domain.com/path"
        const parts = v.split("/");
        // treat first part as domain if it contains a dot, otherwise keep as path
        if (parts[0].includes(".")) {
          newRoute = "/" + parts.slice(1).join("/");
        } else {
          newRoute = v.startsWith("/") ? v : "/" + v;
        }
      } else {
        // single segment, treat as path
        newRoute = v.startsWith("/") ? v : "/" + v;
      }
    } catch (err) {
      // fallback: treat as path
      newRoute = v.startsWith("/") ? v : "/" + v;
    }

    // normalize: empty or "/" means entire domain (store empty)
    if (newRoute === "/") newRoute = "";

    setRoutePattern(newRoute);
    setIsEditingRoute(false);
  };

  // Handler functions from TriggerForm
  const handleRegexToggle = (checked: boolean) => {
    setUseRegex(checked);
    // Validate current pattern with new regex setting
    const pattern = routeInputValue;
    if (pattern) {
      // Simple validation - you can enhance this
      setDomainValidationError(null);
    }
  };

  const handleDomainPatternChange = (value: string) => {
    // Simple validation - you can enhance this based on TriggerForm logic
    setDomainValidationError(null);
  };

  const handleAddCurrentUrl = () => {
    try {
      const currentUrl = window.location.href;
      setRouteInputValue(currentUrl);
    } catch (error) {
      console.error("Failed to get current URL:", error);
    }
  };

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
      const trimmedRoute = routePattern.trim();
      const normalizedAttachmentType = attachmentType === "route" && !trimmedRoute ? "domain" : attachmentType;

      // Use first selector for backward compatibility
      const firstXPath = elementPaths.find((p) => p && p.trim());

      const formData: ExtendedNoteFormData = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        colorId: selectedColorId,
        elementXPath: firstXPath || undefined,
        elementPaths,
        attachmentType: normalizedAttachmentType,
        routePattern: trimmedRoute || undefined,
        addToExistingNote,
        existingNoteId,
        viewType,
        routeInputMode,
      };

      if (editingNote) {
        // Update existing note
        await updateNote({
          id: editingNote.id,
          updates: formData,
        });
      } else {
        // Create new note with current domain and URL
        notesActionsSlice.createNote({
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
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Group your notes by topic or project for better organization</p>
        </div>

        {/* Multi-location Note Selection */}
        {!editingNote && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Note Location</label>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="createNew"
                  name="noteMode"
                  checked={!addToExistingNote}
                  onChange={() => {
                    setAddToExistingNote(false);
                    setExistingNoteId(undefined);
                  }}
                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <label htmlFor="createNew" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Create new note
                  </label>
                  <p className="text-xs text-gray-500">Create a brand new note for this page</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="addToExisting"
                  name="noteMode"
                  checked={addToExistingNote}
                  onChange={() => setAddToExistingNote(true)}
                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <label htmlFor="addToExisting" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Add to existing note
                  </label>
                  <p className="text-xs text-gray-500">Add this page location to an existing note</p>

                  {addToExistingNote && (
                    <div className="mt-2">
                      <select
                        value={existingNoteId || ""}
                        onChange={(e) => setExistingNoteId(e.target.value || undefined)}
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm bg-white transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                        required={addToExistingNote}
                      >
                        <option value="">Select an existing note...</option>
                        {notesData.notes
                          .filter((note) => note.content && note.content.trim())
                          .map((note) => (
                            <option key={note.id} value={note.id}>
                              {note.title
                                ? `${note.title} - ${note.content.substring(0, 50)}...`
                                : note.content.substring(0, 70) + (note.content.length > 70 ? "..." : "")}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Type Selection with improved styling */}
        <div className="space-y-2">
          <label htmlFor="viewType" className="block text-sm font-semibold text-gray-800">
            Display Type
          </label>
          <Select
            id="viewType"
            size="large"
            className="w-full"
            value={viewType}
            onChange={(v) => setViewType(v as NoteViewType)}
            // @ts-ignore
            getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
            options={[
              {
                value: NoteViewType.NOTE,
                label: (
                  <span className="flex items-center gap-2">
                    <FiFileText className="text-gray-600" />
                    <span>Note View (detailed card)</span>
                  </span>
                ),
              },
              {
                value: NoteViewType.CHIP,
                label: (
                  <span className="flex items-center gap-2">
                    <FiTag className="text-gray-600" />
                    <span>Chip View (compact badge)</span>
                  </span>
                ),
              },
            ]}
          />
          <p className="text-xs text-gray-500">Choose how this note will be displayed in the notes list</p>
        </div>

        {/* Attachment Type Selection */}
        {/*
          Replaced original block with improved Tailwind card styles, clearer domain+route single input
          and nicer element-selector UI. Kept logic unchanged.
        */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">Note Visibility & Attachment</label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Scope toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Scope</span>
              <div className="inline-flex rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={toggleToPageOnly}
                  className={`px-3 py-1.5 text-sm flex items-center gap-2 ${attachmentType !== "global" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  title="Apply to this page (domain/route)"
                >
                  <FiMap className="w-4 h-4" /> <span className="hidden sm:inline">This page only</span>
                </button>
                <button
                  type="button"
                  onClick={toggleToGlobal}
                  className={`px-3 py-1.5 text-sm flex items-center gap-2 border-l border-gray-200 ${attachmentType === "global" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  title="Apply across all pages"
                >
                  <FiGlobe className="w-4 h-4" /> <span className="hidden sm:inline">Global view</span>
                </button>
              </div>
            </div>

            {/* Page-specific configuration when not global */}
            {attachmentType !== "global" && (
              <div className="space-y-4 pt-3 border-t border-gray-200">
                {/* Combined Domain/Route Section */}
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Domain</span>
                        <span className="font-medium text-blue-700">{window.location.hostname}</span>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="text-xs text-gray-500">Route</span>
                        <span className="ml-2 font-medium text-green-700">{routePattern || "*"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={startEditRoute}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 bg-white text-sm hover:shadow-sm"
                        title="Edit domain and route pattern"
                      >
                        <FiEdit2 className="w-4 h-4 text-gray-600" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </div>
                  </div>

                  {isEditingRoute && (
                    <div className="mt-3">
                      <div className="space-y-2">
                        <Input.Group compact>
                          <Input
                            value={routeInputValue}
                            onChange={(e) => {
                              setRouteInputValue(e.target.value);
                              handleDomainPatternChange(e.target.value);
                            }}
                            placeholder={
                              useRegex
                                ? `${window.location.hostname} ^/users/\\d+$`
                                : `${window.location.hostname}/users/*`
                            }
                            className="rounded-l-md"
                          />
                          <Tooltip title={useRegex ? "Regex mode" : "Simple mode"}>
                            <Button
                              type={useRegex ? "primary" : "default"}
                              onClick={() => handleRegexToggle(!useRegex)}
                              className="border-l"
                            >
                              {useRegex ? <FiCode /> : <FiType />}
                            </Button>
                          </Tooltip>
                          <Button onClick={handleAddCurrentUrl} className="ml-2">
                            Add Current URL
                          </Button>
                        </Input.Group>

                        <div className="flex items-center gap-2 mt-3">
                          <Button type="default" onClick={saveRouteEdit} icon={<FiSave />} size="small">
                            Save
                          </Button>
                          <Button onClick={cancelEditRoute} icon={<FiX />} size="small">
                            Cancel
                          </Button>
                          <p className="text-xs text-gray-500 ml-4">
                            {routeInputMode === "string"
                              ? "Use * for wildcards or full domain/path. Empty or '/' applies to the whole domain."
                              : "Regex mode: enter a regular expression for matching routes."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Element Connection Section */}
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <label className="block text-sm font-semibold text-gray-800 mb-0">Page Element Connection</label>
                    </div>

                    <div className="flex items-center gap-2"></div>
                  </div>

                  <>
                    <Input
                      value={elementXPath || ""}
                      onChange={(e) => setElementXPath(e.target.value)}
                      placeholder="Primary XPath or selector (kept for compatibility)"
                      className="mb-3"
                    />

                    <div className="space-y-2">
                      {elementPaths.length === 0 ? (
                        <p className="text-xs text-gray-500">No selectors yet. Use Select or Add to create one.</p>
                      ) : (
                        elementPaths.map((path, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={path}
                              onChange={(e) =>
                                setElementPaths((prev) => prev.map((p, i) => (i === idx ? e.target.value : p)))
                              }
                              placeholder="XPath or selector for the element"
                            />
                            <Button
                              danger
                              size="small"
                              icon={<FiTrash2 />}
                              onClick={() => handleRemoveSelector(idx)}
                              title="Remove selector"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Color Selection with improved styling */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">Note Color Theme</label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-3 ">
              {colorPalettes.map((colorPalette) => (
                <div key={colorPalette.id} className="relative group w-10 h-10">
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
                          handleDeleteColor(colorPalette.id);
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
          </div>
        </div>
      </div>

      <ScenarioPortalFooterButtons portalId={PortalId.FUNCTIONS_TAB} containerId="hover-inspector-popup-footer-note">
        <div className="flex justify-between items-center gap-4 p-3 border-t border-gray-200 bg-white">
          {/* Action buttons */}
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
      </ScenarioPortalFooterButtons>
    </form>
  );
};
