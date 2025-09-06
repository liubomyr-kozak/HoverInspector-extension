export enum NoteViewType {
  NOTE = "note",
  CHIP = "chip",
}

export interface NoteLocation {
  attachmentType: "element" | "route" | "domain" | "global";
  domain: string;
  elementXPath?: string;
  routePattern?: string;
  url: string;

  // Position data (coordinates are separate as they're not location-specific)
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface Note {
  id: string;
  content: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  groupId?: string;

  // Multi-location support - array of location objects
  locations: NoteLocation[];

  // Visual properties
  colorId?: string;
  isVisible: boolean;
}

export interface NoteGroup {
  id: string;
  name: string;
  color: string;
  isExpanded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NotesState {
  notes: Note[];
  groups: NoteGroup[];
  searchQuery: string;
  showOnlyCurrentDomain: boolean;
  selectedNoteId?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  value: string;
  isDefault: boolean;
  createdAt: number;
}

export interface NoteFormData {
  title: string;
  content: string;
  groupId?: string;
  colorId?: string;
  elementXPath?: string;
  attachmentType?: "element" | "route" | "domain" | "global";
  routePattern?: string;
  // For adding to existing notes
  addToExistingNote?: boolean;
  existingNoteId?: string;
}
