import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Subscription } from "rxjs";
import { toast } from "react-toastify";
import { HexColorPicker } from "react-colorful";
import { Button, Checkbox, Input, Popconfirm, Popover, Segmented } from "antd";
import styled from "styled-components";
import { NotesState, Note, NoteLocation, ColorPalette, NoteViewType, AttachmentTypeEnum } from "@entrypoints/shared/types/notes";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  createNoteGroup,
  getColorPalettes,
  createColorPalette,
  updateColorPalette,
  deleteColorPalette,
} from "@entrypoints/background/store/notesActionsSlice.ts";
import { DEFAULT_NOTE_COLORS } from "@entrypoints/background/services/notes.ts";
import {
  NoteScope,
  NoteScopeForm,
  buildLocations,
  createExtraPattern,
  describeScopeForm,
  getPageContext,
  getScopeForm,
  validateScopeForm,
} from "@entrypoints/background/services/noteScope.ts";
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH, getFreeNotePosition } from "../VisibleNotesProvider/notePosition";
import {
  PortalId,
  ScenarioPortalFooterButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { closeNoteForm, triggerRefresh } from "@entrypoints/content/store/notes/notes.slice.ts";
import { useDispatch } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { useDebouncedCallback } from "@entrypoints/shared/utils/useDebouncedCallback.ts";
import { FiChevronDown, FiChevronRight, FiCrosshair, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { tokens } from "@entrypoints/shared/styles/tokens";

// Default color palette with IDs
const DEFAULT_COLORS: ColorPalette[] = DEFAULT_NOTE_COLORS;

// Time after which an unfinished element selection is cancelled
const ELEMENT_SELECTION_TIMEOUT = 30000;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: ${tokens.font.size.sm}px;
  font-weight: 600;
  color: ${tokens.color.text};
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.4;
  color: ${tokens.color.textMuted};
  overflow-wrap: anywhere;
`;

const MoreToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 0;
  border: none;
  border-top: 1px solid ${tokens.color.border};
  background: transparent;
  color: ${tokens.color.textSecondary};
  font-size: ${tokens.font.size.sm}px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${tokens.color.primary};
  }

  svg {
    flex-shrink: 0;
  }
`;

const MoreSummary = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  color: ${tokens.color.textMuted};
`;

const MorePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 4px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const XPathText = styled.code`
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: ${tokens.radius.sm}px;
  background: ${tokens.color.surfaceMuted};
  border: 1px solid ${tokens.color.border};
  font-family: ${tokens.font.mono};
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textSecondary};
`;

const NativeSelect = styled.select`
  height: ${tokens.control.md}px;
  min-width: 0;
  flex: 1;
  padding: 0 8px;
  border: 1px solid ${tokens.color.borderStrong};
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.surface};
  color: ${tokens.color.text};
  font-size: ${tokens.font.size.md}px;

  &:focus {
    border-color: ${tokens.color.primary};
  }
`;

const ErrorBox = styled.div`
  padding: 8px 10px;
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.dangerBg};
  color: ${tokens.color.danger};
  font-size: ${tokens.font.size.sm}px;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: ${tokens.color.surfaceMuted};
`;

const SCOPE_LABELS: Record<NoteScope, string> = {
  page: "This page",
  site: "This site",
  everywhere: "Everywhere",
  none: "Notes list only",
};

interface NoteFormProps {
  editingNote?: Note | null;
  initialFormData?: Partial<Note>;
  formId: string;
  onCancel: () => void;
}

export const NoteForm: React.FC<NoteFormProps> = ({ editingNote, initialFormData, formId, onCancel }) => {
  const pageContext = useMemo(() => getPageContext(), []);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groupId, setGroupId] = useState<string | undefined>();
  const [selectedColorId, setSelectedColorId] = useState<string>("blue");
  const [viewType, setViewType] = useState<NoteViewType>(NoteViewType.NOTE);
  // Where the note is shown (scope, extra URL patterns, element)
  const [scopeForm, setScopeForm] = useState<NoteScopeForm>(() => getScopeForm(null, pageContext));
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSelectingElement, setIsSelectingElement] = useState(false);

  const dispatch = useDispatch();
  const highlightOverlay = useHighlightOverlay();

  // Color management state
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(DEFAULT_COLORS);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  // New group input
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Active element selection (picker) and its auto-cancel timer
  const selectionRef = useRef<Subscription | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notes data state (groups)
  const [notesData, setNotesData] = useState<NotesState>({
    notes: [],
    groups: [],
    searchQuery: "",
    selectedNoteId: undefined,
  });

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

  // Initialize form data
  useEffect(() => {
    loadNotesData();
    loadColorPalettes();

    const initialData: Partial<Note> = editingNote || initialFormData || {};
    setTitle(initialData.title || "");
    setContent(initialData.content || "");
    setGroupId(initialData.groupId);
    setViewType(initialData.viewType || NoteViewType.NOTE);
    setSelectedColorId(initialData.colorId || "blue");
    setScopeForm(getScopeForm(editingNote || initialFormData || null, pageContext));
    setIsMoreOpen(false);
  }, [editingNote, initialFormData, pageContext, loadNotesData, loadColorPalettes]);

  const updateScopeForm = (updates: Partial<NoteScopeForm>) => setScopeForm((prev) => ({ ...prev, ...updates }));

  const updateExtra = (index: number, updates: Partial<NoteLocation>) =>
    setScopeForm((prev) => ({
      ...prev,
      extras: prev.extras.map((location, i) => (i === index ? { ...location, ...updates } : location)),
    }));

  const removeExtra = (index: number) =>
    setScopeForm((prev) => ({ ...prev, extras: prev.extras.filter((_, i) => i !== index) }));

  const addExtra = () =>
    setScopeForm((prev) => ({ ...prev, extras: [...prev.extras, createExtraPattern(prev.host, pageContext)] }));

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

  const handleElementSelection = useCallback(() => {
    if (selectionRef.current) {
      // Cancel selection
      finishElementSelection();
      return;
    }

    setIsSelectingElement(true);
    selectionRef.current = highlightOverlay.streamSelectionMode().subscribe({
      next: (event) => {
        if (event.type === "selected" && event.element) {
          const xpath = event.xpath || highlightOverlay.generateXPath(event.element as Element);
          setScopeForm((prev) => ({ ...prev, elementXPath: xpath }));
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
  }, [highlightOverlay, finishElementSelection]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!content.trim()) {
      setSubmitError("Write some text for the note");
      return;
    }

    const scopeError = validateScopeForm(scopeForm);
    if (scopeError) {
      setSubmitError(scopeError);
      setIsMoreOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const locations = buildLocations(scopeForm, pageContext);
      const formData = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        colorId: selectedColorId,
        viewType,
        locations,
      };

      if (editingNote) {
        const updated = await updateNote({ id: editingNote.id, updates: formData });
        if (!updated) throw new Error("The note no longer exists");
      } else {
        // Place a new free-floating note in view, clear of the stickies already shown, where it stays until moved
        const position = getFreeNotePosition(DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT);
        formData.locations = formData.locations.map((location, index) =>
          index > 0 || location.coordinates || location.elementXPath
            ? location
            : { ...location, coordinates: { ...position, width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_HEIGHT } },
        );
        await createNote({ ...formData, isVisible: true });
      }

      // Trigger refresh in other components
      dispatch(triggerRefresh());
      dispatch(closeNoteForm());
    } catch (error) {
      console.error("Failed to save note:", error);
      setSubmitError(`Failed to save note: ${(error as Error)?.message || error}`);
      toast.error(`Failed to save note: ${(error as Error)?.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingNote) return;
    try {
      await deleteNote(editingNote.id);
      dispatch(triggerRefresh());
      dispatch(closeNoteForm());
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  // Ctrl/Cmd + Enter saves
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
      const newGroup = await createNoteGroup({ data: { name, color } });
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
        await loadColorPalettes();
      } else if (colorId) {
        await updateColorPalette({
          data: {
            id: colorId,
            updates: {
              value: newColor,
              name: `Custom ${newColor}`,
            },
          },
        });
        await loadColorPalettes();
      }
    } catch (error) {
      console.error("Failed to save color palette:", error);
    }
  }, 200);

  const createColorPickerContent = (colorId: string | "new") => {
    const currentColor =
      colorId === "new" ? "#2D3748" : colorPalettes.find((c) => c.id === colorId)?.value || "#2D3748";

    return <HexColorPicker color={currentColor} onChange={(newColor) => handleColorChange(colorId, newColor)} />;
  };

  const { scope } = scopeForm;
  const canAttachElement = scope === "page" || scope === "site";
  // "Notes list only" is offered for notes that already are (e.g. written in Note Taking Tools)
  const scopeOptions: NoteScope[] =
    scope === "none" || (editingNote && getScopeForm(editingNote, pageContext).scope === "none")
      ? ["page", "site", "everywhere", "none"]
      : ["page", "site", "everywhere"];

  const groupName = notesData.groups.find((group) => group.id === groupId)?.name;
  const moreSummary = [
    scopeForm.extras.length > 0 && `${scopeForm.extras.length} more URL${scopeForm.extras.length === 1 ? "" : "s"}`,
    canAttachElement && scopeForm.elementXPath && "on an element",
    groupName && `group: ${groupName}`,
    viewType === NoteViewType.CHIP && "chip",
  ]
    .filter(Boolean)
    .join(" · ");

  const popupContainer = (trigger: HTMLElement) => trigger.parentElement || trigger;

  return (
    <form id={formId} onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
      <div className="flex flex-col gap-3">
        <Field>
          <Label htmlFor={`${formId}-title`}>Title</Label>
          <Input
            id={`${formId}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional"
            autoFocus
            maxLength={200}
          />
        </Field>

        <Field>
          <Label htmlFor={`${formId}-content`}>Text</Label>
          <Input.TextArea
            id={`${formId}-content`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to remember? **bold**, *italic* and [links](https://…) work."
            autoSize={{ minRows: 3, maxRows: 10 }}
            aria-required
          />
        </Field>

        <Field role="group" aria-labelledby={`${formId}-scope-label`}>
          <Label as="span" id={`${formId}-scope-label`}>
            Show on
          </Label>
          <Segmented
            block
            value={scope}
            onChange={(value) => updateScopeForm({ scope: value as NoteScope })}
            options={scopeOptions.map((value) => ({ value, label: SCOPE_LABELS[value] }))}
          />
          <Hint>{describeScopeForm(scopeForm)}</Hint>
        </Field>

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

        <div>
          <MoreToggle type="button" aria-expanded={isMoreOpen} onClick={() => setIsMoreOpen((open) => !open)}>
            {isMoreOpen ? <FiChevronDown /> : <FiChevronRight />}
            More options
            {!isMoreOpen && moreSummary && <MoreSummary>· {moreSummary}</MoreSummary>}
          </MoreToggle>

          {isMoreOpen && (
            <MorePanel>
              {scope === "page" && (
                <Field>
                  <Label htmlFor={`${formId}-page-pattern`}>Page URL on {scopeForm.host}</Label>
                  <Row>
                    <Input
                      id={`${formId}-page-pattern`}
                      value={scopeForm.pagePattern}
                      onChange={(e) => updateScopeForm({ pagePattern: e.target.value })}
                      placeholder={scopeForm.pagePatternType === "regex" ? "^/users/[0-9]+$" : "/users/*"}
                    />
                    <Checkbox
                      checked={scopeForm.pagePatternType === "regex"}
                      onChange={(e) => updateScopeForm({ pagePatternType: e.target.checked ? "regex" : "url" })}
                    >
                      Regex
                    </Checkbox>
                  </Row>
                  <Hint>Use * to match several pages, e.g. /blog/*</Hint>
                </Field>
              )}

              {scope !== "none" && (
                <Field>
                  <Label as="span">Also show on</Label>
                  {scopeForm.extras.map((location, index) =>
                    location.attachmentType === AttachmentTypeEnum.ROUTE ? (
                      <Row key={index}>
                        <Input
                          aria-label={`Extra URL pattern ${index + 1}`}
                          value={location.routePattern || ""}
                          onChange={(e) => updateExtra(index, { routePattern: e.target.value })}
                          placeholder={location.patternType === "regex" ? "^/docs/" : "/docs/* or other-site.com/*"}
                        />
                        <Checkbox
                          checked={location.patternType === "regex"}
                          onChange={(e) => updateExtra(index, { patternType: e.target.checked ? "regex" : "url" })}
                        >
                          Regex
                        </Checkbox>
                        <IconButton type="button" label="Remove this URL pattern" onClick={() => removeExtra(index)}>
                          <FiTrash2 />
                        </IconButton>
                      </Row>
                    ) : (
                      <Row key={index}>
                        <XPathText title={location.domain}>
                          {location.attachmentType === AttachmentTypeEnum.DOMAIN ? `All of ${location.domain}` : "Every site"}
                        </XPathText>
                        <IconButton type="button" label="Remove this location" onClick={() => removeExtra(index)}>
                          <FiTrash2 />
                        </IconButton>
                      </Row>
                    ),
                  )}
                  <div>
                    <Button size="small" icon={<FiPlus />} onClick={addExtra}>
                      Add URL pattern
                    </Button>
                  </div>
                </Field>
              )}

              {canAttachElement && (
                <Field>
                  <Label as="span">Attach to an element</Label>
                  {scopeForm.elementXPath ? (
                    <Row>
                      <XPathText title={scopeForm.elementXPath}>{scopeForm.elementXPath}</XPathText>
                      <IconButton
                        type="button"
                        label="Highlight the element"
                        onClick={() => highlightOverlay?.startHighlight(scopeForm.elementXPath!)}
                      >
                        <FiCrosshair />
                      </IconButton>
                      <IconButton type="button" label="Detach from the element" onClick={() => updateScopeForm({ elementXPath: undefined })}>
                        <FiX />
                      </IconButton>
                    </Row>
                  ) : (
                    <Hint>The sticky note follows the element you pick.</Hint>
                  )}
                  <div>
                    <Button
                      size="small"
                      type={isSelectingElement ? "primary" : "default"}
                      icon={<FiCrosshair />}
                      onClick={handleElementSelection}
                    >
                      {isSelectingElement ? "Click an element… (Esc cancels)" : scopeForm.elementXPath ? "Pick another element" : "Pick element"}
                    </Button>
                  </div>
                </Field>
              )}

              <Field>
                <Label htmlFor={`${formId}-group`}>Group</Label>
                <Row>
                  <NativeSelect id={`${formId}-group`} value={groupId || ""} onChange={(e) => setGroupId(e.target.value || undefined)}>
                    <option value="">No group</option>
                    {notesData.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Row>
                <Row>
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
                  <Button icon={<FiPlus />} onClick={handleCreateGroup} disabled={!newGroupName.trim()} loading={isCreatingGroup}>
                    Add
                  </Button>
                </Row>
              </Field>

              <Field role="group" aria-labelledby={`${formId}-view-label`}>
                <Label as="span" id={`${formId}-view-label`}>
                  Sticky note style
                </Label>
                <Segmented
                  value={viewType}
                  onChange={(value) => setViewType(value as NoteViewType)}
                  options={[
                    { value: NoteViewType.NOTE, label: "Card" },
                    { value: NoteViewType.CHIP, label: "Compact chip" },
                  ]}
                />
              </Field>
            </MorePanel>
          )}
        </div>

        {submitError && <ErrorBox role="alert">{submitError}</ErrorBox>}
      </div>

      {/*{LLM RULE DO NOT TOUCH THIS SECTION}/!* Add new color button *!/*/}

      <ScenarioPortalFooterButtons portalId={PortalId.FUNCTIONS_TAB} containerId="hover-inspector-popup-footer-note">
        <Footer>
          {editingNote && (
            <Popconfirm
              title="Delete this note?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              getPopupContainer={popupContainer}
              onConfirm={handleDelete}
            >
              <Button danger type="text" icon={<FiTrash2 />}>
                Delete
              </Button>
            </Popconfirm>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" form={formId} disabled={!content.trim()} loading={isSubmitting}>
            {editingNote ? "Save" : "Add note"}
          </Button>
        </Footer>
      </ScenarioPortalFooterButtons>
    </form>
  );
};
