export enum NoteViewType {
  NOTE = "note",
  CHIP = "chip",
}

export interface NoteLocationCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NoteLocation {
  attachmentType: "element" | "route" | "domain" | "global";
  domain: string;
  elementXPath?: string;
  routePattern?: string;
  url: string;

  // Position data (coordinates are separate as they're not location-specific)
  coordinates?: NoteLocationCoordinates;
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

  // Form-specific properties (for creating/editing notes)
  elementXPath?: string;
  attachmentType?: "element" | "route" | "domain" | "global";
  routePattern?: string;
  viewType?: NoteViewType;

  // For adding to existing notes
  addToExistingNote?: boolean;
  existingNoteId?: string;

  // Extended properties
  elementPaths?: string[];
  domain?: string;
  url?: string;
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

// Extended attachment type enum
export enum AttachmentTypeEnum {
  GLOBAL = "global",
  ROUTE = "route",
}

// Update the existing AttachmentType to use the enum
export type AttachmentType = AttachmentTypeEnum;

// Action payload types
export interface CreateNotePayload extends Partial<Note> {
  content: string; // Required for creation
  title: string; // Required for creation
  domain: string;
  url: string;
}

export interface UpdateNotePayload {
  id: string;
  updates: Partial<Note> & { addNewLocation?: boolean };
}

export interface CreateNoteGroupPayload {
  data: {
    name: string;
    color: string;
  };
}

export interface UpdateNoteGroupPayload {
  id: string;
  updates: Partial<NoteGroup>;
}

export interface CreateColorPalettePayload {
  data: ColorPalette;
}

export interface UpdateColorPalettePayload {
  data: {
    id: string;
    updates: Partial<ColorPalette>;
  };
}

export interface DeleteColorPalettePayload {
  data: string; // colorId
}

export interface SetColorPalettesPayload {
  data: ColorPalette[];
}
