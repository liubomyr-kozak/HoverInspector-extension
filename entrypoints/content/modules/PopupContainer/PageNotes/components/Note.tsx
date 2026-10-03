import React from "react";
import { renderNoteMarkup } from "../utils/noteMarkup";
import { Popconfirm } from "antd";
import { FiEdit2, FiTrash2, FiMapPin, FiEye, FiEyeOff } from "react-icons/fi";
import { FaGripVertical } from "react-icons/fa6";
import { Note as NoteType, ColorPalette, NoteViewType } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { findMatchingLocation } from "@entrypoints/background/services/notes.ts";

type NoteProps = {
  note: NoteType;
  isSelected: boolean;
  colorPalette: ColorPalette[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  viewType?: NoteViewType;
};

// Short description of where a note is shown
const describeLocations = (note: NoteType): string => {
  const locations = note.locations || [];
  if (locations.length === 0) return (note as any).domain || "Not attached to a page";
  if (locations.some((location) => location.attachmentType === "global")) return "All pages";

  const [first] = locations;
  const label =
    first.attachmentType === "domain"
      ? `${first.domain || first.routePattern} (whole site)`
      : first.patternType === "regex"
        ? `${first.domain} /${first.routePattern}/`
        : `${first.domain || ""}${first.routePattern?.startsWith("/") ? first.routePattern : ` ${first.routePattern || ""}`}`;

  return locations.length > 1 ? `${label} +${locations.length - 1}` : label;
};

export const Note: React.FC<NoteProps> = ({
  note,
  isSelected,
  colorPalette,
  onEdit,
  onDelete,
  onSelect,
  onToggleVisibility,
  viewType = NoteViewType.NOTE,
}) => {
  const highlightOverlay = useHighlightOverlay();

  const hexToRgba = (hex: string, opacity: number = 0.85): string => {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const hexColor = colorPalette.find((color) => color.id === note.colorId)?.value || "#fef3c7";
  const noteColor = hexToRgba(hexColor, 0.85);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Find the current page's matching location from the locations array
  const currentDomain = window.location.hostname;
  const currentUrl = window.location.href;
  const matchingLocation = findMatchingLocation(note, currentDomain, currentUrl);
  const currentElementXPath = matchingLocation?.elementXPath || (note as any).elementXPath; // backward compatibility

  const isPinned = !!currentElementXPath;
  const isOnThisPage = !!matchingLocation;

  return (
    <div
      className="group relative mb-2 rounded-lg border-2 border-transparent p-3 shadow-sm transition-all hover:shadow-md"
      style={{
        borderColor: noteColor ?? "transparent",
        borderWidth: "4px",
        opacity: note.isVisible === false ? 0.6 : 1,
      }}
      onClick={() => onSelect(note.id)}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-grab text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
        <FaGripVertical className="h-4 w-4" />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex-1 m-0 text-sm font-semibold text-gray-700">{note.title || ""}</h4>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(note.id);
            }}
            title={
              note.isVisible === false
                ? "Show sticky note on matching pages"
                : isOnThisPage
                  ? "Hide sticky note"
                  : "Hide sticky note on matching pages"
            }
            aria-label={note.isVisible === false ? "Show sticky note" : "Hide sticky note"}
            className="inline-flex h-6 w-6 items-center justify-center rounded bg-black/5 text-gray-700 hover:bg-black/10 transition"
          >
            {note.isVisible === false ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentElementXPath) {
                highlightOverlay.startHighlight(currentElementXPath);
              }
            }}
            disabled={!currentElementXPath}
            title={isPinned ? "Highlight the element this note is attached to" : "Not attached to an element on this page"}
            className={`inline-flex h-6 w-6 items-center justify-center rounded bg-black/5 hover:bg-black/10 transition
              ${isPinned ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "text-gray-700"}`}
          >
            <FiMapPin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note.id);
            }}
            title="Edit note"
            className="inline-flex h-6 w-6 items-center justify-center rounded bg-black/5 text-gray-700 hover:bg-black/10 transition"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
          </button>
          <Popconfirm
            title="Delete this note?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            placement="left"
            getPopupContainer={(trigger) => trigger.parentElement || trigger}
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(note.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <button
              onClick={(e) => e.stopPropagation()}
              title="Delete note"
              className="inline-flex h-6 w-6 items-center justify-center rounded bg-black/5 text-gray-700 hover:bg-black/10 transition"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </Popconfirm>
        </div>
      </div>

      <div className="whitespace-pre-wrap break-words text-[13px] leading-snug text-gray-600">
        {note.content ? renderNoteMarkup(note.content) : "No content"}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
        <span className="truncate mr-2" title={describeLocations(note)}>
          {describeLocations(note)}
          {note.isVisible === false ? " · hidden" : ""}
        </span>
        <span>{formatDate(note.updatedAt)}</span>
      </div>
    </div>
  );
};
