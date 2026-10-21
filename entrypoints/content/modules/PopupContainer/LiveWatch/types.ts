/**
 * Live watching: types shared by the capture script, the watch log, the pattern finder and the cards
 */

/** What the user did. Mirrors the scenario step types that a watched action turns into. */
export enum WatchEventKind {
  CLICK = "click",
  INPUT = "input",
  SELECT = "select",
  KEY_PRESS = "keyPress",
  /** A new page, a reload, back / forward, or a URL change inside a single-page app */
  NAVIGATE = "navigate",
}

/** How a page was reached */
export enum NavigationKind {
  LOAD = "load",
  RELOAD = "reload",
  BACK_FORWARD = "backForward",
  /** history.pushState / replaceState / hash change: same document */
  SAME_DOCUMENT = "sameDocument",
}

/**
 * One user action seen while live watching is on. The text typed in a field is not part of it: it is kept
 * in the browser's session storage (memory, cleared when the browser closes), see log/logStorage.ts.
 */
export interface WatchEvent {
  id: string;
  kind: WatchEventKind;
  /** Empty for navigations */
  xpath: string;
  alternativeXpaths?: string[];
  /** Select: the chosen value. Key press: the key combo. Checkbox click: "checked" / "unchecked". */
  value?: string;
  /** Short human name of the element ("Save", "Email"), or the page title for a navigation */
  label: string;
  /** Page origin: patterns are only looked for among the events of the current site */
  origin: string;
  time: number;
  /** The page the action happened on; for a navigation, the page it led to */
  url?: string;
  /** Navigation only */
  navigation?: NavigationKind;
  /**
   * Raw log only, dropped by the smart view: a click on something that is not a control (text, empty space),
   * a click that only focuses a field, a key that only moves the focus or the caret
   */
  minor?: boolean;
  /** Typing in a password or card field: the text is never read */
  sensitive?: boolean;
}

/** A sequence of actions the user repeated */
export interface DetectedPattern {
  /** Stable id from the action signatures, used to remember dismissed patterns */
  id: string;
  /** The actions of the last occurrence (labels and locators are the freshest there) */
  events: WatchEvent[];
  occurrences: number;
  /** Index in the event list right after the last occurrence */
  lastEnd: number;
}

/** Why the suggestion card is open */
export enum SuggestionKind {
  /** A repeated pattern was found */
  PATTERN = "pattern",
  /** The last actions start a saved scenario: offer the rest */
  CONTINUE_SCENARIO = "continueScenario",
  /** The clicked field is used by saved scenarios */
  FIELD = "field",
}

/** The last actions are the first steps of a saved scenario */
export interface ScenarioContinuation {
  scenarioId: string;
  title: string;
  /** Index in the scenario's steps where the playback continues */
  nextStepIndex: number;
  /** Actions (clicks, typing...) left to do */
  remaining: number;
}

/** A saved scenario that uses the clicked field */
export interface FieldScenarioMatch {
  scenarioId: string;
  title: string;
  stepIndex: number;
  stepCount: number;
}

export type Suggestion =
  | { kind: SuggestionKind.PATTERN; pattern: DetectedPattern }
  | ({ kind: SuggestionKind.CONTINUE_SCENARIO } & ScenarioContinuation)
  | { kind: SuggestionKind.FIELD; fieldXpath: string; fieldLabel: string; matches: FieldScenarioMatch[] };

/** How the watch log lists the actions */
export enum WatchLogMode {
  /** Merged and cleaned up: what a scenario would need */
  SMART = "smart",
  /** Everything that was seen, one row per event */
  RAW = "raw",
}

/** Where the user left the watch log panel */
export interface WatchPanelLayout {
  open: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Live watching preferences, kept in browser.storage.local */
export interface LiveWatchSettings {
  /** Off until the user turns it on */
  enabled: boolean;
  /** Patterns the user asked not to suggest again */
  dismissedPatterns: string[];
  /** Fields for which the user asked not to suggest scenarios again */
  mutedFields: string[];
  mode: WatchLogMode;
  /** How many events the log keeps (across all sites); the oldest are forgotten first */
  limit: number;
  /** The log lists every site, not only the one the tab is on */
  allSites: boolean;
  panel: WatchPanelLayout;
}

/**
 * One row of the watch log. In the raw view, one event. In the smart view, one action that may stand for
 * several raw events (typing in a field, a click and the page it opened, the same click repeated).
 */
export interface WatchLogItem {
  /** Unique in the list: the id of the first event behind the row */
  id: string;
  /** The event whose locator, label and value the row shows and plays */
  event: WatchEvent;
  /** Ids of every raw event behind the row, oldest first */
  sourceIds: string[];
  /** The same action done this many times in a row (played as many times) */
  repeat: number;
  /** The click or key that opened this page (smart view: the navigation is part of the click) */
  opensUrl?: string;
}
