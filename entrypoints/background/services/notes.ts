import { Note, NoteLocation, NotesState, NoteGroup, ColorPalette } from "@entrypoints/shared/types/notes.ts";

/**
 * Centralized notes business logic functions
 * This file contains all the core logic for notes management that was previously duplicated in notesActionsSlice
 */

/**
 * Creates a new location object from form data and current page context
 */
export function createNoteLocation(
  data: Partial<Note> & { domain: string; url: string }
): NoteLocation {
  return {
    attachmentType: data.attachmentType || "global",
    domain: data.domain || "",
    elementXPath: data.elementXPath,
    routePattern: data.routePattern,
    url: data.url || "",
  };
}

/**
 * Migrates legacy note format to new locations array structure
 */
export function migrateLegacyNoteToLocations(note: any): NoteLocation[] {
  if (note.locations && Array.isArray(note.locations)) {
    return note.locations;
  }

  const locations: NoteLocation[] = [];
  
  // Migrate existing data if it exists in old format
  if (note.domain || note.url) {
    const migratedLocation: NoteLocation = {
      attachmentType: note.attachmentType || "global",
      domain: note.domain || "",
      elementXPath: note.elementXPath,
      routePattern: note.routePattern,
      url: note.url || "",
    };
    locations.push(migratedLocation);
  }

  return locations;
}

/**
 * Ensures a note has a proper locations array with backward compatibility
 */
export function ensureNoteHasLocations(note: Note): Note {
  if (!note.locations) {
    return {
      ...note,
      locations: migrateLegacyNoteToLocations(note),
    };
  }
  return note;
}

/**
 * Creates a new note with proper structure
 */
export function createNewNote(
  formData: Partial<Note> & { domain: string; url: string; content: string; title: string }
): Note {
  const newLocation = createNoteLocation(formData);
  
  return {
    ...formData,
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    locations: [newLocation],
    isVisible: true,
  };
}

/**
 * Adds a new location to an existing note
 */
export function addLocationToNote(
  note: Note, 
  newLocationData: Partial<Note> & { domain: string; url: string }
): Note {
  const ensuredNote = ensureNoteHasLocations(note);
  const newLocation = createNoteLocation(newLocationData);
  
  return {
    ...ensuredNote,
    locations: [...ensuredNote.locations, newLocation],
    updatedAt: Date.now(),
  };
}

/**
 * Updates a note with new data while preserving locations array
 */
export function updateNoteData(
  note: Note, 
  updates: Partial<Note> & { addNewLocation?: boolean }
): Note {
  const ensuredNote = ensureNoteHasLocations(note);
  
  if (updates.addNewLocation) {
    // Add new location to existing note
    const newLocation: NoteLocation = {
      attachmentType: (updates as any).attachmentType || "global",
      domain: (updates as any).domain || "",
      elementXPath: (updates as any).elementXPath,
      routePattern: (updates as any).routePattern,
      url: (updates as any).url || "",
    };
    return {
      ...ensuredNote,
      locations: [...ensuredNote.locations, newLocation],
      updatedAt: Date.now(),
    };
  } else {
    // Regular update - merge updates normally, preserving locations array
    return {
      ...ensuredNote,
      ...updates,
      locations: updates.locations || ensuredNote.locations,
      updatedAt: Date.now(),
    };
  }
}

/**
 * Creates a new note group
 */
export function createNewNoteGroup(data: { name: string; color: string }): NoteGroup {
  return {
    ...data,
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isExpanded: true,
  };
}

/**
 * Updates a note group
 */
export function updateNoteGroupData(
  group: NoteGroup, 
  updates: Partial<NoteGroup>
): NoteGroup {
  return {
    ...group,
    ...updates,
    updatedAt: Date.now(),
  };
}

/**
 * Creates a new color palette
 */
export function createNewColorPalette(data: Partial<ColorPalette>): ColorPalette {
  return {
    ...data,
    id: data.id || `color_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name || "Custom Color",
    value: data.value || "#000000",
    isDefault: data.isDefault || false,
    createdAt: Date.now(),
  };
}

/**
 * Finds matching location for current page context
 */
export function findMatchingLocation(
  note: Note,
  currentDomain: string,
  currentUrl: string
): NoteLocation | undefined {
  const ensuredNote = ensureNoteHasLocations(note);
  
  return ensuredNote.locations.find(
    (location) => location.domain === currentDomain || location.url === currentUrl
  );
}

/**
 * Checks if a note should be visible on current page
 */
export function shouldNoteBeVisibleOnPage(
  note: Note,
  currentDomain: string,
  currentUrl: string,
  groups: NoteGroup[] = []
): boolean {
  // Note must be visible and have positioning data
  const hasPositioning =
    (note.locations && note.locations.some((loc) => loc.coordinates || loc.elementXPath)) ||
    (note as any).elementXPath; // backward compatibility

  if (!note.isVisible || !hasPositioning) {
    return false;
  }

  // Check if note matches current page route/URL using locations array
  let matchesRoute = false;

  if (note.locations && note.locations.length > 0) {
    // Use new locations array
    matchesRoute = note.locations.some(
      (location) => location.domain === currentDomain || location.url === currentUrl
    );
  } else {
    // Backward compatibility: check legacy single values
    matchesRoute = (note as any).domain === currentDomain || (note as any).url === currentUrl;
  }

  // Check if note belongs to a group that should be visible on this page
  let matchesGroup = false;
  if (note.groupId) {
    const group = groups.find((g) => g.id === note.groupId);
    if (group) {
      // Groups can be visible across domains/routes (implement group visibility logic here if needed)
      matchesGroup = true;
    }
  }

  return matchesRoute || matchesGroup;
}

/**
 * Filters notes for current page visibility
 */
export function getVisibleNotesForPage(
  notes: Note[],
  currentDomain: string,
  currentUrl: string,
  groups: NoteGroup[] = []
): Note[] {
  return notes.filter((note) =>
    shouldNoteBeVisibleOnPage(note, currentDomain, currentUrl, groups)
  );
}

/**
 * Removes notes from a group when the group is deleted
 */
export function removeNotesFromGroup(notes: Note[], groupId: string): Note[] {
  return notes.map((note) =>
    note.groupId === groupId ? { ...note, groupId: undefined } : note
  );
}