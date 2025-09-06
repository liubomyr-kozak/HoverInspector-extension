import React from "react";
import { FiEdit2, FiTrash2, FiMapPin } from "react-icons/fi";
import { FaGripVertical } from "react-icons/fa6";
import { Note as NoteType, ColorPalette, NoteViewType } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";

type NoteProps = {
  note: NoteType;
  isSelected: boolean;
  colorPalette: ColorPalette[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  viewType?: NoteViewType;
};

export const Note: React.FC<NoteProps> = ({
  note,
  isSelected,
  colorPalette,
  onEdit,
  onDelete,
  onSelect,
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
  const matchingLocation = note.locations?.find(
    (location) => location.domain === currentDomain || location.url === currentUrl,
  );
  const currentElementXPath = matchingLocation?.elementXPath || (note as any).elementXPath; // backward compatibility

  const isPinned = !!matchingLocation?.coordinates || !!currentElementXPath;

  if (viewType === NoteViewType.CHIP) {
    return (
      <div
        className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 m-1 cursor-pointer text-xs font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:shadow`}
        style={{
          backgroundColor: noteColor,
          borderColor: isSelected ? "#3b82f6" : "rgba(0,0,0,0.1)",
        }}
        onClick={() => onSelect(note.id)}
        title={`${note.title || "Untitled"}: ${note.content}`}
      >
        <span className="max-w-[150px] truncate">
          {note.title || note.content.substring(0, 30) + (note.content.length > 30 ? "..." : "")}
        </span>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isPinned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Unpin note"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
            >
              <FiMapPin className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note.id);
            }}
            title="Edit note"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-gray-700 hover:bg-black/20"
          >
            <FiEdit2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            title="Delete note"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-gray-700 hover:bg-black/20"
          >
            <FiTrash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative mb-2 rounded-lg border-2 border-transparent p-3 shadow-sm transition-all hover:shadow-md"
      style={{
        borderColor: noteColor ?? "transparent",
      }}
      onClick={() => onSelect(note.id)}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-grab text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
        <FaGripVertical className="h-4 w-4" />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex-1 m-0 text-sm font-semibold text-gray-700">{note.title || "Untitled Note"}</h4>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentElementXPath) {
                highlightOverlay.startHighlight(currentElementXPath);
              }
              // highlightOverlay.stopHighlight();
            }}
            disabled={!currentElementXPath}
            title={isPinned ? "Unpin note" : "Pin note to page"}
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            title="Delete note"
            className="inline-flex h-6 w-6 items-center justify-center rounded bg-black/5 text-gray-700 hover:bg-black/10 transition"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="whitespace-pre-wrap break-words text-[13px] leading-snug text-gray-600">
        {note.content || "No content"}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
        <span>{note.domain}</span>
        <span>{formatDate(note.updatedAt)}</span>
      </div>
    </div>
  );
};
