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

// Extended attachment type enum
export enum AttachmentTypeEnum {
  GLOBAL = "global",
  ROUTE = "route",
}

// Update the existing AttachmentType to use the enum
export type AttachmentType = AttachmentTypeEnum;

// Route input mode for editing
export type RouteInputMode = "string" | "regex";

// Extended form data with multi-location and element paths support
export interface ExtendedNoteFormData extends Omit<NoteFormData, "attachmentType"> {
  attachmentType: AttachmentType;
  routePattern?: string;
  elementXPath?: string; // backward compatibility - first selector
  elementPaths?: string[]; // new multi-selector support
  viewType?: NoteViewType;
  routeInputMode?: RouteInputMode; // for route editing
}

// Action payload types
export interface CreateNotePayload extends ExtendedNoteFormData {
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
