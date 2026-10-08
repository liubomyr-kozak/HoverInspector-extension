import { ScenarioMap, ScenarioStep, StepType } from "../../types";
import { describeKeyCombo } from "../../utils/keyboardUtils";
import { DetectedPattern, FieldScenarioMatch, ScenarioContinuation, WatchEvent, WatchEventKind } from "../types";

/** How many events live watching keeps (across all sites) */
export const WATCH_EVENT_LIMIT = 1000;

/** A pause this long starts a new session: a pattern never spans it */
export const SESSION_GAP_MS = 30 * 60 * 1000;

const MIN_PATTERN_LENGTH = 2;
const MAX_PATTERN_LENGTH = 12;
/** Two actions repeated twice is common by chance; ask for a third time before calling it a pattern */
const MIN_OCCURRENCES_SHORT = 3;
const MIN_OCCURRENCES = 2;
/** How many of the last actions must match the start of a pattern or scenario before the rest is offered */
const MIN_CONTINUATION_PREFIX = 2;
const MAX_CONTINUATION_PREFIX = 6;

const SEP = "␟";

const STEP_KIND: Partial<Record<StepType, WatchEventKind>> = {
  [StepType.CLICK]: WatchEventKind.CLICK,
  [StepType.INPUT]: WatchEventKind.INPUT,
  [StepType.SELECT]: WatchEventKind.SELECT,
  [StepType.KEY_PRESS]: WatchEventKind.KEY_PRESS,
};

const KIND_STEP: Record<WatchEventKind, StepType> = {
  [WatchEventKind.CLICK]: StepType.CLICK,
  [WatchEventKind.INPUT]: StepType.INPUT,
  [WatchEventKind.SELECT]: StepType.SELECT,
  [WatchEventKind.KEY_PRESS]: StepType.KEY_PRESS,
};

/**
 * What makes two actions "the same": the kind, the element and, except for typing, the value.
 * Typing into the same field with other text is the same action (the text is asked for on playback).
 */
export function eventSignature(event: Pick<WatchEvent, "kind" | "xpath" | "value">): string {
  const value = event.kind === WatchEventKind.INPUT ? "" : (event.value ?? "");
  return `${event.kind}${SEP}${event.xpath}${SEP}${value}`;
}

/** The signature of a scenario step, or null for steps a user does not perform by hand (wait, code...) */
export function stepSignature(step: ScenarioStep): string | null {
  const action = stepAction(step);
  return action ? eventSignature(action) : null;
}

/** The parts of an action that say what was done where; a watched event and a scenario step both have them */
type ActionLike = Pick<WatchEvent, "kind" | "xpath" | "value" | "alternativeXpaths">;

function stepAction(step: ScenarioStep): ActionLike | null {
  const kind = STEP_KIND[step.type];
  if (!kind || !step.xpath) return null;
  return { kind, xpath: step.xpath, value: step.value, alternativeXpaths: step.alternativeXpaths };
}

/**
 * The locators that identify the element of an action. The best locator of an element changes from visit to
 * visit (a text match becomes ambiguous, an id appears...), so the alternatives count too. A full
 * /html/body/... path is only kept when it is the primary one: on another page of the site the same path is
 * often a different element.
 */
function actionLocators(action: ActionLike): string[] {
  const alternatives = (action.alternativeXpaths || []).filter((xpath) => !!xpath && !xpath.startsWith("/html"));
  const value = action.kind === WatchEventKind.INPUT ? "" : (action.value ?? "");
  return [action.xpath, ...alternatives].map((xpath) => `${action.kind}${SEP}${xpath}${SEP}${value}`);
}

/** Whether two actions are the same: same kind and value (except typed text), and a locator in common */
export function sameAction(a: ActionLike, b: ActionLike): boolean {
  const locators = new Set(actionLocators(a));
  return actionLocators(b).some((locator) => locators.has(locator));
}

/**
 * Gives every event a number: the same number for the same action, even when its best locator changed
 * between visits (two events share a number when a chain of shared locators links them)
 */
function actionIds(events: WatchEvent[]): number[] {
  const parent: number[] = events.map((_, index) => index);
  const root = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const owner = new Map<string, number>();
  events.forEach((event, index) => {
    for (const locator of actionLocators(event)) {
      const other = owner.get(locator);
      if (other === undefined) owner.set(locator, index);
      else parent[root(index)] = root(other);
    }
  });
  const numbers = new Map<number, number>();
  return events.map((_, index) => {
    const key = root(index);
    let id = numbers.get(key);
    if (id === undefined) {
      id = numbers.size;
      numbers.set(key, id);
    }
    return id;
  });
}

/** Short, stable id for a list of signatures (djb2), used to remember dismissed patterns */
export function hashSignatures(signatures: string[]): string {
  let hash = 5381;
  const text = signatures.join(SEP);
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `p${(hash >>> 0).toString(36)}${signatures.length}`;
}

interface Candidate {
  ids: number[];
  length: number;
  occurrences: number;
  lastStart: number;
}

export interface FindPatternsOptions {
  limit?: number;
  /** Patterns not to return (dismissed, already saved); they do not count against `limit` */
  exclude?: (pattern: DetectedPattern) => boolean;
}

/**
 * Finds action sequences the user repeated. Runs in O(events × MAX_PATTERN_LENGTH) on integer ids, so a full
 * buffer of 1000 events takes a few milliseconds.
 *
 * - occurrences are counted without overlap; two-step sequences need 3, longer ones 2
 * - a sequence of one repeated action ("Next", "Next"...) is not a pattern
 * - a sequence never spans a pause longer than SESSION_GAP_MS
 * - a pattern contained in a better one (or a rotation of it: ABCABC also holds BCA) is dropped
 * - the same element counts as the same action even when its best locator changed (see sameAction)
 *
 * @returns the best patterns first
 */
export function findPatterns(events: WatchEvent[], { limit = 5, exclude }: FindPatternsOptions = {}): DetectedPattern[] {
  const n = events.length;
  if (n < MIN_PATTERN_LENGTH * MIN_OCCURRENCES) return [];

  const ids = actionIds(events);

  // breaksBefore[i]: how many session breaks there are before event i (a window i..j crosses one if the counts differ)
  const breaksBefore = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    breaksBefore[i] = breaksBefore[i - 1] + (events[i].time - events[i - 1].time > SESSION_GAP_MS ? 1 : 0);
  }

  const candidates: Candidate[] = [];
  for (let length = MIN_PATTERN_LENGTH; length <= Math.min(MAX_PATTERN_LENGTH, Math.floor(n / 2)); length++) {
    const starts = new Map<string, number[]>();
    for (let i = 0; i + length <= n; i++) {
      if (breaksBefore[i] !== breaksBefore[i + length - 1]) continue;
      const key = ids.slice(i, i + length).join(",");
      const list = starts.get(key);
      if (list) list.push(i);
      else starts.set(key, [i]);
    }

    const needed = length === MIN_PATTERN_LENGTH ? MIN_OCCURRENCES_SHORT : MIN_OCCURRENCES;
    starts.forEach((positions) => {
      if (positions.length < needed) return;
      const windowIds = ids.slice(positions[0], positions[0] + length);
      if (new Set(windowIds).size < 2) return;
      let occurrences = 0;
      let lastStart = -Infinity;
      for (const start of positions) {
        if (start < lastStart + length) continue;
        occurrences++;
        lastStart = start;
      }
      if (occurrences >= needed) candidates.push({ ids: windowIds, length, occurrences, lastStart });
    });
  }

  // More repeated work first: a long sequence done twice beats two clicks done three times
  candidates.sort(
    (a, b) =>
      b.length * (b.occurrences - 1) - a.length * (a.occurrences - 1) || b.length - a.length || b.lastStart - a.lastStart,
  );

  // Excluded patterns still cover their parts (a hidden pattern is not offered again piece by piece), but
  // they do not count against the limit: five hidden patterns must not leave nothing to suggest
  const covering: Set<number>[] = [];
  const accepted: DetectedPattern[] = [];
  for (const candidate of candidates) {
    if (accepted.length >= limit) break;
    if (covering.some((idSet) => candidate.ids.every((id) => idSet.has(id)))) continue;
    const occurrence = events.slice(candidate.lastStart, candidate.lastStart + candidate.length);
    const pattern: DetectedPattern = {
      id: hashSignatures(occurrence.map(eventSignature)),
      events: occurrence,
      occurrences: candidate.occurrences,
      lastEnd: candidate.lastStart + candidate.length,
    };
    covering.push(new Set(candidate.ids));
    if (!exclude?.(pattern)) accepted.push(pattern);
  }

  return accepted;
}

/** The longest k (2…) for which the last k actions are `sequence[0..k)`, or 0 */
function matchedPrefix(tail: ActionLike[], sequence: ActionLike[]): number {
  const most = Math.min(MAX_CONTINUATION_PREFIX, tail.length, sequence.length - 1);
  for (let k = most; k >= MIN_CONTINUATION_PREFIX; k--) {
    let same = true;
    for (let i = 0; i < k && same; i++) same = sameAction(tail[tail.length - k + i], sequence[i]);
    if (same) return k;
  }
  return 0;
}

/**
 * Whether the last actions are the first steps of a known pattern (with at least one step left)
 */
export function matchPatternContinuation(
  events: WatchEvent[],
  patterns: DetectedPattern[],
): { pattern: DetectedPattern; doneCount: number } | null {
  const tail = events.slice(-MAX_CONTINUATION_PREFIX);
  let best: { pattern: DetectedPattern; doneCount: number } | null = null;
  for (const pattern of patterns) {
    const done = matchedPrefix(tail, pattern.events);
    if (!done) continue;
    if (!best || done > best.doneCount || (done === best.doneCount && pattern.events.length > best.pattern.events.length)) {
      best = { pattern, doneCount: done };
    }
  }
  return best;
}

/** The steps of a scenario a user performs by hand, with their index in the scenario */
function manualSteps(steps: ScenarioStep[]): { action: ActionLike; signature: string; index: number }[] {
  const result: { action: ActionLike; signature: string; index: number }[] = [];
  steps.forEach((step, index) => {
    const action = stepAction(step);
    if (action) result.push({ action, signature: eventSignature(action), index });
  });
  return result;
}

/**
 * Whether the last actions are the first manual steps of a saved scenario: the rest can be played from there
 */
export function matchScenarioContinuation(events: WatchEvent[], scenarios: ScenarioMap): ScenarioContinuation | null {
  const tail = events.slice(-MAX_CONTINUATION_PREFIX);
  let best: (ScenarioContinuation & { done: number }) | null = null;
  for (const [scenarioId, scenario] of Object.entries(scenarios)) {
    const manual = manualSteps(scenario.data || []);
    const done = matchedPrefix(tail, manual.map((step) => step.action));
    if (!done || (best && best.done >= done)) continue;
    best = {
      scenarioId,
      title: scenario.title,
      nextStepIndex: manual[done - 1].index + 1,
      remaining: manual.length - done,
      done,
    };
  }
  if (!best) return null;
  return { scenarioId: best.scenarioId, title: best.title, nextStepIndex: best.nextStepIndex, remaining: best.remaining };
}

/** Whether a saved scenario already holds this pattern (then it is not suggested) */
export function isPatternSaved(pattern: DetectedPattern, scenarios: ScenarioMap): boolean {
  const wanted = pattern.events.map(eventSignature).join("\n");
  return Object.values(scenarios).some((scenario) =>
    `\n${manualSteps(scenario.data || [])
      .map((step) => step.signature)
      .join("\n")}\n`.includes(`\n${wanted}\n`),
  );
}

/**
 * Saved scenarios with a step on this field (matched by any of the field's locators)
 */
export function findFieldScenarios(xpaths: string[], scenarios: ScenarioMap): FieldScenarioMatch[] {
  const wanted = new Set(xpaths.filter(Boolean));
  if (!wanted.size) return [];
  const matches: FieldScenarioMatch[] = [];
  for (const [scenarioId, scenario] of Object.entries(scenarios)) {
    const steps = scenario.data || [];
    const stepIndex = steps.findIndex(
      (step) =>
        !!STEP_KIND[step.type] &&
        [step.xpath, ...(step.alternativeXpaths || [])].some((xpath) => !!xpath && wanted.has(xpath)),
    );
    if (stepIndex >= 0) matches.push({ scenarioId, title: scenario.title, stepIndex, stepCount: steps.length });
  }
  return matches;
}

/**
 * Scenario steps for watched actions. Typing steps take the text from `typedValues` (by locator) when it is
 * known, else they stay empty and the text is asked for on playback.
 */
export function eventsToSteps(events: WatchEvent[], typedValues: ReadonlyMap<string, string> = new Map()): ScenarioStep[] {
  return events.map((event) => {
    const step: ScenarioStep = {
      type: KIND_STEP[event.kind],
      xpath: event.xpath,
      alternativeXpaths: event.alternativeXpaths || [],
    };
    const value = event.kind === WatchEventKind.INPUT ? typedValues.get(event.xpath) : event.value;
    if (value !== undefined) step.value = value;
    return step;
  });
}

/** An action split for display: the verb, the element (or key) and an optional detail (the chosen option) */
export interface EventParts {
  verb: string;
  target: string;
  detail?: string;
}

export function describeEventParts(event: Pick<WatchEvent, "kind" | "label" | "value">): EventParts {
  const target = event.label || "element";
  switch (event.kind) {
    case WatchEventKind.CLICK:
      if (event.value === "checked") return { verb: "Tick", target };
      if (event.value === "unchecked") return { verb: "Untick", target };
      return { verb: "Click", target };
    case WatchEventKind.INPUT:
      return { verb: "Fill", target };
    case WatchEventKind.SELECT:
      return { verb: "Choose", target, ...(event.value ? { detail: event.value } : {}) };
    case WatchEventKind.KEY_PRESS:
      return { verb: "Press", target: describeKeyCombo(event.value) };
    default:
      return { verb: "", target };
  }
}

/** One-line description of an action, e.g. Click "Save", Fill "Email", Press Enter */
export function describeEvent(event: Pick<WatchEvent, "kind" | "label" | "value">): string {
  const { verb, target, detail } = describeEventParts(event);
  if (event.kind === WatchEventKind.KEY_PRESS) return `${verb} ${target}`;
  const name = event.label ? `"${target}"` : "the element";
  if (event.kind === WatchEventKind.SELECT) return `${verb} ${detail ? `"${detail}"` : "an option"} in ${name}`;
  return `${verb} ${name}`;
}

/**
 * Adds new events to the stored ones: no duplicates (several tabs write the same list), oldest first, and
 * only the newest WATCH_EVENT_LIMIT are kept
 */
export function mergeEvents(stored: WatchEvent[], added: WatchEvent[], limit = WATCH_EVENT_LIMIT): WatchEvent[] {
  const seen = new Set(stored.map((event) => event.id));
  const merged = stored.concat(added.filter((event) => !seen.has(event.id)));
  merged.sort((a, b) => a.time - b.time);
  return merged.length > limit ? merged.slice(merged.length - limit) : merged;
}

/** Keeps only well-formed events (the stored list may come from an older version or be damaged) */
export function sanitizeEvents(raw: unknown): WatchEvent[] {
  if (!Array.isArray(raw)) return [];
  const kinds = Object.values(WatchEventKind) as string[];
  return raw.filter(
    (item): item is WatchEvent =>
      !!item &&
      typeof item === "object" &&
      typeof (item as WatchEvent).id === "string" &&
      kinds.includes((item as WatchEvent).kind) &&
      typeof (item as WatchEvent).xpath === "string" &&
      typeof (item as WatchEvent).origin === "string" &&
      typeof (item as WatchEvent).time === "number",
  );
}
