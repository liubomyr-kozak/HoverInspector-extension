import { browser } from "wxt/browser";
import { ScenarioStep, StepType } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";

/**
 * Replay of log rows ("Play" in the watch log). Unlike a scenario run there is no scenario and no history
 * entry; only the steps and how far the replay got are kept, so that a step which opens another page lets
 * the replay go on there (the content script of the new page picks it up).
 */
export const LIVE_WATCH_REPLAY_KEY = "automationLiveWatchReplay";

/** A replay not moved forward for this long was abandoned (the tab was closed, the browser crashed) */
export const REPLAY_MAX_AGE_MS = 30 * 1000;

export interface ReplaySession {
  id: string;
  steps: ScenarioStep[];
  /** The step to do next */
  index: number;
  /** The tab that plays; another tab never picks the replay up */
  tabId: number | null;
  updatedAt: number;
  /** The step at `index` was started and may have left the page: on the next page it counts as done */
  started: boolean;
  /** The log row each step comes from, to show the progress in the list */
  rowIds: string[];
}

const STEP_TYPES = Object.values(StepType) as string[];

function sanitizeStep(raw: unknown): ScenarioStep | null {
  if (!raw || typeof raw !== "object") return null;
  const step = raw as Record<string, unknown>;
  if (typeof step.type !== "string" || !STEP_TYPES.includes(step.type)) return null;
  const clean: ScenarioStep = { type: step.type as StepType };
  if (typeof step.xpath === "string") clean.xpath = step.xpath;
  if (Array.isArray(step.alternativeXpaths)) clean.alternativeXpaths = step.alternativeXpaths.filter((x): x is string => typeof x === "string");
  if (typeof step.value === "string") clean.value = step.value;
  if (typeof step.enableNavigation === "boolean") clean.enableNavigation = step.enableNavigation;
  return clean;
}

export function sanitizeReplay(raw: unknown): ReplaySession | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string" || !Array.isArray(value.steps) || typeof value.index !== "number" || typeof value.updatedAt !== "number") {
    return null;
  }
  const steps = value.steps.map(sanitizeStep);
  if (steps.some((step) => step === null)) return null;
  return {
    id: value.id,
    steps: steps as ScenarioStep[],
    index: Math.max(0, Math.floor(value.index)),
    tabId: typeof value.tabId === "number" ? value.tabId : null,
    updatedAt: value.updatedAt,
    started: value.started === true,
    rowIds: Array.isArray(value.rowIds) ? value.rowIds.filter((id): id is string => typeof id === "string") : [],
  };
}

/** Whether the replay still has steps to do and was moved forward lately (the last step may have just opened this page) */
export function isReplayFresh(session: ReplaySession | null, now = Date.now()): session is ReplaySession {
  if (!session) return false;
  const next = session.started ? session.index + 1 : session.index;
  return next < session.steps.length && now - session.updatedAt <= REPLAY_MAX_AGE_MS;
}

/** Whether a replay plays in this tab now (a tab whose id is unknown counts as that tab) */
export function isReplayingIn(session: ReplaySession | null, tabId: number | null, now = Date.now()): boolean {
  return isReplayFresh(session, now) && (session.tabId === null || tabId === null || session.tabId === tabId);
}

/** Whether this page was opened by a step of the replay (also its last step, which leaves nothing to do) */
export function isReplayLanding(session: ReplaySession | null, tabId: number | null, now = Date.now()): boolean {
  if (!session || now - session.updatedAt > REPLAY_MAX_AGE_MS) return false;
  if (session.tabId !== null && tabId !== null && session.tabId !== tabId) return false;
  return session.started || isReplayFresh(session, now);
}

/**
 * Where a replay goes on after a page load in `tabId`: null when it is not this tab's, finished or stale.
 * A step that was started before the page changed is done (it most likely opened this page).
 */
export function resumeIndex(session: ReplaySession | null, tabId: number | null, now = Date.now()): number | null {
  if (!isReplayFresh(session, now)) return null;
  if (session.tabId !== null && tabId !== null && session.tabId !== tabId) return null;
  return session.started ? session.index + 1 : session.index;
}

const local = () => browser?.storage?.local;

export async function loadReplay(): Promise<ReplaySession | null> {
  try {
    const stored = await local()?.get(LIVE_WATCH_REPLAY_KEY);
    return sanitizeReplay(stored?.[LIVE_WATCH_REPLAY_KEY]);
  } catch {
    return null;
  }
}

export function saveReplay(session: ReplaySession): Promise<void> {
  return (local()?.set({ [LIVE_WATCH_REPLAY_KEY]: session }) ?? Promise.resolve()).catch(() => undefined);
}

export function clearReplay(): Promise<void> {
  return (local()?.remove(LIVE_WATCH_REPLAY_KEY) ?? Promise.resolve()).catch(() => undefined);
}
