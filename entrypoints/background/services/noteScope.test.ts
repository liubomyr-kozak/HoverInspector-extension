import { describe, it, expect } from "vitest";
import {
  buildLocations,
  describeNoteLocations,
  describeScopeForm,
  getScopeForm,
  patternHasHost,
  validateScopeForm,
  createExtraPattern,
  type PageContext,
} from "./noteScope";
import { filterNotesForList, isNoteOnPage, matchesLocation, matchesRoutePattern } from "./notes";
import { AttachmentTypeEnum, Note, NoteLocation } from "@entrypoints/shared/types/notes";

const context: PageContext = {
  hostname: "example.com",
  href: "https://example.com/docs/intro?x=1",
  pathname: "/docs/intro",
};

const note = (locations: NoteLocation[], extra: Partial<Note> = {}): Note => ({
  id: "n1",
  title: "",
  content: "text",
  createdAt: 1,
  updatedAt: 1,
  isVisible: true,
  locations,
  ...extra,
});

describe("matchesRoutePattern", () => {
  const url = "https://example.com/users/42?tab=1";

  it("matches an exact path and ignores a trailing slash", () => {
    expect(matchesRoutePattern("/users/42", "url", url)).toBe(true);
    expect(matchesRoutePattern("/users/42/", "url", url)).toBe(true);
    expect(matchesRoutePattern("/users", "url", url)).toBe(false);
  });

  it("treats * as a wildcard and / as the root page only", () => {
    expect(matchesRoutePattern("/users/*", "url", url)).toBe(true);
    expect(matchesRoutePattern("/", "url", url)).toBe(false);
    expect(matchesRoutePattern("/", "url", "https://example.com/")).toBe(true);
  });

  it("checks a host given in the pattern", () => {
    expect(matchesRoutePattern("example.com/users/*", "url", url)).toBe(true);
    expect(matchesRoutePattern("https://other.com/users/*", "url", url)).toBe(false);
    expect(matchesRoutePattern("localhost:8813/a", "url", "http://localhost:8813/a")).toBe(true);
  });

  it("compares the query only when the pattern has one", () => {
    expect(matchesRoutePattern("/users/42?tab=1", "url", url)).toBe(true);
    expect(matchesRoutePattern("/users/42?tab=2", "url", url)).toBe(false);
  });

  it("supports regular expressions and rejects invalid ones", () => {
    expect(matchesRoutePattern("^/users/\\d+$", "regex", url)).toBe(true);
    expect(matchesRoutePattern("([", "regex", url)).toBe(false);
  });

  it("never matches an empty pattern", () => {
    expect(matchesRoutePattern("", "url", url)).toBe(false);
    expect(matchesRoutePattern("   ", "url", url)).toBe(false);
  });
});

describe("matchesLocation", () => {
  it("keeps a route location to its own domain", () => {
    const location: NoteLocation = { attachmentType: AttachmentTypeEnum.ROUTE, domain: "example.com", routePattern: "/a", url: "" };
    expect(matchesLocation(location, "https://example.com/a")).toBe(true);
    expect(matchesLocation(location, "https://other.com/a")).toBe(false);
  });

  it("lets a route location without a domain match any host its pattern allows", () => {
    const location: NoteLocation = { attachmentType: AttachmentTypeEnum.ROUTE, domain: "", routePattern: "other.com/*", url: "" };
    expect(matchesLocation(location, "https://other.com/x")).toBe(true);
    expect(matchesLocation(location, "https://example.com/x")).toBe(false);
  });
});

describe("getScopeForm", () => {
  it("starts a new note on this page", () => {
    const form = getScopeForm(null, context);
    expect(form).toMatchObject({ scope: "page", host: "example.com", pagePattern: "/docs/intro", extras: [] });
  });

  it("reads the page, site and everywhere scopes", () => {
    const page = getScopeForm(
      note([{ attachmentType: AttachmentTypeEnum.ROUTE, domain: "a.dev", routePattern: "/x/*", patternType: "url", url: "https://a.dev/x/1" }]),
      context,
    );
    expect(page).toMatchObject({ scope: "page", host: "a.dev", pagePattern: "/x/*" });

    const site = getScopeForm(
      note([{ attachmentType: AttachmentTypeEnum.DOMAIN, domain: "a.dev", routePattern: "a.dev", url: "https://a.dev/start" }]),
      context,
    );
    // Switching a site note to "page" offers the page it was created on
    expect(site).toMatchObject({ scope: "site", host: "a.dev", pagePattern: "/start" });

    const everywhere = getScopeForm(note([{ attachmentType: AttachmentTypeEnum.GLOBAL, domain: "a.dev", url: "" }]), context);
    expect(everywhere.scope).toBe("everywhere");
  });

  it("treats a stored note without locations as notes-list only", () => {
    expect(getScopeForm(note([]), context).scope).toBe("none");
  });

  it("reads legacy notes that kept the domain on the note itself", () => {
    const legacy = { ...note([]), locations: undefined, domain: "old.dev" } as unknown as Note;
    expect(getScopeForm(legacy, context)).toMatchObject({ scope: "site", host: "old.dev" });
  });

  it("uses the global location as the primary one wherever it is stored", () => {
    const route: NoteLocation = { attachmentType: AttachmentTypeEnum.ROUTE, domain: "a.dev", routePattern: "/x", url: "" };
    const form = getScopeForm(note([route, { attachmentType: AttachmentTypeEnum.GLOBAL, domain: "", url: "" }]), context);
    expect(form.scope).toBe("everywhere");
    expect(form.extras).toEqual([route]);
  });
});

describe("buildLocations", () => {
  it("creates a route location for this page", () => {
    const [location, ...rest] = buildLocations(getScopeForm(null, context), context);
    expect(rest).toEqual([]);
    expect(location).toEqual({
      attachmentType: AttachmentTypeEnum.ROUTE,
      domain: "example.com",
      routePattern: "/docs/intro",
      patternType: "url",
      url: context.href,
    });
    expect(matchesLocation(location, "https://example.com/docs/intro?other")).toBe(true);
    expect(matchesLocation(location, "https://example.com/docs/other")).toBe(false);
  });

  it("creates a domain location for this site and a global one for everywhere", () => {
    const form = getScopeForm(null, context);
    const [site] = buildLocations({ ...form, scope: "site" }, context);
    expect(site).toMatchObject({ attachmentType: AttachmentTypeEnum.DOMAIN, domain: "example.com" });
    expect(matchesLocation(site, "https://example.com/anything")).toBe(true);
    expect(matchesLocation(site, "https://other.com/")).toBe(false);

    const [everywhere] = buildLocations({ ...form, scope: "everywhere", elementXPath: "/html/body" }, context);
    expect(everywhere).toMatchObject({ attachmentType: AttachmentTypeEnum.GLOBAL });
    expect(everywhere.elementXPath).toBeUndefined();
    expect(matchesLocation(everywhere, "https://other.com/")).toBe(true);
  });

  it("returns no locations for notes-list only", () => {
    expect(buildLocations({ ...getScopeForm(null, context), scope: "none" }, context)).toEqual([]);
  });

  it("keeps the saved position, url and extra locations of an edited note", () => {
    const stored = note([
      {
        attachmentType: AttachmentTypeEnum.ROUTE,
        domain: "a.dev",
        routePattern: "/x",
        patternType: "url",
        url: "https://a.dev/x",
        coordinates: { x: 10, y: 2000, width: 300, height: 200 },
      },
      { attachmentType: AttachmentTypeEnum.ROUTE, domain: "a.dev", routePattern: "^/y", patternType: "regex", url: "", coordinates: { x: 1, y: 2 } },
    ]);
    const form = getScopeForm(stored, context);
    expect(buildLocations(form, context)).toEqual(stored.locations);

    // Changing the scope keeps the position, and the note stays on its own site
    const [site, extra] = buildLocations({ ...form, scope: "site" }, context);
    expect(site).toMatchObject({ attachmentType: AttachmentTypeEnum.DOMAIN, domain: "a.dev", coordinates: { x: 10, y: 2000 } });
    expect(extra).toEqual(stored.locations[1]);
  });

  it("drops a position measured from an element when the element changes", () => {
    const stored = note([
      {
        attachmentType: AttachmentTypeEnum.ROUTE,
        domain: "example.com",
        routePattern: "/docs/intro",
        url: "",
        elementXPath: "/html/body/div[1]",
        coordinates: { x: 5, y: -40, width: 260, height: 160, relativeToElement: true },
      },
    ]);
    const form = getScopeForm(stored, context);
    expect(buildLocations(form, context)[0].coordinates).toEqual(stored.locations[0].coordinates);

    const [moved] = buildLocations({ ...form, elementXPath: "/html/body/div[2]" }, context);
    expect(moved.coordinates).toEqual({ x: 0, y: 0, width: 260, height: 160 });

    const [detached] = buildLocations({ ...form, elementXPath: "" }, context);
    expect(detached.elementXPath).toBeUndefined();
    expect(detached.coordinates).toBeUndefined();
  });

  it("matches an extra pattern naming another host on that host", () => {
    const form = getScopeForm(null, context);
    const extra = { ...createExtraPattern(form.host, context), routePattern: " other.com/help/* " };
    const [, location] = buildLocations({ ...form, extras: [extra] }, context);
    expect(location).toMatchObject({ domain: "", routePattern: "other.com/help/*" });
    const built = note(buildLocations({ ...form, extras: [extra] }, context));
    expect(isNoteOnPage(built, "other.com", "https://other.com/help/a")).toBe(true);
    expect(isNoteOnPage(built, "example.com", "https://example.com/help/a")).toBe(false);
  });
});

describe("validateScopeForm", () => {
  const form = getScopeForm(null, context);

  it("accepts the defaults", () => {
    expect(validateScopeForm(form)).toBeNull();
  });

  it("needs a page path and valid regular expressions", () => {
    expect(validateScopeForm({ ...form, pagePattern: " " })).toMatch(/path/);
    expect(validateScopeForm({ ...form, pagePattern: "([", pagePatternType: "regex" })).toMatch(/Invalid regular expression/);
    expect(validateScopeForm({ ...form, scope: "site", pagePattern: "" })).toBeNull();
    expect(validateScopeForm({ ...form, extras: [createExtraPattern("example.com", context)] })).toMatch(/empty URL pattern/);
  });
});

describe("describing scopes", () => {
  it("describes the form and stored notes", () => {
    const form = getScopeForm(null, context);
    expect(describeScopeForm(form)).toBe("Shown on example.com/docs/intro");
    expect(describeScopeForm({ ...form, scope: "site" })).toBe("Shown on every page of example.com");
    expect(describeNoteLocations(note(buildLocations(form, context)))).toBe("example.com/docs/intro");
    expect(describeNoteLocations(note([]))).toBe("Notes list only");
    expect(describeNoteLocations(note(buildLocations({ ...form, scope: "everywhere", extras: [createExtraPattern("a", context)] }, context)))).toBe(
      "Every site +1",
    );
  });

  it("recognises patterns with a host", () => {
    expect(patternHasHost("example.com/a")).toBe(true);
    expect(patternHasHost("https://x/a")).toBe(true);
    expect(patternHasHost("localhost/a")).toBe(true);
    expect(patternHasHost("/a/b")).toBe(false);
    expect(patternHasHost("users/*")).toBe(false);
  });
});

describe("filterNotesForList", () => {
  const pageUrl = "https://example.com/docs/intro";
  const onPage = note([{ attachmentType: AttachmentTypeEnum.ROUTE, domain: "example.com", routePattern: "/docs/intro", url: "" }], {
    id: "page",
    title: "Release checklist",
  });
  const elsewhere = note([{ attachmentType: AttachmentTypeEnum.ROUTE, domain: "example.com", routePattern: "/other", url: "" }], {
    id: "elsewhere",
    content: "Remember the CHECKLIST",
    isVisible: false,
  });
  const everywhere = note([{ attachmentType: AttachmentTypeEnum.GLOBAL, domain: "", url: "" }], { id: "everywhere" });
  const onElement = note(
    [{ attachmentType: AttachmentTypeEnum.DOMAIN, domain: "example.com", url: "", elementXPath: "/html/body/main" }],
    { id: "element" },
  );
  const all = [onPage, elsewhere, everywhere, onElement];
  const ids = (notes: Note[]) => notes.map((n) => n.id);

  it("filters by where notes are shown", () => {
    expect(ids(filterNotesForList(all, "page", pageUrl))).toEqual(["page", "everywhere", "element"]);
    expect(ids(filterNotesForList(all, "all", pageUrl))).toEqual(["page", "elsewhere", "everywhere", "element"]);
    expect(ids(filterNotesForList(all, "everywhere", pageUrl))).toEqual(["everywhere"]);
    expect(ids(filterNotesForList(all, "element", pageUrl))).toEqual(["element"]);
    expect(ids(filterNotesForList(all, "hidden", pageUrl))).toEqual(["elsewhere"]);
  });

  it("searches titles and text without regard to case", () => {
    expect(ids(filterNotesForList(all, "all", pageUrl, " checklist "))).toEqual(["page", "elsewhere"]);
    expect(ids(filterNotesForList(all, "page", pageUrl, "checklist"))).toEqual(["page"]);
  });
});

describe("legacy notes", () => {
  it("shows a note that kept its domain on the note itself, also after an import added empty locations", () => {
    const legacy = { ...note([]), domain: "example.com", url: "https://example.com/" } as unknown as Note;
    expect(isNoteOnPage(legacy, "example.com", "https://example.com/any")).toBe(true);
    expect(isNoteOnPage(legacy, "other.com", "https://other.com/")).toBe(false);
    expect(isNoteOnPage(note([]), "example.com", "https://example.com/")).toBe(false);
  });
});
