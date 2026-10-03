import { AttachmentTypeEnum, Note, NoteLocation, NotePatternType } from "@entrypoints/shared/types/notes.ts";

/**
 * Where a note is shown, as the note forms present it. Stored notes keep their `locations` array;
 * these helpers translate between the two so both note tools offer the same simple choice:
 *
 * - "page":       one page of a site (a route location: host + path pattern)
 * - "site":       every page of a site (a domain location)
 * - "everywhere": every page of every site (a global location)
 * - "none":       not shown on pages, only kept in the notes list (no locations)
 *
 * The first stored location is the "primary" one the scope describes. Any further locations
 * (extra URL patterns added under "More options", or written by older versions) are kept as they are.
 */
export type NoteScope = "page" | "site" | "everywhere" | "none";

export interface PageContext {
  hostname: string;
  href: string;
  pathname: string;
}

export const getPageContext = (location: { hostname: string; href: string; pathname: string } = window.location): PageContext => ({
  hostname: location.hostname,
  href: location.href,
  pathname: location.pathname,
});

export interface NoteScopeForm {
  scope: NoteScope;
  /** Site the note belongs to (page and site scope) */
  host: string;
  /** Path pattern for the page scope ("/docs/intro", "/users/*") */
  pagePattern: string;
  pagePatternType: NotePatternType;
  /** Element the note is attached to (page and site scope) */
  elementXPath?: string;
  /** Further locations, stored as they are (their own patterns, coordinates and elements) */
  extras: NoteLocation[];
  /** The stored primary location, so its saved position and url survive an edit */
  primary?: NoteLocation;
}

const safeUrl = (value?: string): URL | null => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/** Path to offer for the page scope when the primary location is not a page location */
const defaultPagePattern = (host: string, primary: NoteLocation | undefined, context: PageContext): string => {
  const savedUrl = safeUrl(primary?.url);
  if (savedUrl && savedUrl.hostname === host) return savedUrl.pathname;
  if (context.hostname === host) return context.pathname;
  return "/";
};

/**
 * Reads the form state from a stored note. A new note (no note, or one without an id) starts on
 * "this page" of the current site.
 */
export function getScopeForm(note: Partial<Note> | null | undefined, context: PageContext): NoteScopeForm {
  const locations = Array.isArray(note?.locations) ? note!.locations.filter(Boolean) : [];

  if (locations.length === 0) {
    const legacy = note as (Partial<Note> & { domain?: string; elementXPath?: string; attachmentType?: string }) | undefined;
    // Notes from the oldest versions kept domain/url/elementXPath on the note itself (shown site-wide)
    if (legacy?.attachmentType === AttachmentTypeEnum.GLOBAL) {
      return { scope: "everywhere", host: context.hostname, pagePattern: context.pathname, pagePatternType: "url", extras: [] };
    }
    if (legacy?.domain) {
      return {
        scope: "site",
        host: legacy.domain,
        pagePattern: defaultPagePattern(legacy.domain, undefined, context),
        pagePatternType: "url",
        elementXPath: legacy.elementXPath,
        extras: [],
      };
    }
    return {
      scope: note?.id ? "none" : "page",
      host: context.hostname,
      pagePattern: context.pathname,
      pagePatternType: "url",
      extras: [],
    };
  }

  const globalIndex = locations.findIndex((location) => location.attachmentType === AttachmentTypeEnum.GLOBAL);
  const primaryIndex = globalIndex === -1 ? 0 : globalIndex;
  const primary = locations[primaryIndex];
  const extras = locations.filter((_, index) => index !== primaryIndex);

  if (primary.attachmentType === AttachmentTypeEnum.GLOBAL) {
    const host = primary.domain || context.hostname;
    return {
      scope: "everywhere",
      host,
      pagePattern: defaultPagePattern(host, primary, context),
      pagePatternType: "url",
      extras,
      primary,
    };
  }

  if (primary.attachmentType === AttachmentTypeEnum.ROUTE) {
    const host = primary.domain || context.hostname;
    return {
      scope: "page",
      host,
      pagePattern: primary.routePattern ?? "",
      pagePatternType: primary.patternType || "url",
      elementXPath: primary.elementXPath,
      extras,
      primary,
    };
  }

  // Domain location (or an unknown type, which matches by domain)
  const host = primary.domain || primary.routePattern || context.hostname;
  return {
    scope: "site",
    host,
    pagePattern: defaultPagePattern(host, primary, context),
    pagePatternType: "url",
    elementXPath: primary.elementXPath,
    extras,
    primary,
  };
}

/** Whether a URL pattern names its own host ("example.com/a", "https://x.dev/*") */
export function patternHasHost(pattern: string): boolean {
  const trimmed = pattern.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith("/")) return false;
  const firstSegment = trimmed.split("/")[0];
  return firstSegment.includes(".") || firstSegment.includes(":") || firstSegment === "localhost" || firstSegment === "*";
}

/** A new extra URL pattern for the note's site */
export const createExtraPattern = (host: string, context: PageContext): NoteLocation => ({
  attachmentType: AttachmentTypeEnum.ROUTE,
  domain: host,
  url: context.href,
  routePattern: "",
  patternType: "url",
});

/**
 * Coordinates to keep for the primary location: a position measured from the element only applies
 * while the note stays on that same element.
 */
const keepCoordinates = (primary: NoteLocation | undefined, elementXPath: string | undefined) => {
  const coordinates = primary?.coordinates;
  if (!coordinates) return undefined;
  const sameElement = (primary?.elementXPath || undefined) === (elementXPath || undefined);
  if (sameElement) return coordinates;
  // Keep the size; the note is placed next to its new element (or at its default spot)
  if (elementXPath && coordinates.width && coordinates.height) {
    return { x: 0, y: 0, width: coordinates.width, height: coordinates.height };
  }
  return coordinates.relativeToElement ? undefined : coordinates;
};

const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;

/** Turns the form state back into the note's stored locations (primary first). */
export function buildLocations(form: NoteScopeForm, context: PageContext): NoteLocation[] {
  if (form.scope === "none") return [];

  const host = form.host || context.hostname;
  const url = form.primary?.url || context.href;
  const extras = form.extras.map((location) => {
    if (location.attachmentType !== AttachmentTypeEnum.ROUTE) return location;
    const routePattern = (location.routePattern || "").trim();
    // A pattern naming its own host is matched against that host instead of the note's site
    const domain = location.patternType !== "regex" && patternHasHost(routePattern) ? "" : location.domain || host;
    return { ...location, routePattern, patternType: location.patternType || "url", domain };
  });

  if (form.scope === "everywhere") {
    const coordinates = form.primary?.coordinates;
    return [
      withoutUndefined({
        attachmentType: AttachmentTypeEnum.GLOBAL,
        domain: host,
        url,
        // A position measured from an element means nothing on other pages
        coordinates: coordinates && !coordinates.relativeToElement ? coordinates : undefined,
      }),
      ...extras,
    ];
  }

  const elementXPath = form.elementXPath?.trim() || undefined;
  const coordinates = keepCoordinates(form.primary, elementXPath);

  const primary: NoteLocation =
    form.scope === "site"
      ? { attachmentType: AttachmentTypeEnum.DOMAIN, domain: host, routePattern: host, url }
      : {
          attachmentType: AttachmentTypeEnum.ROUTE,
          domain: host,
          routePattern: form.pagePattern.trim(),
          patternType: form.pagePatternType || "url",
          url,
        };

  return [withoutUndefined({ ...primary, elementXPath, coordinates }), ...extras];
}

const isValidRegExp = (pattern: string) => {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

/** Problem that keeps the form from being saved, or null */
export function validateScopeForm(form: NoteScopeForm): string | null {
  if (form.scope === "page") {
    if (!form.pagePattern.trim()) return "Enter the page's URL path, for example /docs/*";
    if (form.pagePatternType === "regex" && !isValidRegExp(form.pagePattern.trim())) {
      return `Invalid regular expression: ${form.pagePattern.trim()}`;
    }
  }
  for (const location of form.extras) {
    if (location.attachmentType !== AttachmentTypeEnum.ROUTE) continue;
    const pattern = (location.routePattern || "").trim();
    if (!pattern) return "Fill in or remove the empty URL pattern";
    if (location.patternType === "regex" && !isValidRegExp(pattern)) return `Invalid regular expression: ${pattern}`;
  }
  return null;
}

const describeLocation = (location: NoteLocation): string => {
  switch (location.attachmentType) {
    case AttachmentTypeEnum.GLOBAL:
      return "Every site";
    case AttachmentTypeEnum.DOMAIN:
      return `All of ${location.domain || location.routePattern}`;
    case AttachmentTypeEnum.ROUTE: {
      const pattern = location.routePattern || "";
      if (location.patternType === "regex") return `${location.domain ? location.domain + " " : ""}/${pattern}/`;
      if (!location.domain || patternHasHost(pattern)) return pattern;
      return `${location.domain}${pattern.startsWith("/") ? "" : "/"}${pattern}`;
    }
    default:
      return location.domain || location.url || "";
  }
};

/** Sentence describing where the form's scope shows the note */
export function describeScopeForm(form: NoteScopeForm): string {
  switch (form.scope) {
    case "everywhere":
      return "Shown on every page of every site";
    case "site":
      return `Shown on every page of ${form.host}`;
    case "none":
      return "Not shown on pages, only in the notes list";
    default:
      return form.pagePatternType === "regex"
        ? `Shown on ${form.host} pages matching /${form.pagePattern}/`
        : `Shown on ${describeLocation({ attachmentType: AttachmentTypeEnum.ROUTE, domain: form.host, routePattern: form.pagePattern, url: "" })}`;
  }
}

/** Short label for a note in a list: where it is shown ("localhost/page2.html +1", "Every site") */
export function describeNoteLocations(note: Partial<Note>): string {
  const locations = Array.isArray(note.locations) ? note.locations : [];
  if (locations.length === 0) return (note as { domain?: string }).domain || "Notes list only";
  const global = locations.find((location) => location.attachmentType === AttachmentTypeEnum.GLOBAL);
  const first = global || locations[0];
  const label = describeLocation(first);
  return locations.length > 1 ? `${label} +${locations.length - 1}` : label;
}

/** The scope of a stored note */
export const getNoteScope = (note: Partial<Note>, context: PageContext): NoteScope => getScopeForm(note, context).scope;
