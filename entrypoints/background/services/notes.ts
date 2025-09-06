import { Note, NoteLocation, NotesState, NoteGroup, ColorPalette } from "@entrypoints/shared/types/notes.ts";

/**
 * Creates a new note with proper structure
 */
export function createNewNote(
  formData: Partial<Note> & { content: string; title: string; locations: NoteLocation[] },
): Note {
  return {
    ...formData,
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isVisible: true,
  };
}

/**
 * Updates a note with new data while preserving locations array
 */
export function updateNoteData(note: Note, updates: Partial<Note> & { locations?: boolean }): Note {
  return {
    ...note,
    ...updates,
    updatedAt: Date.now(),
  };
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
export function updateNoteGroupData(group: NoteGroup, updates: Partial<NoteGroup>): NoteGroup {
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
export function findMatchingLocation(note: Note, currentDomain: string, currentUrl: string): NoteLocation | undefined {
  return note.locations.find((location) => location.domain === currentDomain || location.url === currentUrl);
}

/**
 * Checks if a note should be visible on current page
 */
export function shouldNoteBeVisibleOnPage(
  note: Note,
  currentDomain: string,
  currentUrl: string,
  groups: NoteGroup[] = [],
): boolean {
  // Note must be visible and have positioning data
  const hasPositioning =
    (note.locations && note.locations.some((loc) => loc.coordinates || loc.elementXPath)) || (note as any).elementXPath; // backward compatibility

  if (!note.isVisible || !hasPositioning) {
    return false;
  }

  // Check if note matches current page route/URL using locations array
  let matchesRoute = false;

  if (note.locations && note.locations.length > 0) {
    // Use new locations array with attachment type-specific logic
    matchesRoute = note.locations.some((location) => {
      switch (location.attachmentType) {
        case "global":
          // Global notes are visible on all pages
          return true;

        case "domain":
          // Domain notes are visible on pages matching the domain
          return location.domain === currentDomain;

        case "route":
          // Route notes are visible on pages matching the route pattern
          // First check if domain matches (route attachments are domain-specific)
          if (location.domain !== currentDomain) {
            return false;
          }

          if (location.routePattern) {
            const currentPath = new URL(currentUrl).pathname;
            // Simple pattern matching - exact match or wildcard support
            if (location.routePattern.includes("*")) {
              const pattern = location.routePattern.replace(/\*/g, ".*");
              const regex = new RegExp("^" + pattern + "$");
              return regex.test(currentPath) || regex.test(currentUrl);
            } else {
              // Exact match for route pattern
              return currentPath === location.routePattern || currentUrl.includes(location.routePattern);
            }
          }
          return false;

        default:
          // Fallback to legacy behavior for unknown attachment types
          return location.domain === currentDomain || location.url === currentUrl;
      }
    });
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
  groups: NoteGroup[] = [],
): Note[] {
  return notes.filter((note) => shouldNoteBeVisibleOnPage(note, currentDomain, currentUrl, groups));
}

/**
 * Removes notes from a group when the group is deleted
 */
export function removeNotesFromGroup(notes: Note[], groupId: string): Note[] {
  return notes.map((note) => (note.groupId === groupId ? { ...note, groupId: undefined } : note));
}
