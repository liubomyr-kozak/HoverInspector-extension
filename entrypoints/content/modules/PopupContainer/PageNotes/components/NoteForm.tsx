import React, { useState, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Button, Checkbox, Input, Popover, Select, Space } from "antd";
import {
  NotesState,
  Note,
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
import { FiChevronDown, FiFileText, FiTag, FiGlobe, FiMap, FiPlus, FiTrash2 } from "react-icons/fi";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { AimOutlined, SelectOutlined } from "@ant-design/icons";
import { BsRegex } from "react-icons/bs";
import { TbWorldWww } from "react-icons/tb";

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
  const [locations, setLocations] = useState<
    Array<{
      attachmentType: "element" | "route" | "domain" | "global";
      elementXPath?: string;
      routePattern?: string;
      isMain?: boolean;
    }>
  >([]);

  // Domain checkbox state
  const [useDomainRule, setUseDomainRule] = useState(false);

  // Tab-based state management - refactored to use enum
  const [activeTab, setActiveTab] = useState<SettingsTabEnum | null>(null);

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
          locations: editingNote.locations,
        }
      : initialFormData;

    setTitle(initialData?.title || "");
    setContent(initialData?.content || "");
    setGroupId(initialData?.groupId);

    // Initialize locations array from existing data or create default current page location
    if (initialData?.locations && initialData.locations.length > 0) {
      const formattedLocations = initialData.locations.map((loc, index) => ({
        attachmentType: loc.attachmentType,
        elementXPath: loc.elementXPath,
        routePattern: loc.routePattern,
        isMain: index === 0, // First location is considered main
      }));
      setLocations(formattedLocations);

      // Set form fields from main location (first one)
      const mainLocation = initialData.locations[0];
      setAttachmentType(mainLocation.attachmentType);
      setElementXPath(mainLocation.elementXPath);
      setRoutePattern(mainLocation.routePattern || "");
      setRouteInputValue(
        mainLocation.routePattern
          ? `${window.location.hostname}${mainLocation.routePattern}`
          : `${window.location.hostname}/`,
      );
    } else {
      // Create default location from legacy fields or current page
      const defaultLocation = {
        attachmentType: initialData?.attachmentType || AttachmentTypeEnum.ROUTE,
        elementXPath: initialData?.elementXPath,
        routePattern: initialData?.routePattern || window.location.pathname,
        isMain: true,
      };
      setLocations([defaultLocation]);

      setRouteInputValue(
        initialData?.routePattern
          ? `${window.location.hostname}${initialData.routePattern}`
          : `${window.location.hostname}${window.location.pathname}`,
      );
    }

    setElementPaths(initialData?.elementXPath ? [initialData.elementXPath] : []);

    const initialColorId = initialData?.colorId || "blue";
    setSelectedColorId(initialColorId);

    // Check if domain rule exists for current hostname
    const currentHostname = window.location.hostname;
    const hasDomainRule =
      initialData?.locations?.some((loc) => loc.attachmentType === "domain" && loc.domain === currentHostname) || false;
    setUseDomainRule(hasDomainRule);

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
          const xpath = highlightOverlay.generateXPath(event.element as Element);
          // Add to list and keep legacy field for first path
          setElementPaths((prev) => [...prev, xpath]);
          setElementXPath((prev) => prev || xpath);

          // Update the main location's elementXPath
          const mainLocationIndex = locations.findIndex((loc) => loc.isMain);
          if (mainLocationIndex !== -1) {
            updateLocation(mainLocationIndex, { elementXPath: xpath });
          }

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

  // Scope toggle helpers - refactored to use enum
  const toggleToPageOnly = () => {
    setAttachmentType(AttachmentTypeEnum.ROUTE);
    if (!routePattern) setRoutePattern(window.location.pathname);
  };

  const toggleToGlobal = () => {
    setAttachmentType(AttachmentTypeEnum.GLOBAL);
  };

  const handleAddCurrentUrl = (index) => {
    try {
      const currentUrl = window.location.href;
      setRouteInputValue(currentUrl);

      updateLocation(index, { routePattern: window.location.pathname });
    } catch (error) {
      console.error("Failed to get current URL:", error);
    }
  };

  // Location management functions
  const addNewLocation = () => {
    const newLocation = {
      attachmentType: AttachmentTypeEnum.ROUTE,
      routePattern: window.location.pathname,
      isMain: false,
    };
    setLocations((prev) => [...prev, newLocation]);
  };

  const removeLocation = (index: number) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
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

    if (checked) {
      // Add domain location if it doesn't exist
      const existingDomainIndex = locations.findIndex(
        (loc) => loc.attachmentType === "domain" && loc.routePattern === currentHostname,
      );

      if (existingDomainIndex === -1) {
        const domainLocation = {
          attachmentType: "domain" as const,
          routePattern: currentHostname,
          isMain: false,
        };
        setLocations((prev) => [...prev, domainLocation]);
      }
    } else {
      // Remove domain location for current hostname
      setLocations((prev) =>
        prev.filter((loc) => !(loc.attachmentType === "domain" && loc.routePattern === currentHostname)),
      );
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
      // Create locations array from the form data
      const noteLocations = locations.map((location) => ({
        attachmentType: location.attachmentType,
        domain: window.location.hostname,
        elementXPath: location.elementXPath,
        routePattern: location.routePattern,
        url: window.location.href,
      }));

      // Ensure we have at least one location
      if (noteLocations.length === 0) {
        noteLocations.push({
          attachmentType: attachmentType,
          domain: window.location.hostname,
          elementXPath: elementXPath,
          routePattern: routeInputValue,
          url: window.location.href,
        });
      }

      const formData: Partial<Note> = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        colorId: selectedColorId,
        viewType,
        locations: noteLocations, // Save the locations array
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
              <div className="space-y-3">
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
                                placeholder={`${window.location.hostname}/users/*`}
                                addonBefore={
                                  <Select
                                    defaultValue="url"
                                    // @ts-ignore
                                    getPopupContainer={() =>
                                      (
                                        document.querySelector("hover-inspector")!.shadowRoot as HTMLElement
                                      )?.querySelector("html > body")
                                    }
                                  >
                                    <Option value="url">
                                      <TbWorldWww />
                                    </Option>
                                    <Option value="regex">
                                      <BsRegex />
                                    </Option>
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
                                    {location.isMain && (
                                      <Tooltip title="Select element from page">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<SelectOutlined style={{ color: "#52c41a" }} />}
                                          onClick={() => handleElementSelection()}
                                        />
                                      </Tooltip>
                                    )}
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
