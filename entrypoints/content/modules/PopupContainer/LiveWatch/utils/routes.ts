import { DetectedPattern } from "../types";

/** A path segment that names one record rather than a page: a number, a GUID, a hex or mixed id */
const ID_SEGMENT = /^(?:\d+|[0-9a-f]{8}-[0-9a-f-]{4,}|(?=[0-9a-z_-]*\d)[0-9a-z_-]{12,})$/i;

/**
 * The page a URL shows, without what changes from round to round: the origin is dropped (repeats are
 * per site) and record ids in the path become ":id". `/org/01a0392f-…/venue/42` and `/org/7f3a…/venue/7`
 * are one page.
 */
export function routeOf(url: string | undefined): string {
  if (!url) return "/";
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.split(/[?#]/)[0];
  }
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) => (ID_SEGMENT.test(decodeURIComponent(segment)) ? ":id" : segment));
  return `/${segments.join("/")}`;
}

export interface RouteGroup {
  route: string;
  /** The tab is on this page now */
  current: boolean;
  patterns: DetectedPattern[];
}

/**
 * Repeats grouped by the page their latest round starts on, the current page first, then in the order of the
 * best chain of each group. Chains keep their order inside a group.
 */
export function groupByRoute(patterns: DetectedPattern[], currentRoute: string): RouteGroup[] {
  const groups = new Map<string, RouteGroup>();
  patterns.forEach((pattern) => {
    const route = routeOf(pattern.events[0]?.url);
    const group = groups.get(route) ?? { route, current: route === currentRoute, patterns: [] };
    group.patterns.push(pattern);
    groups.set(route, group);
  });
  const list = [...groups.values()];
  return [...list.filter((group) => group.current), ...list.filter((group) => !group.current)];
}
