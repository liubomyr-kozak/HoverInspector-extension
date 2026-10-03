import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Subscription } from "rxjs";
import { toast } from "react-toastify";
import { HexColorPicker } from "react-colorful";
import { Button, Checkbox, Input, Popover, Select, Space } from "antd";
import {
  NotesState,
  Note,
  NoteLocation,
  ColorPalette,
  NoteViewType,
  AttachmentType,
  AttachmentTypeEnum,
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
} from "@entrypoints/background/store/notesActionsSlice.ts";
import { DEFAULT_NOTE_COLORS } from "@entrypoints/background/services/notes.ts";
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  getFreeNotePosition,
} from "../VisibleNotesProvider/notePosition";
import {
  PortalId,
  ScenarioPortalFooterButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { closeNoteForm, triggerRefresh } from "@entrypoints/content/store/notes/notes.slice.ts";
import { useDispatch } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { useDebouncedCallback } from "@entrypoints/shared/utils/useDebouncedCallback.ts";
import { FiChevronDown, FiFileText, FiTag, FiGlobe, FiMap, FiPlus, FiTrash2 } from "react-icons/fi";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { AimOutlined, SelectOutlined } from "@ant-design/icons";
import { BsRegex } from "react-icons/bs";
import { TbWorldWww } from "react-icons/tb";

// Default color palette with IDs
const DEFAULT_COLORS: ColorPalette[] = DEFAULT_NOTE_COLORS;

// A location being edited in the form; isMain marks the location for the current page
type FormLocation = Omit<NoteLocation, "domain" | "url"> & { domain?: string; url?: string; isMain?: boolean };

// Location of the current page with the given extra fields
const createCurrentPageLocation = (overrides: Partial<FormLocation> = {}): FormLocation => ({
  attachmentType: AttachmentTypeEnum.ROUTE,
  domain: window.location.hostname,
  url: window.location.href,
  routePattern: window.location.pathname,
  patternType: "url",
  ...overrides,
});

// Time after which an unfinished element selection is cancelled
const ELEMENT_SELECTION_TIMEOUT = 30000;

interface NoteFormProps {
  editingNote?: any;
  initialFormData?: Partial<Note>;
  formId: string;
  onCancel: () => void;
  showTitleField: boolean;
  onShowTitleFieldChange: (show: boolean) => void;
}

// Add enum for tab management
enum SettingsTabEnum {
  ORGANIZATION = "organization",
  DISPLAY = "display",
  VISIBILITY = "visibility",
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
  const [attachmentType, setAttachmentType] = useState<AttachmentType>(AttachmentTypeEnum.ROUTE); // Default to route
  const [routePattern, setRoutePattern] = useState<string>("");
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [viewType, setViewType] = useState<NoteViewType>(NoteViewType.NOTE);
  // New UI states
  const [elementPaths, setElementPaths] = useState<string[]>([]);
  const [routeInputValue, setRouteInputValue] = useState<string>("");

  // Locations array state for multi-location support
  const [locations, setLocations] = useState<FormLocation[]>([]);

  // Domain checkbox state
  const [useDomainRule, setUseDomainRule] = useState(false);

  // Tab-based state management - refactored to use enum
  const [activeTab, setActiveTab] = useState<SettingsTabEnum | null>(null);

  const dispatch = useDispatch();
  const highlightOverlay = useHighlightOverlay();

  // Color management state
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(DEFAULT_COLORS);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  // New group input (Organization tab)
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Active element selection (picker) and its auto-cancel timer
  const selectionRef = useRef<Subscription | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notes data state
  const [notesData, setNotesData] = useState<NotesState>({
    notes: [],
    groups: [],
    searchQuery: "",
    selectedNoteId: undefined,
  });

  // Initialize form data
  useEffect(() => {
    loadNotesData();
    loadColorPalettes();

    // Initialize form with editing note data or initial data
    const initialData: Partial<Note> & Record<string, any> = editingNote || initialFormData || {};

    setTitle(initialData.title || "");
    setContent(initialData.content || "");
    setGroupId(initialData.groupId);
    setViewType(initialData.viewType || NoteViewType.NOTE);

    // Initialize locations array from existing data (kept as-is, incl. domain, coordinates and
    // patternType) or create a default location for the current page
    if (initialData.locations && initialData.locations.length > 0) {
      const isGlobal = initialData.locations.every((loc) => loc.attachmentType === AttachmentTypeEnum.GLOBAL);
      setAttachmentType(isGlobal ? AttachmentTypeEnum.GLOBAL : AttachmentTypeEnum.ROUTE);
      setLocations(initialData.locations.map((loc, index) => ({ ...loc, isMain: index === 0 })));

      const mainLocation = initialData.locations[0];
      setElementXPath(mainLocation.elementXPath);
      setRoutePattern(mainLocation.routePattern || "");
    } else {
      // Create default location from legacy fields or current page
      const legacyAttachmentType =
        initialData.attachmentType === AttachmentTypeEnum.GLOBAL ? AttachmentTypeEnum.GLOBAL : AttachmentTypeEnum.ROUTE;
      setAttachmentType(legacyAttachmentType);
      setLocations([
        createCurrentPageLocation({
          attachmentType: legacyAttachmentType,
          elementXPath: initialData.elementXPath,
          routePattern: initialData.routePattern || window.location.pathname,
          isMain: true,
        }),
      ]);
      setElementXPath(initialData.elementXPath);
      setRoutePattern(initialData.routePattern || window.location.pathname);
    }

    setElementPaths(initialData.elementXPath ? [initialData.elementXPath] : []);

    setSelectedColorId(initialData.colorId || "blue");

    // Check if domain rule exists for current hostname
    const currentHostname = window.location.hostname;
    const hasDomainRule =
      initialData.locations?.some((loc) => loc.attachmentType === "domain" && loc.domain === currentHostname) || false;
    setUseDomainRule(hasDomainRule);

    // Show title field if editing note or if title exists
    onShowTitleFieldChange(!!editingNote || !!initialData.title);
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
      // The background seeds the default colors (with fixed ids) when none are stored
      const savedColors = await getColorPalettes();
      setColorPalettes(savedColors?.length ? savedColors : DEFAULT_COLORS);
    } catch (err) {
      console.error("Failed to load color palettes:", err);
      setColorPalettes(DEFAULT_COLORS);
    }
  }, []);

  // Ends the element picker on every exit path (selected, Esc, error, timeout, cancel, unmount)
  const finishElementSelection = useCallback(() => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }
    const subscription = selectionRef.current;
    selectionRef.current = null;
    subscription?.unsubscribe();
    highlightOverlay.stopMouseMoveHighlight();
    setIsSelectingElement(false);
  }, [highlightOverlay]);

  useEffect(() => () => finishElementSelection(), [finishElementSelection]);

  const handleElementSelection = useCallback(
    (locationIndex: number) => {
      if (selectionRef.current) {
        // Cancel selection
        finishElementSelection();
        return;
      }

      setIsSelectingElement(true);
      selectionRef.current = highlightOverlay.streamSelectionMode().subscribe({
        next: (event) => {
          if (event.type === "selected" && event.element) {
            // Generate XPath for the selected element
            const xpath = event.xpath || highlightOverlay.generateXPath(event.element as Element);
            // Add to list and keep legacy field for first path
            setElementPaths((prev) => [...prev, xpath]);
            setElementXPath((prev) => prev || xpath);

            // Attach the location to the element; its old position no longer applies
            setLocations((prev) =>
              prev.map((loc, i) => {
                if (i !== locationIndex) return loc;
                const { coordinates, ...rest } = loc;
                return {
                  ...rest,
                  elementXPath: xpath,
                  ...(coordinates?.width ? { coordinates: { x: 0, y: 0, width: coordinates.width, height: coordinates.height } } : {}),
                };
              }),
            );
          }

          if (event.type === "selected" || event.type === "stopped") {
            finishElementSelection();
          }
        },
        error: (err) => {
          console.error("Element selection failed:", err);
          finishElementSelection();
        },
        complete: () => finishElementSelection(),
      });

      // Auto-cancel when nothing was picked
      selectionTimeoutRef.current = setTimeout(finishElementSelection, ELEMENT_SELECTION_TIMEOUT);
    },
    [highlightOverlay, finishElementSelection],
  );

  // Scope toggle helpers - refactored to use enum
  const toggleToPageOnly = () => {
    setAttachmentType(AttachmentTypeEnum.ROUTE);
    if (!routePattern) setRoutePattern(window.location.pathname);
    // A note that was global has no page location yet: start with the current page
    setLocations((prev) =>
      prev.some((loc) => loc.attachmentType !== AttachmentTypeEnum.GLOBAL)
        ? prev
        : [
            createCurrentPageLocation({
              coordinates: prev[0]?.coordinates,
              isMain: true,
            }),
          ],
    );
  };

  const toggleToGlobal = () => {
    setAttachmentType(AttachmentTypeEnum.GLOBAL);
  };

  const handleAddCurrentUrl = (index: number) => {
    try {
      const currentUrl = window.location.href;
      setRouteInputValue(currentUrl);

      updateLocation(index, {
        routePattern: window.location.pathname,
        patternType: "url",
        domain: window.location.hostname,
        url: currentUrl,
      });
    } catch (error) {
      console.error("Failed to get current URL:", error);
    }
  };

  // Location management functions
  const addNewLocation = () => {
    setLocations((prev) => [...prev, createCurrentPageLocation({ isMain: false })]);
  };

  const removeLocation = (index: number) => {
    setLocations((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Keep one main location
      if (next.length > 0 && !next.some((loc) => loc.isMain)) next[0] = { ...next[0], isMain: true };
      return next;
    });
  };

  const updateLocation = (index: number, updates: Partial<(typeof locations)[0]>) => {
    setLocations((prev) => prev.map((loc, i) => (i === index ? { ...loc, ...updates } : loc)));
  };

  const setMainLocation = (index: number) => {
    setLocations((prev) => prev.map((loc, i) => ({ ...loc, isMain: i === index })));
  };

  // Domain checkbox handler
  const handleDomainCheckboxChange = (checked: boolean) => {
    const currentHostname = window.location.hostname;

    const isCurrentDomainLocation = (loc: FormLocation) =>
      loc.attachmentType === AttachmentTypeEnum.DOMAIN &&
      (loc.domain === currentHostname || loc.routePattern === currentHostname);

    if (checked) {
      // Add domain location if it doesn't exist
      setLocations((prev) =>
        prev.some(isCurrentDomainLocation)
          ? prev
          : [
              ...prev,
              {
                attachmentType: AttachmentTypeEnum.DOMAIN,
                domain: currentHostname,
                url: window.location.href,
                routePattern: currentHostname,
                isMain: false,
              },
            ],
      );
    } else {
      // Remove domain location for current hostname
      setLocations((prev) => {
        const next = prev.filter((loc) => !isCurrentDomainLocation(loc));
        if (next.length > 0 && !next.some((loc) => loc.isMain)) next[0] = { ...next[0], isMain: true };
        return next;
      });
    }

    setUseDomainRule(checked);
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
      // Create locations array from the form data; existing locations keep their own
      // domain, url, coordinates and pattern type
      const toNoteLocation = ({ isMain, ...location }: FormLocation): NoteLocation => ({
        ...location,
        domain: location.domain || window.location.hostname,
        url: location.url || window.location.href,
        ...(location.attachmentType === AttachmentTypeEnum.ROUTE ? { patternType: location.patternType || "url" } : {}),
      });

      const mainFirst = [...locations].sort((a, b) => Number(!!b.isMain) - Number(!!a.isMain));
      let noteLocations: NoteLocation[];

      if (attachmentType === AttachmentTypeEnum.GLOBAL) {
        // Global view: one location shown on every page (keeps the saved position/size)
        const main = mainFirst[0];
        noteLocations = [
          {
            attachmentType: AttachmentTypeEnum.GLOBAL,
            domain: main?.domain || window.location.hostname,
            url: main?.url || window.location.href,
            ...(main?.coordinates && !main.coordinates.relativeToElement ? { coordinates: main.coordinates } : {}),
          },
        ];
      } else {
        noteLocations = mainFirst.map(toNoteLocation);

        // Ensure we have at least one location
        if (noteLocations.length === 0) {
          noteLocations.push(toNoteLocation(createCurrentPageLocation({ elementXPath })));
        }

        const invalidLocation = noteLocations.find((location) => {
          if (location.attachmentType !== AttachmentTypeEnum.ROUTE) return false;
          if (!location.routePattern?.trim()) return true;
          if (location.patternType !== "regex") return false;
          try {
            new RegExp(location.routePattern);
            return false;
          } catch {
            return true;
          }
        });
        if (invalidLocation) {
          setSubmitError(
            invalidLocation.routePattern?.trim()
              ? `Invalid regular expression: ${invalidLocation.routePattern}`
              : "Every page location needs a URL pattern",
          );
          setActiveTab(SettingsTabEnum.VISIBILITY);
          return;
        }
      }

      const formData = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        colorId: selectedColorId,
        viewType,
        locations: noteLocations, // Save the locations array
      };

      if (editingNote) {
        // Update existing note
        const updated = await updateNote({
          id: editingNote.id,
          updates: formData,
        });
        if (!updated) throw new Error("The note no longer exists");
      } else {
        // Place a new free-floating note in view, clear of the stickies already shown, where it stays until moved
        const position = getFreeNotePosition(DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT);
        formData.locations = formData.locations.map((location) =>
          location.coordinates || location.elementXPath
            ? location
            : { ...location, coordinates: { ...position, width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_HEIGHT } },
        );

        // Create new note with its page locations
        await createNote(formData);
      }

      // Trigger refresh in other components
      dispatch(triggerRefresh());
      dispatch(closeNoteForm());
    } catch (error) {
      console.error("Failed to save note:", error);
      setSubmitError("Failed to save note. Please try again.");
      toast.error(`Failed to save note: ${(error as Error)?.message || error}`);
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

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name || isCreatingGroup) return;

    setIsCreatingGroup(true);
    try {
      const color = colorPalettes.find((palette) => palette.id === selectedColorId)?.value || "#6B7280";
      const newGroup = await createNoteGroup({
        data: { name, color },
      });
      // Reload notes data to get updated groups
      await loadNotesData();
      setGroupId(newGroup.id);
      setNewGroupName("");
      dispatch(triggerRefresh());
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    } finally {
      setIsCreatingGroup(false);
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
      dispatch(triggerRefresh());
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
        {/* Tab Navigation - 3 group buttons */}
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === SettingsTabEnum.ORGANIZATION ? null : SettingsTabEnum.ORGANIZATION)
            }
            className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
              activeTab === SettingsTabEnum.ORGANIZATION ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
            }`}
            title="Organization settings"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            Organization
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === SettingsTabEnum.DISPLAY ? null : SettingsTabEnum.DISPLAY)}
            className={`px-4 py-2 text-sm flex items-center gap-2 border-l border-gray-200 transition-colors ${
              activeTab === SettingsTabEnum.DISPLAY ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
            }`}
            title="Display settings"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4z" />
            </svg>
            Display
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === SettingsTabEnum.VISIBILITY ? null : SettingsTabEnum.VISIBILITY)}
            className={`px-4 py-2 text-sm flex items-center gap-2 border-l border-gray-200 transition-colors ${
              activeTab === SettingsTabEnum.VISIBILITY ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
            }`}
            title="Visibility settings"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"
              />
            </svg>
            Visibility
          </button>
        </div>

        {/* Single Display Section for Active Tab */}
        {activeTab && (
          <div className="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {/* Organization Tab Content */}
            {activeTab === SettingsTabEnum.ORGANIZATION && (
              <div className="space-y-3 relative">
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
                <div className="absolute top-0 right-0 h-[46px] flex items-center px-3 pointer-events-none">
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreateGroup();
                      }
                    }}
                    placeholder="New group name"
                    aria-label="New group name"
                  />
                  <Button
                    icon={<FiPlus />}
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    loading={isCreatingGroup}
                  >
                    New group
                  </Button>
                </div>
              </div>
            )}

            {/* Display Tab Content */}
            {activeTab === SettingsTabEnum.DISPLAY && (
              <div className="space-y-3">
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
              </div>
            )}

            {/* Visibility Tab Content */}
            {activeTab === SettingsTabEnum.VISIBILITY && (
              <div>
                {/* Scope toggle */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={toggleToPageOnly}
                      className={`px-3 py-1.5 text-sm flex items-center gap-2 ${
                        attachmentType === AttachmentTypeEnum.ROUTE
                          ? "bg-indigo-600 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      title="Apply to this page (domain/route)"
                    >
                      <FiMap className="w-4 h-4" /> <span className="hidden sm:inline">This Domain</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleToGlobal}
                      className={`px-3 py-1.5 text-sm flex items-center gap-2 border-l border-gray-200 ${
                        attachmentType === AttachmentTypeEnum.GLOBAL
                          ? "bg-indigo-600 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      title="Apply across all pages"
                    >
                      <FiGlobe className="w-4 h-4" /> <span className="hidden sm:inline">Global view</span>
                    </button>
                  </div>
                </div>

                {/* Page-specific configuration when not global */}
                {attachmentType !== AttachmentTypeEnum.GLOBAL && (
                  <div className="space-y-4 mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <label htmlFor="locations" className="block text-sm font-semibold text-gray-800">
                        Page Locations
                      </label>
                      <Checkbox checked={useDomainRule} onChange={(e) => handleDomainCheckboxChange(e.target.checked)}>
                        Use In Domain [{window.location.hostname}]
                      </Checkbox>

                      <Button type="dashed" size="small" icon={<FiPlus />} onClick={addNewLocation}>
                        Add Location
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {locations.map((location, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg ${location.isMain ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {location.isMain && (
                                <span className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">
                                  Main (Current Page)
                                </span>
                              )}
                              <span className="text-sm text-gray-600">Location {index + 1}</span>
                            </div>
                            <div className="flex gap-1">
                              {!location.isMain && (
                                <Button
                                  type="text"
                                  size="small"
                                  onClick={() => setMainLocation(index)}
                                  className="text-indigo-600"
                                >
                                  Set as Main
                                </Button>
                              )}
                              {locations.length > 1 && (
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<FiTrash2 />}
                                  onClick={() => removeLocation(index)}
                                />
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">URL Pattern</label>
                              <Input
                                value={location.routePattern || ""}
                                onChange={(e) => updateLocation(index, { routePattern: e.target.value })}
                                placeholder={
                                  location.patternType === "regex"
                                    ? "^/users/[0-9]+$"
                                    : `${window.location.hostname}/users/*`
                                }
                                addonBefore={
                                  <Select
                                    value={location.patternType || "url"}
                                    onChange={(value: "url" | "regex") => updateLocation(index, { patternType: value })}
                                    getPopupContainer={() =>
                                      (document
                                        .querySelector("hover-inspector")
                                        ?.shadowRoot?.querySelector("html > body") as HTMLElement) || document.body
                                    }
                                  >
                                    <Select.Option value="url">
                                      <TbWorldWww />
                                    </Select.Option>
                                    <Select.Option value="regex">
                                      <BsRegex />
                                    </Select.Option>
                                  </Select>
                                }
                                addonAfter={
                                  <Button type="text" size="small" onClick={() => handleAddCurrentUrl(index)}>
                                    Current URL
                                  </Button>
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Element XPath (optional)
                              </label>
                              <Input
                                value={location.elementXPath || ""}
                                onChange={(e) => updateLocation(index, { elementXPath: e.target.value })}
                                placeholder="XPath of the element to interact with"
                                addonAfter={
                                  <Space>
                                    <Tooltip title="Find element in page">
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<AimOutlined style={{ color: "#1890ff" }} />}
                                        onClick={() =>
                                          location.elementXPath &&
                                          highlightOverlay?.startHighlight(location.elementXPath)
                                        }
                                        disabled={!location.elementXPath}
                                      />
                                    </Tooltip>
                                    <Tooltip
                                      title={isSelectingElement ? "Cancel selection (Esc)" : "Select element from page"}
                                    >
                                      <Button
                                        type={isSelectingElement ? "primary" : "text"}
                                        size="small"
                                        icon={<SelectOutlined style={{ color: isSelectingElement ? undefined : "#52c41a" }} />}
                                        onClick={() => handleElementSelection(index)}
                                      />
                                    </Tooltip>
                                  </Space>
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
              // The form opens in its own floating window; start typing there instead of on the Add note button
              autoFocus
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

        {/*{LLM RULE DO NOT TOUCH THIS SECTION}/!* Add new color button *!/*/}
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

              {/*{LLM RULE DO NOT TOUCH THIS SECTION}/!* Add new color button *!/*/}
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

      {/*{LLM RULE DO NOT TOUCH THIS SECTION}/!* Add new color button *!/*/}

      <ScenarioPortalFooterButtons portalId={PortalId.FUNCTIONS_TAB} containerId="hover-inspector-popup-footer-note">
        <div className="flex justify-between items-center gap-4 p-2 border-t border-gray-200 bg-gray-50">
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
