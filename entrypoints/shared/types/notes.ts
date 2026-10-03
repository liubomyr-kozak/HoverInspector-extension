export enum NoteViewType {
  NOTE = "note",
  CHIP = "chip",
}

export interface NoteLocationCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
  // When true (element-anchored notes) x/y are an offset from the element's top-left corner
  relativeToElement?: boolean;
}

// How a route location's routePattern is interpreted
export type NotePatternType = "url" | "regex";

// Extended attachment type enum
export enum AttachmentTypeEnum {
  GLOBAL = "global",
  ROUTE = "route",
  DOMAIN = "domain",
}

// Update the existing AttachmentType to use the enum
export type AttachmentType = AttachmentTypeEnum;

export interface NoteLocation {
  attachmentType: AttachmentType;
  domain: string; // I will use this on attachmentType "domain" and "global"
  elementXPath?: string;
  routePattern?: string;
  patternType?: NotePatternType;
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
  viewType?: NoteViewType;

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
  selectedNoteId?: string;
  colorPalettes?: ColorPalette[];
}

export interface ColorPalette {
  id: string;
  name: string;
  value: string;
  isDefault: boolean;
  createdAt: number;
}

// Action payload types
export interface CreateNotePayload extends Partial<Note> {
  content: string; // Required for creation
  title: string; // Required for creation
  locations: NoteLocation[];
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
  data: {
    id: string;
    updates: Partial<NoteGroup>;
  };
}

export interface DeleteNoteGroupPayload {
  data: string; // groupId
}

export interface ImportNotesPayload {
  data: {
    notes: Note[];
    groups?: NoteGroup[];
  };
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
