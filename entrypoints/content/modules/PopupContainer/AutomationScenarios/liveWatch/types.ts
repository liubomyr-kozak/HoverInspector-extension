/**
 * Live watching: types shared by the watcher, the pattern finder and the suggestion card
 */

/** What the user did. Mirrors the scenario step types that a watched action turns into. */
export enum WatchEventKind {
  CLICK = "click",
  INPUT = "input",
  SELECT = "select",
  KEY_PRESS = "keyPress",
}

/**
 * One user action seen while live watching is on. Typed text is never part of it: an input event only says
 * which field was filled (the value lives in memory for the current page, see LiveWatcher).
 */
export interface WatchEvent {
  id: string;
  kind: WatchEventKind;
  xpath: string;
  alternativeXpaths?: string[];
  /** Select: the chosen value. Key press: the key combo. Checkbox click: "checked" / "unchecked". */
  value?: string;
  /** Short human name of the element ("Save", "Email"), shown in suggestions */
  label: string;
  /** Page origin: patterns are only looked for among the events of the current site */
  origin: string;
  time: number;
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
  /** The last actions start a repeated pattern: offer the rest */
  CONTINUE_PATTERN = "continuePattern",
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
  | { kind: SuggestionKind.CONTINUE_PATTERN; pattern: DetectedPattern; doneCount: number }
  | ({ kind: SuggestionKind.CONTINUE_SCENARIO } & ScenarioContinuation)
  | { kind: SuggestionKind.FIELD; fieldXpath: string; fieldLabel: string; matches: FieldScenarioMatch[] };

/** Live watching preferences, kept in browser.storage.local */
export interface LiveWatchSettings {
  /** Off until the user turns it on */
  enabled: boolean;
  /** Patterns the user asked not to suggest again */
  dismissedPatterns: string[];
  /** Fields for which the user asked not to suggest scenarios again */
  mutedFields: string[];
}
