import { ScenarioStep, StepType } from "../../types";
import { NavigationKind, WatchEvent, WatchEventKind, WatchLogItem, WatchLogMode } from "../types";
import { eventSignature, eventsToSteps, WATCH_EVENT_LIMIT } from "./patterns";

/** A page that loads this long after a click or key was opened by it */
export const NAVIGATION_CAUSE_MS = 4000;

/** Pages that follow each other this fast are one navigation (redirects, a URL rewritten while loading) */
const REDIRECT_MS = 1500;

const pathOf = (url: string | undefined) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

/** One row per event, as the capture saw them */
export function rawItems(events: WatchEvent[]): WatchLogItem[] {
  return events.map((event) => ({ id: event.id, event, sourceIds: [event.id], repeat: 1 }));
}

/**
 * The smart view: what a person did, as a scenario would need it. Rules, applied in this order:
 *
 * 1. Minor events are dropped: clicks on plain text or empty space, clicks that only focus a field, keys
 *    that only move the focus or the caret.
 * 2. Typing in the same field again (nothing else in between) is one fill with the last text.
 * 3. A page reached right after a click or key press (within NAVIGATION_CAUSE_MS, nothing in between) was
 *    opened by it: the navigation is folded into that step. Playing the click opens the page again.
 * 4. Two navigations to the same page in a row (a redirect, a reload of a page that was just opened) are one.
 * 5. The same click or key done several times in a row is one row with a repeat count.
 *
 * Every raw event behind a row is listed in `sourceIds`, so deleting a row deletes its events.
 */
export function smartItems(events: WatchEvent[]): WatchLogItem[] {
  const items: WatchLogItem[] = [];
  for (const event of events) {
    if (event.minor) continue;
    const last = items[items.length - 1];

    if (last && event.kind === WatchEventKind.INPUT && last.event.kind === WatchEventKind.INPUT && last.event.xpath === event.xpath) {
      // The row keeps its id (the first event), so a selected row stays selected while the user types
      last.event = event;
      last.sourceIds.push(event.id);
      continue;
    }

    if (last && event.kind === WatchEventKind.NAVIGATE) {
      const caused =
        (last.event.kind === WatchEventKind.CLICK || last.event.kind === WatchEventKind.KEY_PRESS) &&
        !last.opensUrl &&
        event.navigation !== NavigationKind.BACK_FORWARD &&
        event.navigation !== NavigationKind.RELOAD &&
        event.time - last.event.time <= NAVIGATION_CAUSE_MS;
      if (caused) {
        last.opensUrl = event.url;
        last.sourceIds.push(event.id);
        continue;
      }
      const lastPage = last.event.kind === WatchEventKind.NAVIGATE ? last.event.url : last.opensUrl;
      const sameEndpoint = (last.event.kind === WatchEventKind.NAVIGATE || !!last.opensUrl) && pathOf(lastPage) === pathOf(event.url);
      if (sameEndpoint && event.time - last.event.time <= REDIRECT_MS + NAVIGATION_CAUSE_MS) {
        last.sourceIds.push(event.id);
        continue;
      }
      if (last.event.kind === WatchEventKind.NAVIGATE && event.time - last.event.time <= REDIRECT_MS) {
        // Redirected: the page that was shown in the end is the one to open
        last.event = { ...last.event, url: event.url, label: event.label };
        last.sourceIds.push(event.id);
        continue;
      }
    }

    const repeatable = event.kind === WatchEventKind.CLICK || event.kind === WatchEventKind.KEY_PRESS;
    if (last && repeatable && !last.opensUrl && eventSignature(last.event) === eventSignature(event)) {
      last.repeat++;
      last.sourceIds.push(event.id);
      continue;
    }

    items.push({ id: event.id, event, sourceIds: [event.id], repeat: 1 });
  }
  return items;
}

export function logItems(events: WatchEvent[], mode: WatchLogMode): WatchLogItem[] {
  return mode === WatchLogMode.RAW ? rawItems(events) : smartItems(events);
}

/**
 * Scenario steps for log rows, in the order of the rows. Typing takes its text from `values` (by event id).
 * A navigation is a "go to the page" step; a step that opened a page needs nothing more (it opens it again).
 */
export function itemsToSteps(items: WatchLogItem[], values: ReadonlyMap<string, string>): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  for (const item of items) {
    const { event } = item;
    if (event.kind === WatchEventKind.NAVIGATE) {
      if (event.url) steps.push({ type: StepType.NAVIGATE, value: event.url, enableNavigation: true });
      continue;
    }
    const typed = event.kind === WatchEventKind.INPUT ? values.get(event.id) : undefined;
    const [step] = eventsToSteps([event], new Map(typed !== undefined ? [[event.xpath, typed]] : []));
    for (let i = 0; i < item.repeat; i++) steps.push({ ...step });
  }
  return steps;
}

/** The ids of every raw event behind the given rows */
export function sourceIdsOf(items: WatchLogItem[]): string[] {
  return items.flatMap((item) => item.sourceIds);
}

/** The actions repeats are looked for in: the smart view of one site, without page changes */
export function patternActions(events: WatchEvent[], origin: string): WatchEvent[] {
  const own = events.filter((event) => event.origin === origin).slice(-WATCH_EVENT_LIMIT * 2);
  return smartItems(own)
    .filter((item) => item.event.kind !== WatchEventKind.NAVIGATE)
    .flatMap((item) => Array.from({ length: item.repeat }, () => item.event))
    .slice(-WATCH_EVENT_LIMIT);
}
