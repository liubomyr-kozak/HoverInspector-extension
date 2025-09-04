export enum NoteViewType {
  NOTE = "note",
  CHIP = "chip"
}

export interface Note {
  id: string;
  content: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  domain: string;
  url: string;
  groupId?: string;
  
  // Positioning data
  elementXPath?: string; // For DOM element attachment
  coordinates?: {
    x: number;
    y: number;
  }; // For pinned position
  
  // Attachment options
  attachmentType?: "element" | "route" | "domain" | "global"; // Type of attachment
  routePattern?: string; // For route-specific attachment (e.g., "/user/*", "/product/:id")
  
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
}