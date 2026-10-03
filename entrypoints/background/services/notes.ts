import { Note, NoteLocation, NoteGroup, ColorPalette, NotePatternType } from "@entrypoints/shared/types/notes.ts";

/**
 * Creates a new note with proper structure
 */
export function createNewNote(
  formData: Partial<Note> & { content: string; title: string; locations: NoteLocation[] },
): Note {
  return {
    isVisible: true,
    ...formData,
    title: formData.title ?? "",
    content: formData.content ?? "",
    locations: Array.isArray(formData.locations) ? formData.locations : [],
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Updates a note with new data while preserving locations array
 */
export function updateNoteData(note: Note, updates: Partial<Note>): Note {
  const { id: _id, createdAt: _createdAt, ...rest } = updates;
  return {
    ...note,
    ...rest,
    updatedAt: Date.now(),
  };
}

/**
 * Creates a new note group
 */
export function createNewNoteGroup(data: { name: string; color?: string }): NoteGroup {
  return {
    color: "#6B7280",
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
    name: data.name || `Custom ${data.value || "#000000"}`,
    value: data.value || "#000000",
    isDefault: data.isDefault || false,
    createdAt: data.createdAt || Date.now(),
  };
}

/**
 * Repairs groups saved by an older version that stored the payload wrapper ({ data: { name, color } })
 */
export function normalizeNoteGroups(groups: any[] = []): NoteGroup[] {
  return groups
    .map((group) => (group && !group.name && group.data?.name ? { ...group, ...group.data, data: undefined } : group))
    .filter((group) => group && typeof group.name === "string" && group.name.trim());
}

/**
 * Drops broken palettes saved by an older version (black "Custom Color" entries created from
 * an unwrapped payload) and makes sure the default colors exist with their fixed ids
 */
export function normalizeColorPalettes(palettes: any[] = []): ColorPalette[] {
  const valid = palettes.filter(
    (palette) =>
      palette &&
      typeof palette.id === "string" &&
      typeof palette.value === "string" &&
      !(palette.name === "Custom Color" && palette.value === "#000000" && !palette.isDefault),
  );
  const missingDefaults = DEFAULT_NOTE_COLORS.filter((color) => !valid.some((palette) => palette.id === color.id));
  return [...missingDefaults, ...valid];
}

// Default note colors. Fixed ids so a note's colorId keeps pointing at the same color.
export const DEFAULT_NOTE_COLORS: ColorPalette[] = [
  { id: "blue", name: "Blue", value: "#3B82F6", isDefault: true, createdAt: 0 },
  { id: "red", name: "Red", value: "#EF4444", isDefault: true, createdAt: 0 },
  { id: "green", name: "Green", value: "#10B981", isDefault: true, createdAt: 0 },
  { id: "yellow", name: "Yellow", value: "#F59E0B", isDefault: true, createdAt: 0 },
  { id: "purple", name: "Purple", value: "#8B5CF6", isDefault: true, createdAt: 0 },
  { id: "orange", name: "Orange", value: "#F97316", isDefault: true, createdAt: 0 },
  { id: "pink", name: "Pink", value: "#EC4899", isDefault: true, createdAt: 0 },
  { id: "cyan", name: "Cyan", value: "#06B6D4", isDefault: true, createdAt: 0 },
];

const escapeRegExp = (value: string) => value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

// Turns a glob-like pattern ("*" = any characters) into an anchored RegExp
const globToRegExp = (pattern: string) => new RegExp("^" + pattern.split("*").map(escapeRegExp).join(".*") + "$");

const trimTrailingSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

const toUrl = (url: string | URL): URL | null => {
  try {
    return url instanceof URL ? url : new URL(url);
  } catch {
    return null;
  }
};

/**
 * Checks a route pattern against a page URL.
 *
 * - patternType "regex": the pattern is a RegExp tested against the path (with query) and the full URL.
 * - patternType "url" (default): "example.com/users/*", "https://example.com/a" or "/users/*".
 *   An optional host must match the page host; the path must match exactly ("*" is a wildcard),
 *   so "/" only matches the root page.
 */
export function matchesRoutePattern(
  pattern: string | undefined,
  patternType: NotePatternType | undefined,
  pageUrl: string | URL,
): boolean {
  const url = toUrl(pageUrl);
  if (!url || !pattern || !pattern.trim()) return false;

  const trimmed = pattern.trim();
  const pathWithQuery = url.pathname + url.search;

  if (patternType === "regex") {
    try {
      const regex = new RegExp(trimmed);
      return regex.test(pathWithQuery) || regex.test(url.href);
    } catch {
      return false;
    }
  }

  // Split an optional protocol/host from the path
  let rest = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  let hostPattern: string | undefined;
  if (!rest.startsWith("/")) {
    const slashIndex = rest.indexOf("/");
    const firstSegment = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
    const looksLikeHost =
      firstSegment === url.hostname ||
      firstSegment === url.host ||
      firstSegment.includes(".") ||
      firstSegment.includes(":") ||
      firstSegment === "localhost" ||
      firstSegment === "*";
    if (looksLikeHost) {
      hostPattern = firstSegment;
      rest = slashIndex === -1 ? "/" : rest.slice(slashIndex);
    } else {
      rest = "/" + rest;
    }
  }

  if (hostPattern) {
    const hostRegex = globToRegExp(hostPattern.toLowerCase());
    if (!hostRegex.test(url.host.toLowerCase()) && !hostRegex.test(url.hostname.toLowerCase())) return false;
  }

  // Ignore a hash in the pattern; compare against the query only when the pattern has one
  const pathPattern = rest.split("#")[0];
  const target = pathPattern.includes("?") ? pathWithQuery : url.pathname;

  if (pathPattern.includes("*")) {
    return globToRegExp(pathPattern).test(target);
  }

  return trimTrailingSlash(target) === trimTrailingSlash(pathPattern);
}

/**
 * Single source of truth for "does this location apply to this page".
 * Used by the notes list, the sticky notes provider and findMatchingLocation.
 */
export function matchesLocation(location: NoteLocation, pageUrl: string | URL): boolean {
  const url = toUrl(pageUrl);
  if (!url || !location) return false;

  switch (location.attachmentType) {
    case "global":
      return true;

    case "domain":
      return location.domain === url.hostname || location.routePattern === url.hostname;

    case "route":
      // Route attachments are domain-specific
      if (location.domain && location.domain !== url.hostname) return false;
      return matchesRoutePattern(location.routePattern, location.patternType, url);

    default:
      // Fallback to legacy behavior for unknown attachment types
      return location.domain === url.hostname || location.url === url.href;
  }
}

const getLocationPriority = (location: NoteLocation): number => {
  switch (location.attachmentType) {
    case "route":
      return location.patternType === "regex" || location.routePattern?.includes("*") ? 80 : 100;
    case "domain":
      return 50;
    case "global":
      return 10;
    default:
      return 40;
  }
};

/**
 * Finds matching location for current page context with smart priority-based selection
 * Priority: Route (exact) > Route (pattern) > Domain > Global
 */
export function findMatchingLocation(note: Note, currentDomain: string, currentUrl: string): NoteLocation | undefined {
  const matchingLocations = (note.locations || [])
    .filter((location) => matchesLocation(location, currentUrl))
    .map((location) => ({
      location,
      priority: getLocationPriority(location),
      exactness: (location.routePattern || location.domain || "").length,
    }));

  if (matchingLocations.length === 0) {
    return undefined;
  }

  // Sort by priority (descending), then by exactness (descending) for deterministic selection
  matchingLocations.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return b.exactness - a.exactness;
  });

  return matchingLocations[0].location;
}

/**
 * Checks if a note is attached to the current page (ignores the note's visibility flag)
 */
export function isNoteOnPage(note: Note, currentDomain: string, currentUrl: string): boolean {
  if (Array.isArray(note.locations)) {
    return note.locations.some((location) => matchesLocation(location, currentUrl));
  }

  // Backward compatibility: legacy notes stored domain/url on the note itself
  return (note as any).domain === currentDomain || (note as any).url === currentUrl;
}

/**
 * Checks if a note should be visible (as a sticky note) on current page
 */
export function shouldNoteBeVisibleOnPage(
  note: Note,
  currentDomain: string,
  currentUrl: string,
  // Groups only organize notes; they don't affect where a note is shown
  _groups: NoteGroup[] = [],
): boolean {
  if (!note.isVisible) {
    return false;
  }

  return isNoteOnPage(note, currentDomain, currentUrl);
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
