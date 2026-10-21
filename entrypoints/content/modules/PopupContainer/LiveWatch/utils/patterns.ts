import { ScenarioMap, ScenarioStep, StepType } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import { describeKeyCombo } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/keyboardUtils";
import { DetectedPattern, FieldScenarioMatch, ScenarioContinuation, WatchEvent, WatchEventKind } from "../types";

/** How many of the latest actions on a site patterns are looked for in */
export const WATCH_EVENT_LIMIT = 1000;

/** A pause this long starts a new session: a pattern never spans it */
export const SESSION_GAP_MS = 30 * 60 * 1000;

const MIN_PATTERN_LENGTH = 2;
/** Long enough for a whole round of work (log in, open a list, open an item, edit, save...) */
const MAX_PATTERN_LENGTH = 30;
/** Two actions repeated twice is common by chance; ask for a third time before calling it a pattern */
const MIN_OCCURRENCES_SHORT = 3;
const MIN_OCCURRENCES = 2;
/** How many of the last actions must match the start of a saved scenario before the rest is offered */
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
  [WatchEventKind.NAVIGATE]: StepType.NAVIGATE,
};

/**
 * What makes two actions "the same": the kind, the element and, except for typing, the value.
 * Typing into the same field with other text is the same action (the text is asked for on playback).
 */
export function eventSignature(event: Pick<WatchEvent, "kind" | "xpath" | "value">): string {
  const value = event.kind === WatchEventKind.INPUT ? "" : (event.value ?? "");
  return `${event.kind}${SEP}${event.xpath}${SEP}${value}`;
}

/** Ids and hashes (a GUID, a hex token with a digit) and then any number */
const ID_TOKEN = /\b(?=[0-9a-f-]*\d)[0-9a-f]{6,}(?:-[0-9a-f]+)*\b/gi;
const NUMBER = /\d+/g;
const generalize = (text: string) => text.replace(ID_TOKEN, "#").replace(NUMBER, "#");

/**
 * What makes two actions "the same step" of repeated work: what the user sees, the kind and the label.
 * Each round usually opens another row, so row numbers, ids and counters are ignored. The locator is not
 * compared when there is a label: the same "Admin" is reached from the menu or the breadcrumb, and the same
 * table cell is found as a <td> or the <div> inside it. Without a label, the locator decides.
 */
export function patternSignature(event: Pick<WatchEvent, "kind" | "xpath" | "value" | "label">): string {
  const value = event.kind === WatchEventKind.INPUT ? "" : generalize(event.value ?? "");
  const label = generalize((event.label ?? "").trim());
  return `${event.kind}${SEP}${label || generalize(event.xpath)}${SEP}${value}`;
}

/** The signature of a scenario step, or null for steps a user does not perform by hand (wait, code...) */
export function stepSignature(step: ScenarioStep): string | null {
  const kind = STEP_KIND[step.type];
  if (!kind || !step.xpath) return null;
  return eventSignature({ kind, xpath: step.xpath, value: step.value });
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
  /** Length of the last occurrence: a round with an extra or a missing step differs from `length` */
  lastLength: number;
}

/** Chains this long or longer also count rounds that differ a little (a step more, less or another) */
const FUZZY_MIN_LENGTH = 6;
/** Share of a chain's steps already in better chains that makes it a repeat of them */
const MOSTLY_OFFERED = 0.75;
/** How many exact chains are checked for rounds that differ a little, best first */
const FUZZY_CANDIDATES = 12;

/** Length of the longest common subsequence of two id lists */
function commonLength(a: number[], b: number[]): number {
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      row[j] = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], row[j - 1]);
    }
    previous = row;
  }
  return previous[b.length];
}

/**
 * Counts the rounds of a chain, letting a round differ from it by about a quarter of its steps (a dialog
 * opened once, another menu item, a double click). A round starts with the chain's first step, never spans
 * a long pause, and rounds don't overlap.
 */
function fuzzyRounds(ids: number[], template: number[], breaksBefore: number[]): { count: number; lastStart: number; lastLength: number } {
  const length = template.length;
  const tolerance = Math.floor(length / 4);
  let count = 0;
  let lastStart = -1;
  let lastLength = length;
  for (let i = 0; i < ids.length; ) {
    if (ids[i] !== template[0]) {
      i++;
      continue;
    }
    let best = 0;
    let bestLength = 0;
    for (let w = length - tolerance; w <= length + tolerance && i + w <= ids.length; w++) {
      if (breaksBefore[i] !== breaksBefore[i + w - 1]) break;
      const common = commonLength(template, ids.slice(i, i + w));
      // The closest round: most steps in common, then the length nearest the chain's
      if (common > best || (common === best && Math.abs(w - length) < Math.abs(bestLength - length))) {
        best = common;
        bestLength = w;
      }
    }
    if (best >= length - tolerance && best - (bestLength - best) >= length - 2 * tolerance) {
      count++;
      lastStart = i;
      lastLength = bestLength;
      i += bestLength;
    } else {
      i++;
    }
  }
  return { count, lastStart, lastLength };
}

/**
 * Finds action sequences the user repeated. Runs in O(events × MAX_PATTERN_LENGTH) on integer ids, so a full
 * buffer of 1000 events takes a few milliseconds.
 *
 * - occurrences are counted without overlap; two-step sequences need 3, longer ones 2
 * - a sequence of one repeated action ("Next", "Next"...) is not a pattern
 * - a sequence never spans a pause longer than SESSION_GAP_MS
 * - a pattern contained in a better one (or a rotation of it: ABCABC also holds BCA) is dropped
 *
 * @returns the best patterns first
 */
export function findPatterns(events: WatchEvent[], limit = 5): DetectedPattern[] {
  const n = events.length;
  if (n < MIN_PATTERN_LENGTH * MIN_OCCURRENCES) return [];

  const signatures = events.map(patternSignature);
  const intern = new Map<string, number>();
  const ids = signatures.map((sig) => {
    let id = intern.get(sig);
    if (id === undefined) {
      id = intern.size;
      intern.set(sig, id);
    }
    return id;
  });

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
      if (occurrences >= needed) candidates.push({ ids: windowIds, length, occurrences, lastStart, lastLength: length });
    });
  }

  // The same work done again rarely repeats exactly: count the rounds that differ a little too
  const byScore = (a: Candidate, b: Candidate) =>
    b.length * (b.occurrences - 1) - a.length * (a.occurrences - 1) || b.length - a.length || b.lastStart - a.lastStart;
  candidates.sort(byScore);
  candidates
    .filter((candidate) => candidate.length >= FUZZY_MIN_LENGTH)
    .slice(0, FUZZY_CANDIDATES)
    .forEach((candidate) => {
      const rounds = fuzzyRounds(ids, candidate.ids, breaksBefore);
      if (rounds.count <= candidate.occurrences) return;
      candidate.occurrences = rounds.count;
      candidate.lastStart = rounds.lastStart;
      candidate.lastLength = rounds.lastLength;
    });

  // More repeated work first: a long sequence done twice beats two clicks done three times
  candidates.sort(byScore);

  // A chain made mostly of steps already offered (a part of a better chain, a rotation of it, two chains
  // glued together) is the same work seen from another step: offered once
  const accepted: Candidate[] = [];
  const offered = new Set<number>();
  for (const candidate of candidates) {
    if (accepted.length >= limit) break;
    const steps = new Set(candidate.ids);
    const known = [...steps].filter((id) => offered.has(id)).length;
    // One new step is not new work (often the step between two rounds), a quarter of them is not either
    if (steps.size - known <= Math.max(1, steps.size * (1 - MOSTLY_OFFERED))) continue;
    accepted.push(candidate);
    steps.forEach((id) => offered.add(id));
  }

  return accepted.map((candidate) => {
    // The id comes from the chain, the steps from its latest round, as the user last did them
    const template = events.slice(candidate.lastStart, candidate.lastStart + candidate.lastLength);
    const signatures = [...intern.keys()];
    return {
      id: hashSignatures(candidate.ids.map((id) => signatures[id])),
      events: template,
      occurrences: candidate.occurrences,
      lastEnd: candidate.lastStart + candidate.lastLength,
    };
  });
}

/** The longest k (2…) for which the last k signatures equal `sequence[start..start+k)`, or 0 */
function matchedPrefix(tail: string[], sequence: string[], start: number): number {
  const most = Math.min(MAX_CONTINUATION_PREFIX, tail.length, sequence.length - start - 1);
  for (let k = most; k >= MIN_CONTINUATION_PREFIX; k--) {
    let same = true;
    for (let i = 0; i < k && same; i++) same = tail[tail.length - k + i] === sequence[start + i];
    if (same) return k;
  }
  return 0;
}

/** The steps of a scenario a user performs by hand, with their index in the scenario */
function manualSteps(steps: ScenarioStep[]): { signature: string; index: number }[] {
  const result: { signature: string; index: number }[] = [];
  steps.forEach((step, index) => {
    const signature = stepSignature(step);
    if (signature) result.push({ signature, index });
  });
  return result;
}

/**
 * Whether the last actions are the first manual steps of a saved scenario: the rest can be played from there
 */
export function matchScenarioContinuation(events: WatchEvent[], scenarios: ScenarioMap): ScenarioContinuation | null {
  const tail = events.slice(-MAX_CONTINUATION_PREFIX).map(eventSignature);
  let best: (ScenarioContinuation & { done: number }) | null = null;
  for (const [scenarioId, scenario] of Object.entries(scenarios)) {
    const manual = manualSteps(scenario.data || []);
    const done = matchedPrefix(tail, manual.map((step) => step.signature), 0);
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
    if (event.kind === WatchEventKind.NAVIGATE) {
      step.value = event.url;
      step.enableNavigation = true;
      return step;
    }
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
    case WatchEventKind.NAVIGATE:
      return { verb: "Open", target };
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
